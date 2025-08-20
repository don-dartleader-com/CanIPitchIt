# Troubleshooting Guide

## Common Deployment Issues

### 1. Frontend Build Error: "Maximum call stack size exceeded" (dotenv-expand)

**Error Message:**

```
RangeError: Maximum call stack size exceeded
    at RegExp.exec (<anonymous>)
    at /var/www/vc-assessment/frontend/node_modules/dotenv-expand/lib/main.js:11:49
```

**Cause:**
This error occurs when `dotenv-expand` encounters circular references in environment variables or malformed variable expansion syntax.

**Solutions:**

#### Option 1: Disable dotenv expansion (Recommended)

Add this to your `.env` file:

```bash
DISABLE_DOTENV_EXPANSION=true
```

#### Option 2: Clear problematic environment variables

Before building, clear any potentially conflicting environment variables:

```bash
unset REACT_APP_API_URL
unset REACT_APP_APP_NAME
unset REACT_APP_VERSION
DISABLE_DOTENV_EXPANSION=true npm run build
```

#### Option 3: Check for circular references

Look for environment variables that reference themselves:

```bash
# BAD - circular reference
REACT_APP_API_URL=${REACT_APP_API_URL}/api

# GOOD - direct value
REACT_APP_API_URL=https://yourdomain.com/api
```

### 2. Database Connection Issues

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
psql -h your-rds-endpoint.region.rds.amazonaws.com -U postgres -d vc_assessment
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
psql -h your-rds-endpoint -U postgres -d vc_assessment

# Test database connection from Node.js
cd /var/www/vc-assessment/backend
node -e "const { testConnection } = require('./src/config/database-postgres'); testConnection().then(console.log);"
```

## Getting Help

If you continue to experience issues:

1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure all services are running (`pm2 status`, `sudo systemctl status nginx`)
4. Test each component individually (database connection, backend API, frontend build)
5. Review the deployment guide for any missed steps

For additional support, please check the project documentation or create an issue in the repository.
