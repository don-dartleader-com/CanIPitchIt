# Production Fix Guide: "Failed to load questions" Error

## Issue Summary

Your VC Assessment application is experiencing a "Failed to load questions" error in production. The root cause has been identified as a **protocol mismatch** between your frontend and backend configurations:

- **Frontend was configured to use**: `http://dev.canipitchit.com/api` (HTTP)
- **Backend expects**: `https://dev.canipitchit.com` (HTTPS)

## ✅ What Has Been Fixed

1. **Frontend Environment Configuration**: Updated `REACT_APP_API_URL` from HTTP to HTTPS
2. **Created Diagnostic Tools**: Two scripts to help troubleshoot and fix production issues
3. **Identified Configuration Issues**: Protocol mismatch and potential build problems

## 🚀 Immediate Fix Instructions

### Step 1: Deploy the Fixed Configuration

SSH into your production server and run these commands:

```bash
# Navigate to your project directory
cd /var/www/vc-assessment

# Pull the latest changes (if you've committed them)
git pull origin main

# Or manually update the frontend .env file
nano frontend/.env
# Ensure REACT_APP_API_URL=https://dev.canipitchit.com/api
```

### Step 2: Run the Quick Fix Script

```bash
# Navigate to deployment directory
cd /var/www/vc-assessment/deployment

# Run the automated fix script
./quick-fix.sh
```

This script will:

- ✅ Update frontend environment to use HTTPS
- ✅ Rebuild the frontend with correct configuration
- ✅ Restart backend and nginx services
- ✅ Test all endpoints
- ✅ Verify database connectivity

### Step 3: Verify the Fix

After running the quick fix script, test your application:

1. **Open your browser**: Navigate to `https://dev.canipitchit.com/`
2. **Try to start an assessment**: The questions should now load properly
3. **Check browser console**: Should be free of API errors

## 🔍 If Issues Persist

### Run Full Diagnostics

```bash
cd /var/www/vc-assessment/deployment
./diagnose-production.sh
```

This comprehensive diagnostic script will check:

- Environment configuration
- Process status (PM2, Nginx)
- Local and external API connectivity
- SSL certificate status
- Database connectivity
- Recent error logs
- System resources

### Common Additional Issues

#### 1. Database Empty

If diagnostics show 0 questions in database:

```bash
cd /var/www/vc-assessment/backend
node dist/scripts/seedQuestions.js
```

#### 2. SSL Certificate Issues

If HTTPS endpoints fail:

```bash
sudo certbot certificates
sudo certbot renew
sudo systemctl restart nginx
```

#### 3. Backend Not Starting

Check PM2 logs:

```bash
pm2 logs vc-assessment-backend
pm2 restart vc-assessment-backend
```

#### 4. Nginx Configuration Issues

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Manual Troubleshooting Commands

### Test API Endpoints Directly

```bash
# Test local backend
curl http://localhost:5000/api/questions

# Test external HTTPS endpoint
curl https://dev.canipitchit.com/api/questions

# Test health endpoint
curl https://dev.canipitchit.com/api/health
```

### Check Service Status

```bash
# PM2 processes
pm2 status
pm2 monit

# Nginx status
sudo systemctl status nginx

# Check ports
netstat -tulpn | grep :5000
netstat -tulpn | grep :443
```

### Browser Debugging

1. **Open Developer Tools** (F12)
2. **Network Tab**: Look for failed API requests
3. **Console Tab**: Check for JavaScript errors
4. **Security Tab**: Verify SSL certificate

## 📋 Prevention Checklist

To prevent this issue in the future:

- [ ] Always use HTTPS in production environment variables
- [ ] Test both local and external API endpoints after deployment
- [ ] Verify SSL certificates are properly configured
- [ ] Use the diagnostic script before and after deployments
- [ ] Monitor PM2 and Nginx logs regularly

## 🔧 Configuration Files Updated

### Frontend Environment (`frontend/.env`)

```env
REACT_APP_API_URL=https://dev.canipitchit.com/api
DISABLE_DOTENV_EXPANSION=true
GENERATE_SOURCEMAP=false
```

### Backend Environment (`backend/.env`)

```env
FRONTEND_URL=https://dev.canipitchit.com
PORT=5000
NODE_ENV=production
```

## 📞 Support

If you continue to experience issues after following this guide:

1. **Run diagnostics**: `./diagnose-production.sh`
2. **Check logs**: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
3. **Verify browser console**: Look for specific error messages
4. **Test individual components**: API, database, SSL certificate

## 🎯 Expected Results

After applying these fixes, you should see:

- ✅ Questions load properly in the assessment
- ✅ No "Failed to load questions" errors
- ✅ HTTPS endpoints respond correctly
- ✅ Browser console shows no API errors
- ✅ All diagnostic checks pass

---

**Last Updated**: $(date)
**Scripts Created**: `quick-fix.sh`, `diagnose-production.sh`
**Issue**: Protocol mismatch (HTTP vs HTTPS)
**Status**: Fixed ✅
