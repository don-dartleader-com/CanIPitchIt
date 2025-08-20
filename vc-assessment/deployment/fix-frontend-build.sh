#!/bin/bash

# Frontend Build Fix Script for VC Assessment Tool
# This script specifically addresses hanging frontend builds on low-memory systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/vc-assessment"
FRONTEND_DIR="$APP_DIR/frontend"

echo -e "${BLUE}🔧 Frontend Build Fix Script${NC}"
echo "=================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check system resources
check_system_resources() {
    echo -e "${BLUE}📊 Checking system resources...${NC}"
    
    # Check available memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    
    echo "Total Memory: ${TOTAL_MEM}MB"
    echo "Available Memory: ${AVAILABLE_MEM}MB"
    
    if [ "$AVAILABLE_MEM" -lt 500 ]; then
        print_warning "Low memory detected (${AVAILABLE_MEM}MB available)"
        print_warning "This may cause build issues. Consider stopping other services temporarily."
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "Disk Usage: ${DISK_USAGE}%"
    
    if [ "$DISK_USAGE" -gt 80 ]; then
        print_warning "High disk usage detected (${DISK_USAGE}%)"
    fi
    
    print_status "System resource check completed"
}

# Function to clean up previous build attempts
cleanup_previous_builds() {
    echo -e "${BLUE}🧹 Cleaning up previous build attempts...${NC}"
    
    cd $FRONTEND_DIR
    
    # Remove build directory
    if [ -d "build" ]; then
        rm -rf build
        print_status "Removed previous build directory"
    fi
    
    # Clean npm cache
    npm cache clean --force
    print_status "Cleaned npm cache"
    
    # Remove node_modules if corrupted
    if [ -d "node_modules" ]; then
        print_warning "Checking node_modules integrity..."
        if ! npm ls > /dev/null 2>&1; then
            print_warning "node_modules appears corrupted, removing..."
            rm -rf node_modules
            print_status "Removed corrupted node_modules"
        fi
    fi
    
    # Clean temporary files
    rm -f /tmp/frontend-build.log
    
    print_status "Cleanup completed"
}

# Function to optimize system for build
optimize_system() {
    echo -e "${BLUE}⚡ Optimizing system for build...${NC}"
    
    # Create swap file if not exists and memory is low
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$TOTAL_MEM" -lt 2048 ] && [ ! -f /swapfile ]; then
        print_warning "Creating swap file for low-memory system..."
        sudo fallocate -l 1G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        print_status "Swap file created and activated"
    fi
    
    # Stop unnecessary services temporarily
    print_warning "Stopping non-essential services temporarily..."
    sudo systemctl stop apache2 2>/dev/null || true
    sudo systemctl stop mysql 2>/dev/null || true
    sudo systemctl stop postgresql 2>/dev/null || true
    
    print_status "System optimization completed"
}

# Function to install dependencies with retry logic
install_dependencies() {
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    
    cd $FRONTEND_DIR
    
    # Install with multiple retry attempts
    for attempt in 1 2 3; do
        echo -e "${YELLOW}Attempt $attempt of 3...${NC}"
        
        if timeout 600 npm install --no-audit --no-fund --prefer-offline; then
            print_status "Dependencies installed successfully"
            return 0
        else
            print_warning "Attempt $attempt failed"
            if [ $attempt -lt 3 ]; then
                print_warning "Cleaning cache and retrying..."
                npm cache clean --force
                rm -rf node_modules package-lock.json
                sleep 10
            fi
        fi
    done
    
    print_error "Failed to install dependencies after 3 attempts"
    exit 1
}

# Function to build with multiple strategies
build_frontend() {
    echo -e "${BLUE}🏗️  Building frontend with optimized settings...${NC}"
    
    cd $FRONTEND_DIR
    
    # Ensure environment is set up
    if [ ! -f ".env" ]; then
        cp .env.production .env
        echo "DISABLE_DOTENV_EXPANSION=true" >> .env
    fi
    
    # Clear problematic environment variables
    unset REACT_APP_API_URL
    unset REACT_APP_APP_NAME
    unset REACT_APP_VERSION
    
    # Strategy 1: Standard build with memory optimization
    echo -e "${YELLOW}Strategy 1: Standard build with memory optimization...${NC}"
    export NODE_OPTIONS="--max-old-space-size=1024"
    
    if timeout 900 bash -c "DISABLE_DOTENV_EXPANSION=true npm run build 2>&1 | tee /tmp/frontend-build.log"; then
        print_status "Standard build completed successfully"
        return 0
    fi
    
    print_warning "Standard build failed, trying memory-optimized build..."
    
    # Strategy 2: Memory-optimized build
    echo -e "${YELLOW}Strategy 2: Memory-optimized build...${NC}"
    export NODE_OPTIONS="--max-old-space-size=512"
    
    if timeout 1200 bash -c "DISABLE_DOTENV_EXPANSION=true GENERATE_SOURCEMAP=false npm run build 2>&1 | tee /tmp/frontend-build.log"; then
        print_status "Memory-optimized build completed successfully"
        return 0
    fi
    
    print_warning "Memory-optimized build failed, trying minimal build..."
    
    # Strategy 3: Minimal build
    echo -e "${YELLOW}Strategy 3: Minimal build with all optimizations...${NC}"
    export NODE_OPTIONS="--max-old-space-size=384"
    
    if timeout 1800 bash -c "DISABLE_DOTENV_EXPANSION=true GENERATE_SOURCEMAP=false INLINE_RUNTIME_CHUNK=false npm run build 2>&1 | tee /tmp/frontend-build.log"; then
        print_status "Minimal build completed successfully"
        return 0
    fi
    
    print_error "All build strategies failed"
    echo -e "${YELLOW}Build log:${NC}"
    cat /tmp/frontend-build.log
    exit 1
}

# Function to verify build
verify_build() {
    echo -e "${BLUE}🔍 Verifying build...${NC}"
    
    cd $FRONTEND_DIR
    
    if [ ! -d "build" ]; then
        print_error "Build directory not found"
        exit 1
    fi
    
    if [ ! -f "build/index.html" ]; then
        print_error "index.html not found in build directory"
        exit 1
    fi
    
    BUILD_SIZE=$(du -sh build | cut -f1)
    FILE_COUNT=$(find build -type f | wc -l)
    
    print_status "Build verification completed"
    print_status "Build size: $BUILD_SIZE"
    print_status "Files created: $FILE_COUNT"
}

# Function to restore system
restore_system() {
    echo -e "${BLUE}🔄 Restoring system services...${NC}"
    
    # Restart services that were stopped
    sudo systemctl start apache2 2>/dev/null || true
    sudo systemctl start mysql 2>/dev/null || true
    sudo systemctl start postgresql 2>/dev/null || true
    
    print_status "System services restored"
}

# Main function
main() {
    echo -e "${BLUE}Starting frontend build fix...${NC}"
    echo "Working directory: $FRONTEND_DIR"
    echo ""
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    check_system_resources
    cleanup_previous_builds
    optimize_system
    install_dependencies
    build_frontend
    verify_build
    restore_system
    
    echo ""
    echo -e "${GREEN}🎉 Frontend build fix completed successfully!${NC}"
    echo "=================================="
    echo -e "${BLUE}Build location:${NC} $FRONTEND_DIR/build"
    echo -e "${BLUE}Build log:${NC} /tmp/frontend-build.log"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart nginx: sudo systemctl restart nginx"
    echo "2. Test the application in your browser"
    echo "3. Check PM2 status: pm2 status"
}

# Run main function
main "$@"
