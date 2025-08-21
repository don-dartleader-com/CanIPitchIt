# Dotenv-Expand Fix Documentation

## Issue

The frontend build was failing with a "Maximum call stack size exceeded" error in the dotenv-expand library:

```
RangeError: Maximum call stack size exceeded
    at RegExp.exec (<anonymous>)
    at /var/www/vc-assessment/frontend/node_modules/dotenv-expand/lib/main.js:11:49
```

## Root Cause

This error occurs when `dotenv-expand` encounters circular references in environment variables or attempts to expand variables that reference themselves, creating an infinite loop.

## Solution Implemented

### 1. Environment Files Updated

- Added `DISABLE_DOTENV_EXPANSION=true` to all environment files:
  - `frontend/.env.local`
  - `frontend/.env.production`

### 2. Deployment Script Enhanced

Updated `deployment/deploy.sh` to:

- Clear potentially problematic environment variables before building
- Explicitly set `DISABLE_DOTENV_EXPANSION=true` during the build process
- Ensure the flag is added to the production environment file

### 3. Build Command

The build now uses:

```bash
DISABLE_DOTENV_EXPANSION=true npm run build
```

## Files Modified

1. `vc-assessment-app/frontend/.env.local` - Created with expansion disabled
2. `vc-assessment-app/frontend/.env.production` - Added expansion disable flag
3. `vc-assessment-app/deployment/deploy.sh` - Enhanced frontend build process
4. `vc-assessment-app/deployment/TROUBLESHOOTING.md` - Added comprehensive troubleshooting guide

## Verification

The fix has been tested locally and the build completes successfully:

- Build time: ~30 seconds
- Output: Optimized production build created
- Status: ✅ Success (with only minor ESLint warnings)

## Usage Instructions

### For Local Development

```bash
cd vc-assessment-app/frontend
DISABLE_DOTENV_EXPANSION=true npm run build
```

### For Production Deployment

The deployment script now handles this automatically, but if building manually:

```bash
cd /var/www/vc-assessment/frontend
echo "DISABLE_DOTENV_EXPANSION=true" >> .env
DISABLE_DOTENV_EXPANSION=true npm run build
```

## Prevention

To prevent this issue in the future:

1. Always use direct values in environment variables (avoid `${VAR}` syntax)
2. Include `DISABLE_DOTENV_EXPANSION=true` in all environment files
3. Clear system environment variables before building if they might conflict

## Related Documentation

- See `TROUBLESHOOTING.md` for additional debugging steps
- See `DEPLOYMENT_GUIDE.md` for complete deployment instructions
