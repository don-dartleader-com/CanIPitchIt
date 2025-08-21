"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_postgres_1 = require("./config/database-postgres");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
const questions_1 = __importDefault(require("./routes/questions"));
const categories_1 = __importDefault(require("./routes/categories"));
const assessments_1 = __importDefault(require("./routes/assessments"));
app.get('/api', (req, res) => {
    res.json({
        message: 'VC Assessment API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            questions: '/api/questions',
            categories: '/api/categories',
            assessments: '/api/assessments'
        }
    });
});
app.use('/api/questions', questions_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/assessments', assessments_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(err.status || 500).json({
        success: false,
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
});
const startServer = async () => {
    try {
        const dbConnected = await (0, database_postgres_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        await (0, database_postgres_1.initializeDatabase)();
        await (0, database_postgres_1.seedDatabase)();
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 API available at: http://localhost:${PORT}/api`);
        });
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
            server.close(async () => {
                console.log('🔌 HTTP server closed');
                try {
                    await (0, database_postgres_1.closeDatabase)();
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map