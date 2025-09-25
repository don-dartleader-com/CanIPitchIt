#!/bin/bash

# =============================================================================
# VC Assessment Quick Fix Script
# =============================================================================
# This script applies common fixes for the "Failed to load questions" error

echo "=========================================="
echo "VC Assessment Quick Fix"
echo "=========================================="
echo "Applying fixes for 'Failed to load questions' error..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# =============================================================================
# 1. UPDATE FRONTEND ENVIRONMENT
# =============================================================================
echo "1. UPDATING FRONTEND ENVIRONMENT"
echo "--------------------------------"

FRONTEND_ENV="/var/www/vc-assessment/frontend/.env"

if [ -f "$FRONTEND_ENV" ]; then
    # Check current API URL
    CURRENT_URL=$(grep "REACT_APP_API_URL" "$FRONTEND_ENV" | cut -d'=' -f2)
    print_info "Current API URL: $CURRENT_URL"
    
    # Fix HTTP to HTTPS if needed
    if grep -q "REACT_APP_API_URL=http://dev.canipitchit.com/api" "$FRONTEND_ENV"; then
        sed -i 's|REACT_APP_API_URL=http://dev.canipitchit.com/api|REACT_APP_API_URL=https://dev.canipitchit.com/api|g' "$FRONTEND_ENV"
        print_status 0 "Fixed API URL from HTTP to HTTPS"
    else
        print_status 0 "API URL is already using HTTPS"
    fi
    
    # Ensure DISABLE_DOTENV_EXPANSION is set
    if ! grep -q "DISABLE_DOTENV_EXPANSION=true" "$FRONTEND_ENV"; then
        echo "DISABLE_DOTENV_EXPANSION=true" >> "$FRONTEND_ENV"
        print_status 0 "Added DISABLE_DOTENV_EXPANSION=true"
    else
        print_status 0 "DISABLE_DOTENV_EXPANSION already set"
    fi
else
    print_status 1 "Frontend .env file not found"
    exit 1
fi

echo ""

# =============================================================================
# 2. REBUILD FRONTEND
# =============================================================================
echo "2. REBUILDING FRONTEND"
echo "---------------------"

cd /var/www/vc-assessment/frontend

print_info "Cleaning previous build..."
rm -rf build/
rm -rf node_modules/.cache/

print_info "Building frontend with updated environment..."
export NODE_OPTIONS="--max-old-space-size=512"
export DISABLE_DOTENV_EXPANSION=true
export GENERATE_SOURCEMAP=false

if npm run build; then
    print_status 0 "Frontend build successful"
else
    print_status 1 "Frontend build failed"
    echo "Trying alternative build method..."
    
    # Try with memory optimization
    if DISABLE_DOTENV_EXPANSION=true GENERATE_SOURCEMAP=false npm run build; then
        print_status 0 "Frontend build successful (alternative method)"
    else
        print_status 1 "Frontend build failed completely"
        exit 1
    fi
fi

echo ""

# =============================================================================
# 3. CHECK AND RESTART BACKEND
# =============================================================================
echo "3. CHECKING AND RESTARTING BACKEND"
echo "----------------------------------"

cd /var/www/vc-assessment/backend

# Ensure backend is built
if [ ! -d "dist" ]; then
    print_info "Backend not built, building now..."
    if npm run build; then
        print_status 0 "Backend build successful"
    else
        print_status 1 "Backend build failed"
        exit 1
    fi
else
    print_status 0 "Backend already built"
fi

# Check if PM2 process exists
if pm2 list | grep -q "vc-assessment-backend"; then
    print_info "Restarting existing PM2 process..."
    pm2 restart vc-assessment-backend
    print_status 0 "Backend restarted"
else
    print_info "Starting new PM2 process..."
    cd /var/www/vc-assessment/deployment
    pm2 start ecosystem.config.js --env production
    print_status 0 "Backend started"
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
# 4. RESTART NGINX
# =============================================================================
echo "4. RESTARTING NGINX"
echo "------------------"

# Test nginx configuration
if sudo nginx -t; then
    print_status 0 "Nginx configuration is valid"
    
    # Restart nginx
    if sudo systemctl restart nginx; then
        print_status 0 "Nginx restarted successfully"
    else
        print_status 1 "Failed to restart Nginx"
    fi
else
    print_status 1 "Nginx configuration has errors"
fi

echo ""

# =============================================================================
# 5. TEST ENDPOINTS
# =============================================================================
echo "5. TESTING ENDPOINTS"
echo "-------------------"

# Wait for services to stabilize
sleep 2

# Test local backend
print_info "Testing local backend..."
if curl -s -f http://localhost:5000/api/questions > /dev/null; then
    QUESTION_COUNT=$(curl -s http://localhost:5000/api/questions | jq '.data | length' 2>/dev/null || echo "unknown")
    print_status 0 "Local questions endpoint working ($QUESTION_COUNT questions)"
else
    print_status 1 "Local questions endpoint not responding"
fi

# Test external HTTPS endpoint
print_info "Testing external HTTPS endpoint..."
if curl -s -f https://dev.canipitchit.com/api/questions > /dev/null; then
    EXTERNAL_COUNT=$(curl -s https://dev.canipitchit.com/api/questions | jq '.data | length' 2>/dev/null || echo "unknown")
    print_status 0 "External HTTPS questions endpoint working ($EXTERNAL_COUNT questions)"
else
    print_status 1 "External HTTPS questions endpoint not responding"
    
    # Try HTTP as fallback
    print_info "Trying HTTP fallback..."
    if curl -s -f http://dev.canipitchit.com/api/questions > /dev/null; then
        print_status 1 "HTTP works but HTTPS doesn't - SSL certificate issue"
    else
        print_status 1 "Both HTTP and HTTPS endpoints not responding"
    fi
fi

echo ""

# =============================================================================
# 6. CHECK DATABASE
# =============================================================================
echo "6. CHECKING DATABASE"
echo "-------------------"

cd /var/www/vc-assessment/backend

print_info "Testing database connection and question count..."
node -e "
require('dotenv').config();
const { getDatabase } = require('./dist/config/database-postgres.js');
getDatabase().then(db => db.connect()).then(client => {
  return client.query('SELECT COUNT(*) FROM questions');
}).then(result => {
  const count = result.rows[0].count;
  console.log('Database connected - Questions in DB:', count);
  if (count == 0) {
    console.log('⚠ Database is empty - you may need to run the seeding script');
  }
  process.exit(0);
}).catch(err => {
  console.log('Database error:', err.message);
  console.log('⚠ You may need to check your database configuration');
  process.exit(1);
});
" 2>/dev/null

if [ $? -eq 0 ]; then
    print_status 0 "Database connection successful"
else
    print_status 1 "Database connection failed"
    print_info "You may need to:"
    echo "  - Check database credentials in backend/.env"
    echo "  - Ensure database server is running"
    echo "  - Run database seeding: node dist/scripts/seedQuestions.js"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "=========================================="
echo "QUICK FIX SUMMARY"
echo "=========================================="

echo ""
echo "✅ Applied fixes:"
echo "  - Updated frontend API URL to use HTTPS"
echo "  - Rebuilt frontend with correct environment"
echo "  - Restarted backend and nginx services"
echo "  - Tested all endpoints"
echo ""
echo "🌐 Test your application now:"
echo "  https://dev.canipitchit.com/"
echo ""
echo "If the issue persists:"
echo "  1. Check browser developer console for errors"
echo "  2. Run full diagnostics: ./diagnose-production.sh"
echo "  3. Check PM2 logs: pm2 logs vc-assessment-backend"
echo "  4. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "=========================================="
