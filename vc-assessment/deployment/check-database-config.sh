#!/bin/bash

# =============================================================================
# VC Assessment Database Configuration Checker
# =============================================================================
# Quick script to check current database configuration and identify issues

echo "=========================================="
echo "Database Configuration Checker"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check backend .env file
echo "1. BACKEND CONFIGURATION"
echo "------------------------"

BACKEND_ENV="/var/www/vc-assessment/backend/.env"

if [ -f "$BACKEND_ENV" ]; then
    print_status 0 "Backend .env file exists"
    
    echo ""
    echo "Current database configuration:"
    echo "NODE_ENV: $(grep NODE_ENV $BACKEND_ENV | cut -d'=' -f2)"
    echo "DB_HOST: $(grep DB_HOST $BACKEND_ENV | cut -d'=' -f2)"
    echo "DB_NAME: $(grep DB_NAME $BACKEND_ENV | cut -d'=' -f2)"
    echo "DB_USER: $(grep DB_USER $BACKEND_ENV | cut -d'=' -f2)"
    echo "DATABASE_URL: $(grep DATABASE_URL $BACKEND_ENV | cut -d'=' -f2 2>/dev/null || echo 'Not set')"
    
    # Check if using SQLite (development) or PostgreSQL (production)
    if grep -q "DATABASE_URL=./database.sqlite" "$BACKEND_ENV"; then
        print_warning "Backend is configured for SQLite (development mode)"
        echo "  This is likely the cause of your database connection issue!"
    elif grep -q "DB_HOST=localhost" "$BACKEND_ENV"; then
        print_warning "Backend is configured for local PostgreSQL"
        echo "  Should be pointing to your RDS instance"
    elif grep -q "DB_HOST=vc-assessment.cijw2rvqzxao.us-east-1.rds.amazonaws.com" "$BACKEND_ENV"; then
        print_status 0 "Backend is configured for RDS PostgreSQL"
    else
        print_warning "Backend database configuration unclear"
    fi
    
    # Check NODE_ENV
    if grep -q "NODE_ENV=development" "$BACKEND_ENV"; then
        print_warning "NODE_ENV is set to 'development' - should be 'production'"
    elif grep -q "NODE_ENV=production" "$BACKEND_ENV"; then
        print_status 0 "NODE_ENV is correctly set to 'production'"
    fi
    
else
    print_status 1 "Backend .env file not found"
fi

echo ""
echo "2. QUICK DATABASE TEST"
echo "---------------------"

cd /var/www/vc-assessment/backend 2>/dev/null

if [ -f "dist/config/database-postgres.js" ]; then
    echo "Testing current database configuration..."
    
    node -e "
    require('dotenv').config();
    console.log('Configuration loaded:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DB_HOST:', process.env.DB_HOST);
    console.log('- DB_NAME:', process.env.DB_NAME);
    console.log('- DATABASE_URL:', process.env.DATABASE_URL || 'Not set');
    
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sqlite')) {
        console.log('');
        console.log('❌ ISSUE FOUND: Backend is using SQLite instead of PostgreSQL');
        console.log('   This explains why questions are not loading in production.');
        console.log('');
        console.log('🔧 SOLUTION: Run the database connection fix script:');
        console.log('   ./fix-database-connection.sh');
        process.exit(1);
    }
    
    const { getDatabase } = require('./dist/config/database-postgres.js');
    getDatabase().then(db => db.connect()).then(client => {
        console.log('✓ Database connection successful');
        return client.query('SELECT COUNT(*) FROM questions');
    }).then(result => {
        console.log('✓ Questions in database:', result.rows[0].count);
        process.exit(0);
    }).catch(err => {
        console.log('❌ Database connection failed:', err.message);
        console.log('');
        console.log('Common causes:');
        console.log('1. Wrong database credentials');
        console.log('2. RDS security group blocking connections');
        console.log('3. RDS instance not running');
        console.log('4. Using SQLite instead of PostgreSQL');
        process.exit(1);
    });
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_status 0 "Database connection and data check passed"
    else
        print_status 1 "Database connection or data check failed"
    fi
else
    print_warning "Backend not built - run 'npm run build' first"
fi

echo ""
echo "3. RECOMMENDATIONS"
echo "-----------------"

echo ""
echo "Based on the configuration check:"
echo ""

if grep -q "DATABASE_URL=./database.sqlite" "$BACKEND_ENV" 2>/dev/null; then
    echo "🚨 CRITICAL ISSUE: Your backend is using SQLite instead of PostgreSQL"
    echo ""
    echo "✅ IMMEDIATE FIX:"
    echo "   cd /var/www/vc-assessment/deployment"
    echo "   ./fix-database-connection.sh"
    echo ""
    echo "This will:"
    echo "- Switch from SQLite to PostgreSQL"
    echo "- Configure RDS connection"
    echo "- Set NODE_ENV=production"
    echo "- Initialize and seed the database"
elif grep -q "NODE_ENV=development" "$BACKEND_ENV" 2>/dev/null; then
    echo "⚠️  ISSUE: Backend is in development mode"
    echo ""
    echo "✅ FIX:"
    echo "   Edit /var/www/vc-assessment/backend/.env"
    echo "   Change: NODE_ENV=production"
    echo "   Then: pm2 restart vc-assessment-backend"
else
    echo "✅ Configuration looks correct"
    echo ""
    echo "If you're still having issues:"
    echo "- Check RDS password in backend/.env"
    echo "- Verify RDS security group allows port 5432"
    echo "- Run: pm2 logs vc-assessment-backend"
fi

echo ""
echo "=========================================="
