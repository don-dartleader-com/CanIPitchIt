#!/usr/bin/env node

/**
 * Migration script to transfer data from SQLite to PostgreSQL
 * Run this script after setting up your PostgreSQL RDS instance
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, '../backend/database.sqlite');
const PG_CONFIG = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

class DatabaseMigrator {
  constructor() {
    this.sqliteDb = null;
    this.pgPool = null;
  }

  async initialize() {
    console.log('🔄 Initializing database connections...');
    
    // Check if SQLite database exists
    if (!fs.existsSync(SQLITE_DB_PATH)) {
      throw new Error(`SQLite database not found at: ${SQLITE_DB_PATH}`);
    }

    // Initialize SQLite connection
    this.sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);
    
    // Initialize PostgreSQL connection
    this.pgPool = new Pool(PG_CONFIG);
    
    // Test PostgreSQL connection
    const client = await this.pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Database connections established');
  }

  async migrateTables() {
    console.log('🔄 Starting data migration...');
    
    const tables = [
      'assessment_categories',
      'assessment_templates', 
      'questions',
      'users',
      'user_profiles',
      'assessments',
      'assessment_results',
      'benchmarks',
      'action_plans',
      'investor_intros'
    ];

    for (const table of tables) {
      await this.migrateTable(table);
    }
    
    console.log('✅ All tables migrated successfully');
  }

  async migrateTable(tableName) {
    console.log(`🔄 Migrating table: ${tableName}`);
    
    return new Promise((resolve, reject) => {
      // Get all data from SQLite table
      this.sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
        if (err) {
          if (err.message.includes('no such table')) {
            console.log(`⚠️  Table ${tableName} doesn't exist in SQLite, skipping...`);
            resolve();
            return;
          }
          reject(err);
          return;
        }

        if (rows.length === 0) {
          console.log(`ℹ️  Table ${tableName} is empty, skipping...`);
          resolve();
          return;
        }

        try {
          await this.insertRowsToPostgres(tableName, rows);
          console.log(`✅ Migrated ${rows.length} rows from ${tableName}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async insertRowsToPostgres(tableName, rows) {
    if (rows.length === 0) return;

    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');

      for (const row of rows) {
        await this.insertRow(client, tableName, row);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertRow(client, tableName, row) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    
    // Handle JSON fields that are stored as strings in SQLite
    const jsonFields = ['options', 'responses', 'category_scores', 'strengths', 'weaknesses', 'recommendations', 'industry_comparison', 'category_averages', 'percentiles', 'plan_data'];
    
    const processedValues = values.map((value, index) => {
      const column = columns[index];
      
      // Convert JSON strings to proper JSON for PostgreSQL JSONB fields
      if (jsonFields.includes(column) && typeof value === 'string' && value.trim() !== '') {
        try {
          // First, try to parse the JSON string
          const parsedValue = JSON.parse(value);
          
          // For PostgreSQL JSONB fields, we need to stringify the parsed object
          // This ensures the pg driver receives a proper JSON string
          return JSON.stringify(parsedValue);
        } catch (e) {
          try {
            // If that fails, try to fix common escaping issues
            let fixedValue = value;
            
            // Handle double-escaped quotes
            fixedValue = fixedValue.replace(/\\"/g, '"');
            
            // Handle escaped backslashes  
            fixedValue = fixedValue.replace(/\\\\/g, '\\');
            
            // Try to remove any extra escaping that might be causing issues
            fixedValue = fixedValue.replace(/\\'/g, "'");
            
            const parsedValue = JSON.parse(fixedValue);
            return JSON.stringify(parsedValue);
          } catch (e2) {
            console.warn(`⚠️  Could not parse JSON for ${column} in ${tableName}:`, value);
            console.warn(`⚠️  Original error:`, e.message);
            console.warn(`⚠️  Secondary error:`, e2.message);
            
            // As a last resort, try to create a valid JSON structure
            // Check if it looks like an array but has formatting issues
            if (value.includes('[') && value.includes(']')) {
              try {
                // Try to extract and rebuild the array structure
                const arrayMatch = value.match(/\[(.*)\]/s);
                if (arrayMatch) {
                  const arrayContent = arrayMatch[1];
                  // Split by common delimiters and clean up
                  const items = arrayContent.split(/,(?=\s*["{])/);
                  const cleanItems = items.map(item => {
                    const trimmed = item.trim();
                    // If it looks like a JSON object, try to parse it
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                      try {
                        return JSON.parse(trimmed);
                      } catch {
                        return trimmed;
                      }
                    }
                    // If it's a quoted string, clean it up
                    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                      return trimmed.slice(1, -1);
                    }
                    return trimmed;
                  });
                  return JSON.stringify(cleanItems);
                }
              } catch (e3) {
                console.warn(`⚠️  Final parsing attempt failed:`, e3.message);
              }
            }
            
            // If all else fails, return null for JSONB fields to avoid errors
            return null;
          }
        }
      }
      
      // Handle empty JSON fields
      if (jsonFields.includes(column) && (value === '' || value === null || value === undefined)) {
        return null;
      }
      
      // Convert SQLite boolean integers to PostgreSQL booleans
      if (typeof value === 'number' && (column.includes('is_') || column.includes('_verified') || column === 'is_active')) {
        return value === 1;
      }
      
      return value;
    });

    const placeholders = processedValues.map((_, index) => `$${index + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columnNames}) 
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    try {
      await client.query(query, processedValues);
    } catch (error) {
      console.error(`Error inserting row into ${tableName}:`, error.message);
      console.error('Row data:', row);
      console.error('Processed values:', processedValues);
      
      // If it's a JSON error, let's examine the problematic data more closely
      if (error.message.includes('invalid input syntax for type json')) {
        console.error('🔍 JSON Error Analysis:');
        processedValues.forEach((val, idx) => {
          const col = columns[idx];
          if (jsonFields.includes(col)) {
            console.error(`   ${col}:`, typeof val, val);
          }
        });
      }
      
      throw error;
    }
  }

  async updateSequences() {
    console.log('🔄 Updating PostgreSQL sequences...');
    
    const client = await this.pgPool.connect();
    
    try {
      const tables = [
        'users',
        'user_profiles', 
        'assessment_categories',
        'questions',
        'assessment_templates',
        'assessments',
        'assessment_results',
        'benchmarks',
        'action_plans',
        'investor_intros'
      ];

      for (const table of tables) {
        const sequenceName = `${table}_id_seq`;
        const query = `SELECT setval('${sequenceName}', COALESCE((SELECT MAX(id) FROM ${table}), 1), false)`;
        
        try {
          await client.query(query);
          console.log(`✅ Updated sequence for ${table}`);
        } catch (error) {
          if (!error.message.includes('does not exist')) {
            console.error(`Error updating sequence for ${table}:`, error.message);
          }
        }
      }
    } finally {
      client.release();
    }
  }

  async validateMigration() {
    console.log('🔄 Validating migration...');
    
    const client = await this.pgPool.connect();
    
    try {
      // Check row counts
      const tables = ['assessment_categories', 'questions', 'assessments'];
      
      for (const table of tables) {
        const pgResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const pgCount = parseInt(pgResult.rows[0].count);
        
        const sqliteCount = await new Promise((resolve, reject) => {
          this.sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
            if (err) {
              if (err.message.includes('no such table')) {
                resolve(0);
              } else {
                reject(err);
              }
            } else {
              resolve(row.count);
            }
          });
        });
        
        console.log(`📊 ${table}: SQLite=${sqliteCount}, PostgreSQL=${pgCount}`);
        
        if (pgCount !== sqliteCount) {
          console.warn(`⚠️  Row count mismatch in ${table}`);
        }
      }
    } finally {
      client.release();
    }
  }

  async cleanup() {
    console.log('🔄 Cleaning up connections...');
    
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
    }
    
    console.log('✅ Cleanup completed');
  }

  async run() {
    try {
      await this.initialize();
      await this.migrateTables();
      await this.updateSequences();
      await this.validateMigration();
      
      console.log('🎉 Migration completed successfully!');
      console.log('📝 Next steps:');
      console.log('   1. Update your backend to use the PostgreSQL configuration');
      console.log('   2. Test your application with the new database');
      console.log('   3. Create a backup of your PostgreSQL database');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.run();
}

module.exports = DatabaseMigrator;
