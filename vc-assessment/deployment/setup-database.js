#!/usr/bin/env node

// Standalone database setup script that completely avoids any dotenv dependencies
// This script contains all database setup logic inline to avoid module resolution issues

const { Pool } = require('pg');

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

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

let pool = null;

// Initialize connection pool
const initializeConnection = async () => {
    if (pool) {
        return pool;
    }
    
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
    
    return pool;
};

// Test database connection
const testConnection = async () => {
    try {
        const database = await initializeConnection();
        const client = await database.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ PostgreSQL connected successfully');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error);
        return false;
    }
};

// Initialize database tables
const initializeDatabase = async () => {
    const database = await initializeConnection();
    const client = await database.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create user_profiles table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                company_name VARCHAR(255),
                founder_name VARCHAR(255),
                industry VARCHAR(100),
                stage VARCHAR(100),
                website VARCHAR(255),
                linkedin_url VARCHAR(255),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assessment_categories table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assessment_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                weight INTEGER NOT NULL,
                order_index INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create questions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES assessment_categories(id),
                text TEXT NOT NULL,
                description TEXT,
                type VARCHAR(50) DEFAULT 'multiple_choice',
                weight INTEGER NOT NULL,
                options JSONB,
                order_index INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assessment_templates table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assessment_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                version VARCHAR(50) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assessments table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assessments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                template_id INTEGER REFERENCES assessment_templates(id),
                session_id VARCHAR(255),
                responses JSONB NOT NULL,
                total_score INTEGER,
                category_scores JSONB,
                is_completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assessment_results table
        await client.query(`
            CREATE TABLE IF NOT EXISTS assessment_results (
                id SERIAL PRIMARY KEY,
                assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
                strengths JSONB,
                weaknesses JSONB,
                recommendations JSONB,
                percentile_rank INTEGER,
                industry_comparison JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create benchmarks table
        await client.query(`
            CREATE TABLE IF NOT EXISTS benchmarks (
                id SERIAL PRIMARY KEY,
                industry VARCHAR(100),
                stage VARCHAR(100),
                category_averages JSONB,
                percentiles JSONB,
                sample_size INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create action_plans table
        await client.query(`
            CREATE TABLE IF NOT EXISTS action_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                assessment_id INTEGER REFERENCES assessments(id),
                admin_id INTEGER REFERENCES users(id),
                title VARCHAR(255),
                plan_data JSONB,
                status VARCHAR(50) DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create investor_intros table
        await client.query(`
            CREATE TABLE IF NOT EXISTS investor_intros (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                assessment_id INTEGER REFERENCES assessments(id),
                intro_text TEXT,
                investor_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'draft',
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP
            )
        `);

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
            CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);
            CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
            CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(category_id, order_index);
            CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
        `);

        await client.query('COMMIT');
        console.log('✅ PostgreSQL database tables initialized successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ PostgreSQL database initialization failed:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Seed database with initial data
const seedDatabase = async () => {
    const database = await initializeConnection();
    const client = await database.connect();
    
    try {
        await client.query('BEGIN');
        
        // Check if categories already exist
        const categoriesResult = await client.query('SELECT COUNT(*) as count FROM assessment_categories');
        const categoriesCount = parseInt(categoriesResult.rows[0].count) || 0;

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
                await client.query(
                    'INSERT INTO assessment_categories (name, description, weight, order_index) VALUES ($1, $2, $3, $4)',
                    [category.name, category.description, category.weight, category.order_index]
                );
            }

            // Insert default assessment template
            await client.query(
                'INSERT INTO assessment_templates (name, version, description) VALUES ($1, $2, $3)',
                ['Default VC Readiness Assessment', '1.0', 'Comprehensive assessment for VC funding readiness']
            );

            console.log('✅ PostgreSQL database seeded with initial data');
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ PostgreSQL database seeding failed:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Close database connection
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('📦 PostgreSQL connection pool closed');
    }
};

// Main setup function
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
        
        await closeDatabase();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error:', error);
        await closeDatabase();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚠️  Database setup interrupted');
    await closeDatabase();
    process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Database setup terminated');
    await closeDatabase();
    process.exit(1);
});

// Run the setup
setupDatabase();
