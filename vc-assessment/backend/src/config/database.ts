import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// Get database path
const getDatabasePath = (): string => {
  const dbPath = process.env.DATABASE_URL || './database.sqlite';
  return path.resolve(dbPath);
};

// Initialize database connection
export const initializeConnection = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');
  
  return db;
};

// Get database instance
export const getDatabase = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (!db) {
    db = await initializeConnection();
  }
  return db;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await getDatabase();
    await database.get('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database tables
export const initializeDatabase = async (): Promise<void> => {
  const database = await getDatabase();
  
  try {
    await database.exec('BEGIN TRANSACTION');

    // Create users table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT DEFAULT 'user',
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_profiles table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT,
        founder_name TEXT,
        industry TEXT,
        stage TEXT,
        website TEXT,
        linkedin_url TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assessment_categories table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS assessment_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        weight INTEGER NOT NULL,
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create questions table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER REFERENCES assessment_categories(id),
        text TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'multiple_choice',
        weight INTEGER NOT NULL,
        options TEXT,
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assessment_templates table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS assessment_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assessments table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        template_id INTEGER REFERENCES assessment_templates(id),
        session_id TEXT,
        responses TEXT NOT NULL,
        total_score INTEGER,
        category_scores TEXT,
        is_completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assessment_results table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS assessment_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
        strengths TEXT,
        weaknesses TEXT,
        recommendations TEXT,
        percentile_rank INTEGER,
        industry_comparison TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create benchmarks table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        industry TEXT,
        stage TEXT,
        category_averages TEXT,
        percentiles TEXT,
        sample_size INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create action_plans table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS action_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        assessment_id INTEGER REFERENCES assessments(id),
        admin_id INTEGER REFERENCES users(id),
        title TEXT,
        plan_data TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create investor_intros table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS investor_intros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        assessment_id INTEGER REFERENCES assessments(id),
        intro_text TEXT,
        investor_name TEXT,
        status TEXT DEFAULT 'draft',
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME
      )
    `);

    // Create indexes for better performance
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);
      CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
      CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(category_id, order_index);
      CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
    `);

    await database.exec('COMMIT');
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    await database.exec('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Seed initial data
export const seedDatabase = async (): Promise<void> => {
  const database = await getDatabase();
  
  try {
    await database.exec('BEGIN TRANSACTION');

    // Check if categories already exist
    const categoriesResult = await database.get('SELECT COUNT(*) as count FROM assessment_categories');
    const categoriesCount = categoriesResult?.count || 0;

    if (categoriesCount === 0) {
      // Insert assessment categories
      const categories = [
        { name: 'Market & Opportunity', description: 'Market size, growth, and competitive landscape', weight: 25, order_index: 1 },
        { name: 'Team & Leadership', description: 'Founder experience and team strength', weight: 20, order_index: 2 },
        { name: 'Product & Technology', description: 'Product development and technical differentiation', weight: 20, order_index: 3 },
        { name: 'Traction & Business Model', description: 'Customer traction and revenue model', weight: 20, order_index: 4 },
        { name: 'Financial Readiness', description: 'Financial planning and funding requirements', weight: 15, order_index: 5 }
      ];

      for (const category of categories) {
        await database.run(
          'INSERT INTO assessment_categories (name, description, weight, order_index) VALUES (?, ?, ?, ?)',
          [category.name, category.description, category.weight, category.order_index]
        );
      }

      // Insert default assessment template
      await database.run(
        'INSERT INTO assessment_templates (name, version, description) VALUES (?, ?, ?)',
        ['Default VC Readiness Assessment', '1.0', 'Comprehensive assessment for VC funding readiness']
      );

      console.log('✅ Database seeded with initial data');
    }

    await database.exec('COMMIT');
  } catch (error) {
    await database.exec('ROLLBACK');
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
    console.log('📦 Database connection closed');
  }
};
