import { testConnection, initializeDatabase, seedDatabase } from '../config/database-postgres';
import { seedQuestions } from './seedQuestions';

async function testSetup() {
  console.log('🧪 Testing VC Assessment Backend Setup...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Initialize database
    console.log('2. Initializing database tables...');
    await initializeDatabase();

    // Seed initial data
    console.log('3. Seeding initial data...');
    await seedDatabase();

    // Seed questions
    console.log('4. Seeding assessment questions...');
    await seedQuestions();

    console.log('\n✅ Backend setup test completed successfully!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Setup test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSetup();
