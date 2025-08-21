# Troubleshooting Guide

## Common Deployment Issues

### 1. Frontend Build Hanging or Failing

**Common Symptoms:**

- Build process hangs indefinitely
- "Maximum call stack size exceeded" error
- Out of memory errors during build
- Build times out after several minutes

**Causes:**

- Low memory on t3.micro instances (1GB RAM)
- Circular references in environment variables (dotenv-expand)
- Corrupted node_modules or npm cache
- Insufficient disk space

**Solutions:**

#### Quick Fix: Use the Frontend Build Fix Script

```bash
cd /var/www/vc-assessment/deployment
chmod +x fix-frontend-build.sh
./fix-frontend-build.sh
```

This script automatically:

- Checks system resources
- Cleans up previous build attempts
- Optimizes memory settings
- Tries multiple build strategies
- Creates swap file if needed

#### Manual Fix Options:

**Option 1: Memory-optimized build**

```bash
cd /var/www/vc-assessment/frontend
export NODE_OPTIONS="--max-old-space-size=512"
DISABLE_DOTENV_EXPANSION=true GENERATE_SOURCEMAP=false npm run build
```

**Option 2: Clean and rebuild**

```bash
cd /var/www/vc-assessment/frontend
rm -rf node_modules build
npm cache clean --force
npm install --no-audit --no-fund
DISABLE_DOTENV_EXPANSION=true npm run build
```

**Option 3: Create swap file for low-memory systems**

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Option 4: Disable dotenv expansion (for circular reference errors)**

Add this to your `.env` file:

```bash
DISABLE_DOTENV_EXPANSION=true
```

**Option 5: Check for circular references**

Look for environment variables that reference themselves:

```bash
# BAD - circular reference
REACT_APP_API_URL=${REACT_APP_API_URL}/api

# GOOD - direct value
REACT_APP_API_URL=https://yourdomain.com/api
```

### 2. TypeScript Import Error During Database Setup

**Error Message:**

```
SyntaxError: Unexpected token ':'
    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
    at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:316:18)
```

**Cause:**
The deployment script is trying to require TypeScript files directly, but Node.js can't understand TypeScript syntax.

**Solutions:**

#### Option 1: Ensure backend is built first

```bash
cd /var/www/vc-assessment/backend
npm run build
```

#### Option 2: Use compiled JavaScript files

Update any scripts that reference TypeScript files to use the compiled versions:

```bash
# Instead of requiring .ts files:
const { testConnection } = require('./src/config/database-postgres.ts');

# Use compiled .js files:
const { testConnection } = require('./dist/config/database-postgres.js');
```

#### Option 3: Manual database setup

If the automated setup fails, set up the database manually:

```bash
cd /var/www/vc-assessment/backend
npm run build
node -e "
const { testConnection, initializeDatabase, seedDatabase } = require('./dist/config/database-postgres.js');
testConnection().then(() => initializeDatabase()).then(() => seedDatabase()).then(() => console.log('Database setup complete')).catch(console.error);
"
```

### 3. Database Connection Issues

**Error Message:**

```
Database connection failed
```

**Solutions:**

1. Verify RDS endpoint and credentials
2. Check security group allows connections on port 5432
3. Ensure RDS instance is in the same VPC or publicly accessible
4. Test connection manually:

```bash
psql --host=your-rds-endpoint.region.rds.amazonaws.com --port=5432 --dbname=vc_assessment --username=postgres
```

### 3. SSL Certificate Issues

**Error Message:**

```
SSL certificate check failed
```

**Solutions:**

1. Ensure DNS is pointing to your EC2 instance
2. Check domain ownership
3. Manually run certbot:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. PM2 Process Issues

**Check PM2 status:**

```bash
pm2 status
pm2 logs
```

**Restart processes:**

```bash
pm2 restart all
pm2 reload all
```

### 5. Nginx Configuration Issues

**Test Nginx configuration:**

```bash
sudo nginx -t
```

**Check Nginx logs:**

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 6. Build Process Debugging

**Frontend build with verbose output:**

```bash
cd /var/www/vc-assessment/frontend
DISABLE_DOTENV_EXPANSION=true npm run build --verbose
```

**Backend build:**

```bash
cd /var/www/vc-assessment/backend
npm run build
```

### 7. Environment Variable Issues

**Check current environment variables:**

```bash
printenv | grep REACT_APP
printenv | grep NODE_ENV
```

**Clear all React environment variables:**

```bash
for var in $(printenv | grep '^REACT_APP' | cut -d= -f1); do
    unset $var
done
```

## Manual Deployment Steps

If the automated script fails, you can deploy manually:

### 1. Install Dependencies

```bash
# System packages
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Application dependencies
cd /var/www/vc-assessment/backend && npm install && npm run build
cd /var/www/vc-assessment/frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cd /var/www/vc-assessment/backend
cp .env.production .env
# Edit .env with your actual values

# Frontend
cd /var/www/vc-assessment/frontend
cp .env.production .env
echo "DISABLE_DOTENV_EXPANSION=true" >> .env
# Edit .env with your actual values
```

### 3. Build Frontend

```bash
cd /var/www/vc-assessment/frontend
DISABLE_DOTENV_EXPANSION=true npm run build
```

### 4. Configure Services

```bash
# Nginx
sudo cp /var/www/vc-assessment/deployment/nginx.conf /etc/nginx/sites-available/vc-assessment
sudo ln -sf /etc/nginx/sites-available/vc-assessment /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# PM2
cd /var/www/vc-assessment/deployment
pm2 start ecosystem.config.js --env production
pm2 save
```

### 5. Setup SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Useful Commands

### Logs

```bash
# PM2 logs
pm2 logs
pm2 logs vc-assessment-backend
pm2 logs vc-assessment-frontend

# System logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/vc-assessment/*.log
```

### Process Management

```bash
# PM2
pm2 status
pm2 restart all
pm2 stop all
pm2 delete all

# System services
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl status certbot.timer
```

### Database

```bash
# Connect to PostgreSQL
psql --host=your-rds-endpoint --port=5432 --dbname=vc_assessment --username=postgres

# Test database connection from Node.js
cd /var/www/vc-assessment/backend
node -e "const { testConnection } = require('./dist/config/database-postgres.js'); testConnection().then(console.log);"
```

## Getting Help

If you continue to experience issues:

1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running (`pm2 status`, `sudo systemctl status nginx`)
4. Test each component individually (database connection, backend API, frontend build)
5. Review the deployment guide for any missed steps

For additional support, please check the project documentation or create an issue in the repository.
