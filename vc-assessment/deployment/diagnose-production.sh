#!/bin/bash

# =============================================================================
# VC Assessment Production Diagnostic Script
# =============================================================================
# This script helps diagnose the "Failed to load questions" error in production
# Run this script on your production server to identify issues

echo "=========================================="
echo "VC Assessment Production Diagnostics"
echo "=========================================="
echo "Date: $(date)"
echo "Server: $(hostname)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
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

# =============================================================================
# 1. CHECK ENVIRONMENT CONFIGURATION
# =============================================================================
echo "1. CHECKING ENVIRONMENT CONFIGURATION"
echo "--------------------------------------"

# Check if frontend .env exists
if [ -f "/var/www/vc-assessment/frontend/.env" ]; then
    print_status 0 "Frontend .env file exists"
    echo "Frontend API URL:"
    grep "REACT_APP_API_URL" /var/www/vc-assessment/frontend/.env || echo "REACT_APP_API_URL not found"
else
    print_status 1 "Frontend .env file missing"
fi

# Check if backend .env exists
if [ -f "/var/www/vc-assessment/backend/.env" ]; then
    print_status 0 "Backend .env file exists"
    echo "Backend configuration:"
    grep -E "(PORT|NODE_ENV|FRONTEND_URL)" /var/www/vc-assessment/backend/.env || echo "Key backend variables not found"
else
    print_status 1 "Backend .env file missing"
fi

echo ""

# =============================================================================
# 2. CHECK PROCESS STATUS
# =============================================================================
echo "2. CHECKING PROCESS STATUS"
echo "--------------------------"

# Check PM2 status
if command -v pm2 &> /dev/null; then
    print_status 0 "PM2 is installed"
    echo "PM2 Process Status:"
    pm2 status
    
    # Check if backend is running
    if pm2 list | grep -q "vc-assessment-backend.*online"; then
        print_status 0 "Backend process is running"
    else
        print_status 1 "Backend process is not running or not online"
    fi
else
    print_status 1 "PM2 is not installed"
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_status 0 "Nginx is running"
else
    print_status 1 "Nginx is not running"
fi

echo ""

# =============================================================================
# 3. TEST LOCAL BACKEND CONNECTIVITY
# =============================================================================
echo "3. TESTING LOCAL BACKEND CONNECTIVITY"
echo "-------------------------------------"

# Test backend health endpoint
echo "Testing backend health endpoint..."
if curl -s -f http://localhost:5000/health > /dev/null; then
    print_status 0 "Backend health endpoint responds"
    echo "Health response:"
    curl -s http://localhost:5000/health | jq . 2>/dev/null || curl -s http://localhost:5000/health
else
    print_status 1 "Backend health endpoint not responding"
fi

echo ""

# Test questions endpoint locally
echo "Testing questions endpoint locally..."
if curl -s -f http://localhost:5000/api/questions > /dev/null; then
    print_status 0 "Questions endpoint responds locally"
    QUESTION_COUNT=$(curl -s http://localhost:5000/api/questions | jq '.data | length' 2>/dev/null)
    if [ ! -z "$QUESTION_COUNT" ] && [ "$QUESTION_COUNT" -gt 0 ]; then
        print_status 0 "Questions endpoint returns $QUESTION_COUNT questions"
    else
        print_warning "Questions endpoint responds but may be empty"
    fi
else
    print_status 1 "Questions endpoint not responding locally"
fi

echo ""

# =============================================================================
# 4. TEST EXTERNAL CONNECTIVITY
# =============================================================================
echo "4. TESTING EXTERNAL CONNECTIVITY"
echo "--------------------------------"

DOMAIN="dev.canipitchit.com"

# Test HTTPS health endpoint
echo "Testing HTTPS health endpoint..."
if curl -s -f https://$DOMAIN/api/health > /dev/null; then
    print_status 0 "HTTPS health endpoint responds"
else
    print_status 1 "HTTPS health endpoint not responding"
    echo "Trying HTTP..."
    if curl -s -f http://$DOMAIN/api/health > /dev/null; then
        print_warning "HTTP health endpoint responds (HTTPS issue)"
    fi
fi

# Test HTTPS questions endpoint
echo "Testing HTTPS questions endpoint..."
if curl -s -f https://$DOMAIN/api/questions > /dev/null; then
    print_status 0 "HTTPS questions endpoint responds"
    EXTERNAL_QUESTION_COUNT=$(curl -s https://$DOMAIN/api/questions | jq '.data | length' 2>/dev/null)
    if [ ! -z "$EXTERNAL_QUESTION_COUNT" ] && [ "$EXTERNAL_QUESTION_COUNT" -gt 0 ]; then
        print_status 0 "External questions endpoint returns $EXTERNAL_QUESTION_COUNT questions"
    else
        print_warning "External questions endpoint responds but may be empty"
    fi
else
    print_status 1 "HTTPS questions endpoint not responding"
    echo "Trying HTTP..."
    if curl -s -f http://$DOMAIN/api/questions > /dev/null; then
        print_warning "HTTP questions endpoint responds (HTTPS issue)"
    fi
fi

echo ""

# =============================================================================
# 5. CHECK SSL CERTIFICATE
# =============================================================================
echo "5. CHECKING SSL CERTIFICATE"
echo "---------------------------"

if command -v openssl &> /dev/null; then
    echo "SSL Certificate info for $DOMAIN:"
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null
    
    # Check if certificate is valid
    if echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -checkend 86400 > /dev/null 2>&1; then
        print_status 0 "SSL certificate is valid"
    else
        print_status 1 "SSL certificate is invalid or expiring soon"
    fi
else
    print_warning "OpenSSL not available for certificate check"
fi

echo ""

# =============================================================================
# 6. CHECK DATABASE CONNECTIVITY
# =============================================================================
echo "6. CHECKING DATABASE CONNECTIVITY"
echo "---------------------------------"

cd /var/www/vc-assessment/backend 2>/dev/null

if [ -f "dist/config/database-postgres.js" ]; then
    echo "Testing database connection..."
    node -e "
    require('dotenv').config();
    const { getDatabase } = require('./dist/config/database-postgres.js');
    getDatabase().then(db => db.connect()).then(client => {
      return client.query('SELECT COUNT(*) FROM questions');
    }).then(result => {
      console.log('✓ Database connected - Questions in DB:', result.rows[0].count);
      process.exit(0);
    }).catch(err => {
      console.log('✗ Database error:', err.message);
      process.exit(1);
    });
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_status 0 "Database connection successful"
    else
        print_status 1 "Database connection failed"
    fi
else
    print_warning "Backend not built - run 'npm run build' in backend directory"
fi

echo ""

# =============================================================================
# 7. CHECK LOGS FOR ERRORS
# =============================================================================
echo "7. CHECKING RECENT LOGS"
echo "----------------------"

if [ -f "/var/log/vc-assessment/error.log" ]; then
    echo "Recent errors from application log:"
    tail -10 /var/log/vc-assessment/error.log 2>/dev/null || echo "No recent errors in application log"
else
    print_warning "Application error log not found"
fi

if [ -f "/var/log/nginx/error.log" ]; then
    echo ""
    echo "Recent Nginx errors:"
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent Nginx errors"
else
    print_warning "Nginx error log not found"
fi

echo ""

# =============================================================================
# 8. SYSTEM RESOURCES
# =============================================================================
echo "8. SYSTEM RESOURCES"
echo "------------------"

echo "Disk usage:"
df -h / 2>/dev/null || echo "Could not check disk usage"

echo ""
echo "Memory usage:"
free -h 2>/dev/null || echo "Could not check memory usage"

echo ""

# =============================================================================
# SUMMARY AND RECOMMENDATIONS
# =============================================================================
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="

echo ""
echo "If you're still experiencing issues, check:"
echo "1. Browser developer console for JavaScript errors"
echo "2. Network tab in browser dev tools for failed API requests"
echo "3. CORS configuration in your backend"
echo "4. Firewall settings blocking API requests"
echo ""
echo "Common fixes:"
echo "- Rebuild frontend: cd /var/www/vc-assessment/frontend && npm run build"
echo "- Restart backend: pm2 restart vc-assessment-backend"
echo "- Restart nginx: sudo systemctl restart nginx"
echo "- Check SSL certificate: sudo certbot certificates"
echo ""
echo "For immediate help, run: ./quick-fix.sh"
echo "=========================================="
