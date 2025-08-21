#!/usr/bin/env node

// Standalone database setup script that runs from compiled JavaScript files
// This avoids TypeScript module resolution issues during deployment

const path = require('path');
const fs = require('fs');

// Change to the backend directory
const backendDir = path.join(__dirname, '..', 'backend');
process.chdir(backendDir);

// Verify compiled files exist
const dbFile = path.join(backendDir, 'dist', 'config', 'database-postgres.js');
if (!fs.existsSync(dbFile)) {
    console.error('❌ Compiled database file not found:', dbFile);
    console.error('Please run "npm run build" in the backend directory first');
    process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Import from compiled JavaScript files
const { testConnection, initializeDatabase, seedDatabase } = require('./dist/config/database-postgres.js');

async function setupDatabase() {
    try {
        console.log('🔍 Testing database connection...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('❌ Database connection test failed');
            process.exit(1);
        }
        
        console.log('✅ Database connection successful');
        
        console.log('🏗️  Initializing database tables...');
        await initializeDatabase();
        console.log('✅ Database tables initialized');
        
        console.log('🌱 Seeding database with initial data...');
        await seedDatabase();
        console.log('✅ Database seeded successfully');
        
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n⚠️  Database setup interrupted');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  Database setup terminated');
    process.exit(1);
});

// Run the setup
setupDatabase();
