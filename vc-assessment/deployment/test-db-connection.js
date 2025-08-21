#!/usr/bin/env node

/**
 * Test script to verify PostgreSQL database connection
 * This script uses the compiled JavaScript files to test the database setup
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function testDatabaseConnection() {
  console.log('🧪 Testing PostgreSQL database connection...');
  console.log('================================');
  
  // Check if backend is built
  const distPath = path.join(__dirname, '../backend/dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Backend not built yet. Please run:');
    console.error('   cd /var/www/vc-assessment/backend');
    console.error('   npm run build');
    process.exit(1);
  }
  
  // Check if database config exists
  const dbConfigPath = path.join(distPath, 'config/database-postgres.js');
  if (!fs.existsSync(dbConfigPath)) {
    console.error('❌ Database configuration not found at:', dbConfigPath);
    console.error('   Please ensure the backend is properly built.');
    process.exit(1);
  }
  
  try {
    // Import the compiled database functions
    const { testConnection, initializeDatabase, seedDatabase } = require(dbConfigPath);
    
    // Test connection
    console.log('🔗 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      console.error('   Please check your RDS configuration and environment variables:');
      console.error(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
      console.error(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
      console.error(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
      console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[SET]' : 'NOT SET'}`);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!');
    
    // Initialize database
    console.log('🏗️  Initializing database tables...');
    await initializeDatabase();
    console.log('✅ Database tables initialized');
    
    // Seed database
    console.log('🌱 Seeding initial data...');
    await seedDatabase();
    console.log('✅ Database seeded with initial data');
    
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('================================');
    console.log('✅ Connection: Working');
    console.log('✅ Tables: Created');
    console.log('✅ Data: Seeded');
    console.log('');
    console.log('Your PostgreSQL database is ready for the VC Assessment application.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Verify your RDS instance is running');
    console.error('2. Check security group allows connections on port 5432');
    console.error('3. Ensure your environment variables are correct');
    console.error('4. Test manual connection:');
    console.error(`   psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME}`);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = testDatabaseConnection;
