"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_postgres_1 = require("../config/database-postgres");
const seedQuestions_1 = require("./seedQuestions");
async function testSetup() {
    console.log('🧪 Testing VC Assessment Backend Setup...\n');
    try {
        console.log('1. Testing database connection...');
        const connected = await (0, database_postgres_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        console.log('2. Initializing database tables...');
        await (0, database_postgres_1.initializeDatabase)();
        console.log('3. Seeding initial data...');
        await (0, database_postgres_1.seedDatabase)();
        console.log('4. Seeding assessment questions...');
        await (0, seedQuestions_1.seedQuestions)();
        console.log('\n✅ Backend setup test completed successfully!');
        console.log('\n🚀 You can now start the server with: npm run dev');
    }
    catch (error) {
        console.error('\n❌ Setup test failed:', error);
        process.exit(1);
    }
}
testSetup();
//# sourceMappingURL=testSetup.js.map