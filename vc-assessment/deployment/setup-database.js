#!/usr/bin/env node

// Standalone database setup script that avoids dotenv issues
// Reads environment variables directly from process.env (set by deploy.sh)

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

// Verify required environment variables are set
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('These should be set by the deployment script');
    process.exit(1);
}

console.log('🔧 Environment variables loaded:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');

// Import from compiled JavaScript files (without dotenv) using absolute path
const { testConnection, initializeDatabase, seedDatabase } = require(path.join(backendDir, 'dist', 'config', 'database-postgres.js'));

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
