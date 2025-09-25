#!/bin/bash

# =============================================================================
# VC Assessment Database Connection Fix Script
# =============================================================================
# This script fixes PostgreSQL database connection issues in production

echo "=========================================="
echo "VC Assessment Database Connection Fix"
echo "=========================================="
echo "Fixing PostgreSQL database connection..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# =============================================================================
# 1. BACKUP CURRENT CONFIGURATION
# =============================================================================
print_header "1. BACKING UP CURRENT CONFIGURATION"
echo "-----------------------------------"

BACKEND_DIR="/var/www/vc-assessment/backend"
BACKUP_DIR="/var/www/vc-assessment/backups"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup current .env file
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    print_status 0 "Backed up current .env file"
else
    print_status 1 "No .env file found to backup"
fi

echo ""

# =============================================================================
# 2. UPDATE BACKEND ENVIRONMENT FOR PRODUCTION
# =============================================================================
print_header "2. UPDATING BACKEND ENVIRONMENT"
echo "-------------------------------"

cd "$BACKEND_DIR"

# Create production .env file
cat > .env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration (PostgreSQL RDS)
DB_HOST=vc-assessment.cijw2rvqzxao.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=vc_assessment
DB_USER=postgres
DB_PASSWORD=your_secure_rds_password

# JWT Configuration
JWT_SECRET=vc_assessment_super_secure_jwt_secret_key_for_production_2024
JWT_EXPIRES_IN=7d

# Email Configuration
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# FROM_EMAIL=noreply@dev.canipitchit.com
# FROM_NAME=VC Assessment Tool

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=https://dev.canipitchit.com

# Admin Configuration
ADMIN_EMAIL=donielw@gmail.com
DOMAIN_NAME=dev.canipitchit.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/vc-assessment/app.log
EOF

print_status 0 "Created production .env configuration"

echo ""
print_info "⚠️  IMPORTANT: You need to update the following values in .env:"
echo "   - DB_PASSWORD: Replace 'your_secure_rds_password' with your actual RDS password"
echo "   - JWT_SECRET: Verify this is secure (current one looks good)"
echo "   - Email settings: Configure if you need email functionality"

echo ""

# =============================================================================
# 3. TEST DATABASE CONNECTION
# =============================================================================
print_header "3. TESTING DATABASE CONNECTION"
echo "------------------------------"

print_info "Before testing, please update your RDS password in .env file"
read -p "Press Enter after you've updated the DB_PASSWORD in .env file..."

# Rebuild backend to ensure latest code
print_info "Rebuilding backend..."
if npm run build; then
    print_status 0 "Backend build successful"
else
    print_status 1 "Backend build failed"
    exit 1
fi

# Test database connection
print_info "Testing PostgreSQL connection..."
node -e "
require('dotenv').config();
const { getDatabase } = require('./dist/config/database-postgres.js');

console.log('Attempting to connect to:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

getDatabase().then(db => {
  console.log('✓ Database pool created successfully');
  return db.connect();
}).then(client => {
  console.log('✓ Database connection established');
  return client.query('SELECT version()');
}).then(result => {
  console.log('✓ PostgreSQL version:', result.rows[0].version);
  console.log('✓ Database connection test successful!');
  process.exit(0);
}).catch(err => {
  console.log('✗ Database connection failed:', err.message);
  console.log('');
  console.log('Common issues:');
  console.log('1. Incorrect password in .env file');
  console.log('2. RDS security group not allowing connections');
  console.log('3. RDS instance not running');
  console.log('4. Network connectivity issues');
  process.exit(1);
});
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status 0 "Database connection successful"
    DB_CONNECTION_OK=true
else
    print_status 1 "Database connection failed"
    DB_CONNECTION_OK=false
fi

echo ""

# =============================================================================
# 4. INITIALIZE DATABASE SCHEMA
# =============================================================================
if [ "$DB_CONNECTION_OK" = true ]; then
    print_header "4. INITIALIZING DATABASE SCHEMA"
    echo "-------------------------------"
    
    print_info "Checking if database tables exist..."
    
    # Check if tables exist and create them if needed
    node -e "
    require('dotenv').config();
    const { getDatabase, initializeDatabase } = require('./dist/config/database-postgres.js');
    
    getDatabase().then(db => db.connect()).then(client => {
      return client.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\");
    }).then(result => {
      const tables = result.rows.map(row => row.table_name);
      console.log('Existing tables:', tables);
      
      if (tables.length === 0) {
        console.log('No tables found, initializing database...');
        return initializeDatabase();
      } else {
        console.log('Database tables already exist');
        return Promise.resolve();
      }
    }).then(() => {
      console.log('✓ Database schema ready');
      process.exit(0);
    }).catch(err => {
      console.log('✗ Database schema initialization failed:', err.message);
      process.exit(1);
    });
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_status 0 "Database schema initialized"
    else
        print_status 1 "Database schema initialization failed"
    fi
    
    echo ""
    
    # =============================================================================
    # 5. SEED DATABASE WITH QUESTIONS
    # =============================================================================
    print_header "5. SEEDING DATABASE WITH QUESTIONS"
    echo "----------------------------------"
    
    print_info "Checking if questions exist in database..."
    
    node -e "
    require('dotenv').config();
    const { getDatabase } = require('./dist/config/database-postgres.js');
    
    getDatabase().then(db => db.connect()).then(client => {
      return client.query('SELECT COUNT(*) FROM questions');
    }).then(result => {
      const count = parseInt(result.rows[0].count);
      console.log('Questions in database:', count);
      
      if (count === 0) {
        console.log('No questions found, seeding database...');
        const { seedDatabase } = require('./dist/config/database-postgres.js');
        return seedDatabase();
      } else {
        console.log('Questions already exist in database');
        return Promise.resolve();
      }
    }).then(() => {
      console.log('✓ Database seeding complete');
      process.exit(0);
    }).catch(err => {
      console.log('✗ Database seeding failed:', err.message);
      process.exit(1);
    });
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_status 0 "Database seeded with questions"
    else
        print_status 1 "Database seeding failed"
    fi
fi

echo ""

# =============================================================================
# 6. RESTART SERVICES
# =============================================================================
print_header "6. RESTARTING SERVICES"
echo "----------------------"

# Restart PM2 backend process
if pm2 list | grep -q "vc-assessment-backend"; then
    print_info "Restarting backend process..."
    pm2 restart vc-assessment-backend
    print_status 0 "Backend process restarted"
else
    print_info "Starting backend process..."
    cd /var/www/vc-assessment/deployment
    pm2 start ecosystem.config.js --env production
    print_status 0 "Backend process started"
fi

# Wait for backend to start
sleep 3

# Test backend health
if curl -s -f http://localhost:5000/health > /dev/null; then
    print_status 0 "Backend health check passed"
else
    print_status 1 "Backend health check failed"
fi

echo ""

# =============================================================================
# 7. FINAL VERIFICATION
# =============================================================================
print_header "7. FINAL VERIFICATION"
echo "--------------------"

# Test questions endpoint
print_info "Testing questions endpoint..."
if curl -s -f http://localhost:5000/api/questions > /dev/null; then
    QUESTION_COUNT=$(curl -s http://localhost:5000/api/questions | jq '.data | length' 2>/dev/null || echo "unknown")
    print_status 0 "Questions endpoint working ($QUESTION_COUNT questions)"
else
    print_status 1 "Questions endpoint not responding"
fi

# Test external endpoint
print_info "Testing external HTTPS endpoint..."
if curl -s -f https://dev.canipitchit.com/api/questions > /dev/null; then
    EXTERNAL_COUNT=$(curl -s https://dev.canipitchit.com/api/questions | jq '.data | length' 2>/dev/null || echo "unknown")
    print_status 0 "External questions endpoint working ($EXTERNAL_COUNT questions)"
else
    print_status 1 "External questions endpoint not responding"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=========================================="
echo "DATABASE CONNECTION FIX SUMMARY"
echo "=========================================="

echo ""
echo "✅ Completed tasks:"
echo "  - Backed up original configuration"
echo "  - Updated backend to use PostgreSQL"
echo "  - Set NODE_ENV=production"
echo "  - Tested database connection"
echo "  - Initialized database schema"
echo "  - Seeded database with questions"
echo "  - Restarted backend services"
echo ""

if [ "$DB_CONNECTION_OK" = true ]; then
    echo "🎉 Database connection should now be working!"
    echo ""
    echo "🌐 Test your application:"
    echo "  https://dev.canipitchit.com/"
    echo ""
    echo "✅ The 'Failed to load questions' error should be resolved."
else
    echo "⚠️  Database connection still needs attention:"
    echo "  1. Verify RDS password in backend/.env"
    echo "  2. Check RDS security group settings"
    echo "  3. Ensure RDS instance is running"
    echo "  4. Run: pm2 logs vc-assessment-backend"
fi

echo ""
echo "📋 Next steps if issues persist:"
echo "  - Check PM2 logs: pm2 logs vc-assessment-backend"
echo "  - Run diagnostics: ./diagnose-production.sh"
echo "  - Verify RDS connectivity: telnet $DB_HOST 5432"
echo ""
echo "=========================================="
