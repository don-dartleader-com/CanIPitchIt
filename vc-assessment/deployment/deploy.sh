#!/bin/bash

# VC Assessment Tool - AWS EC2 Deployment Script
# This script automates the deployment of the VC Assessment application on EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME="${DOMAIN_NAME:-yourdomain.com}"
DB_HOST="${DB_HOST:-your-rds-endpoint.region.rds.amazonaws.com}"
DB_NAME="${DB_NAME:-vc_assessment}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-your_secure_rds_password}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yourdomain.com}"

# Directories
APP_DIR="/var/www/vc-assessment"
LOG_DIR="/var/log/vc-assessment"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo -e "${BLUE}🚀 Starting VC Assessment Tool Deployment${NC}"
echo "=================================================="

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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as ubuntu user with sudo privileges."
        exit 1
    fi
}

# Function to update system packages
update_system() {
    echo -e "${BLUE}📦 Updating system packages...${NC}"
    sudo apt update && sudo apt upgrade -y
    print_status "System packages updated"
}

# Function to install Node.js
install_nodejs() {
    echo -e "${BLUE}📦 Installing Node.js...${NC}"
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    pm2_version=$(pm2 --version)
    
    print_status "Node.js $node_version installed"
    print_status "npm $npm_version installed"
    print_status "PM2 $pm2_version installed"
}

# Function to install Nginx
install_nginx() {
    echo -e "${BLUE}📦 Installing Nginx...${NC}"
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_status "Nginx installed and started"
}

# Function to install Certbot for SSL
install_certbot() {
    echo -e "${BLUE}📦 Installing Certbot for SSL...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
    print_status "Certbot installed"
}

# Function to create application directories
create_directories() {
    echo -e "${BLUE}📁 Creating application directories...${NC}"
    
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $LOG_DIR
    sudo chown -R $USER:$USER $APP_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    
    print_status "Application directories created"
}

# Function to clone repository
clone_repository() {
    echo -e "${BLUE}📥 Cloning repository...${NC}"
    
    if [ -d "$APP_DIR/.git" ]; then
        print_warning "Repository already exists, pulling latest changes..."
        cd $APP_DIR
        git pull origin main
    else
        # Replace with your actual repository URL
        git https://github.com/don-dartleader-com/CanIPitchIt.git $APP_DIR
        cd $APP_DIR
    fi
    
    print_status "Repository cloned/updated"
}

# Function to install backend dependencies
install_backend_deps() {
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    
    cd $APP_DIR/backend
    npm install
    npm run build
    
    print_status "Backend dependencies installed and built"
}

# Function to install frontend dependencies
install_frontend_deps() {
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    
    cd $APP_DIR/frontend
    
    # Install dependencies with timeout and memory optimization
    echo -e "${YELLOW}Installing npm dependencies (this may take a few minutes)...${NC}"
    timeout 600 npm install --no-audit --no-fund --prefer-offline || {
        print_error "npm install timed out or failed"
        print_warning "Retrying with cache clean..."
        npm cache clean --force
        timeout 600 npm install --no-audit --no-fund || {
            print_error "npm install failed after retry"
            exit 1
        }
    }
    
    # Copy production environment file and disable dotenv expansion
    cp .env.production .env
    
    # Update API URL in production env
    sed -i "s/yourdomain.com/$DOMAIN_NAME/g" .env
    
    # Ensure DISABLE_DOTENV_EXPANSION is set to prevent circular reference issues
    if ! grep -q "DISABLE_DOTENV_EXPANSION" .env; then
        echo "DISABLE_DOTENV_EXPANSION=true" >> .env
    fi
    
    # Clear any potentially problematic environment variables from the system
    unset REACT_APP_API_URL
    unset REACT_APP_APP_NAME
    unset REACT_APP_VERSION
    
    # Increase Node.js memory limit for build process
    export NODE_OPTIONS="--max-old-space-size=1024"
    
    # Build frontend with timeout, progress monitoring, and memory optimization
    echo -e "${YELLOW}Building frontend (this may take 5-10 minutes on t3.micro)...${NC}"
    echo -e "${YELLOW}Progress will be shown below:${NC}"
    
    # Create a background process to monitor build progress
    (
        sleep 30
        while kill -0 $$ 2>/dev/null; do
            echo -e "${BLUE}Build still in progress... ($(date))${NC}"
            sleep 60
        done
    ) &
    MONITOR_PID=$!
    
    # Run the build with timeout
    if timeout 900 bash -c "DISABLE_DOTENV_EXPANSION=true npm run build 2>&1 | tee /tmp/frontend-build.log"; then
        kill $MONITOR_PID 2>/dev/null || true
        print_status "Frontend build completed successfully"
        
        # Check if build directory was created
        if [ ! -d "build" ]; then
            print_error "Build directory not found after build"
            cat /tmp/frontend-build.log
            exit 1
        fi
        
        # Check build size
        BUILD_SIZE=$(du -sh build | cut -f1)
        print_status "Build size: $BUILD_SIZE"
        
    else
        kill $MONITOR_PID 2>/dev/null || true
        print_error "Frontend build failed or timed out (15 minutes)"
        echo -e "${YELLOW}Build log:${NC}"
        cat /tmp/frontend-build.log
        
        # Try alternative build approach for low-memory systems
        print_warning "Attempting memory-optimized build..."
        export NODE_OPTIONS="--max-old-space-size=512"
        
        if timeout 1200 bash -c "DISABLE_DOTENV_EXPANSION=true GENERATE_SOURCEMAP=false npm run build"; then
            print_status "Memory-optimized build completed"
        else
            print_error "All build attempts failed"
            exit 1
        fi
    fi
    
    print_status "Frontend dependencies installed and built"
}

# Function to setup environment files
setup_environment() {
    echo -e "${BLUE}⚙️  Setting up environment files...${NC}"
    
    # Backend environment
    cd $APP_DIR/backend
    cp .env.production .env
    
    # Update environment variables
    sed -i "s/your-rds-endpoint.region.rds.amazonaws.com/$DB_HOST/g" .env
    sed -i "s/your_secure_rds_password/$DB_PASSWORD/g" .env
    sed -i "s/vc_assessment/$DB_NAME/g" .env
    sed -i "s/postgres/$DB_USER/g" .env
    sed -i "s/your_super_secure_jwt_secret_key_for_production_min_32_chars/$JWT_SECRET/g" .env
    sed -i "s/yourdomain.com/$DOMAIN_NAME/g" .env
    sed -i "s/admin@yourdomain.com/$ADMIN_EMAIL/g" .env
    
    print_status "Environment files configured"
}

# Function to setup database
setup_database() {
    echo -e "${BLUE}🗄️  Setting up PostgreSQL database...${NC}"
    
    cd $APP_DIR/backend
    
    # Ensure the backend is built first
    if [ ! -d "dist" ]; then
        print_warning "Backend not built yet, building now..."
        npm run build
    fi
    
    # Use standalone database setup script to avoid TypeScript module resolution issues
    echo -e "${YELLOW}Running database setup using standalone script...${NC}"
    
    # Verify the compiled file exists
    if [ ! -f "dist/config/database-postgres.js" ]; then
        print_error "Compiled database file not found. Rebuilding backend..."
        npm run build
        if [ ! -f "dist/config/database-postgres.js" ]; then
            print_error "Failed to compile database-postgres.ts"
            exit 1
        fi
    fi
    
    # Run the standalone database setup script with timeout
    if timeout 120 node $APP_DIR/deployment/setup-database.js; then
        print_status "Database setup completed successfully"
    else
        print_error "Database setup failed or timed out"
        print_warning "Verify the following:"
        print_warning "- RDS endpoint is correct: $DB_HOST"
        print_warning "- Database credentials are valid"
        print_warning "- Security group allows connections from this EC2 instance"
        print_warning "- RDS instance is in the same VPC or properly configured"
        print_warning "- Backend environment file is properly configured"
        exit 1
    fi
}

# Function to migrate data from SQLite (if exists)
migrate_data() {
    echo -e "${BLUE}🔄 Checking for existing SQLite data...${NC}"
    
    if [ -f "$APP_DIR/backend/database.sqlite" ]; then
        print_warning "SQLite database found. Starting migration to PostgreSQL..."
        
        cd $APP_DIR/deployment
        node migrate-to-postgres.js
        
        print_status "Data migration completed"
    else
        print_status "No SQLite database found, skipping migration"
    fi
}

# Function to configure Nginx
configure_nginx() {
    echo -e "${BLUE}⚙️  Configuring Nginx...${NC}"
    
    # Copy nginx configuration
    sudo cp $APP_DIR/deployment/nginx.conf $NGINX_SITES/vc-assessment
    
    # Update domain name in nginx config
    sudo sed -i "s/yourdomain.com/$DOMAIN_NAME/g" $NGINX_SITES/vc-assessment
    
    # Enable site
    sudo ln -sf $NGINX_SITES/vc-assessment $NGINX_ENABLED/
    
    # Remove default site
    sudo rm -f $NGINX_ENABLED/default
    
    # Test nginx configuration
    sudo nginx -t
    
    print_status "Nginx configured"
}

# Function to setup SSL certificate
setup_ssl() {
    echo -e "${BLUE}🔒 Setting up SSL certificate...${NC}"
    
    # Obtain SSL certificate
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL
    
    # Setup auto-renewal
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    print_status "SSL certificate configured and auto-renewal enabled"
}

# Function to setup PM2
setup_pm2() {
    echo -e "${BLUE}⚙️  Setting up PM2 process manager...${NC}"
    
    cd $APP_DIR/deployment
    
    # Update ecosystem config with correct paths
    sed -i "s/yourdomain.com/$DOMAIN_NAME/g" ecosystem.config.js
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
    
    print_status "PM2 configured and application started"
}

# Function to setup firewall
setup_firewall() {
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 'Nginx Full'
    
    # Show status
    sudo ufw status
    
    print_status "Firewall configured"
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Install CloudWatch agent (optional)
    if command -v aws &> /dev/null; then
        print_status "AWS CLI found, CloudWatch agent can be configured manually"
    else
        print_warning "AWS CLI not found, skipping CloudWatch setup"
    fi
    
    # Setup log rotation
    sudo tee /etc/logrotate.d/vc-assessment > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    print_status "Log rotation configured"
}

# Function to restart services
restart_services() {
    echo -e "${BLUE}🔄 Restarting services...${NC}"
    
    # Restart Nginx
    sudo systemctl restart nginx
    
    # Reload PM2
    pm2 reload all
    
    print_status "Services restarted"
}

# Function to run health checks
health_check() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Wait for services to start
    echo -e "${YELLOW}Waiting for services to start...${NC}"
    sleep 10
    
    # Check if backend is running with retries
    echo -e "${YELLOW}Checking backend health...${NC}"
    BACKEND_HEALTHY=false
    for i in {1..5}; do
        if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
            BACKEND_HEALTHY=true
            break
        fi
        echo -e "${YELLOW}Backend not ready, attempt $i/5...${NC}"
        sleep 5
    done
    
    if [ "$BACKEND_HEALTHY" = true ]; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed after 5 attempts"
        print_warning "Checking PM2 status and logs..."
        pm2 status
        pm2 logs vc-assessment-backend --lines 20
        print_warning "Check if the backend is properly configured and database is accessible"
    fi
    
    # Check if Nginx is serving the frontend
    echo -e "${YELLOW}Checking frontend availability...${NC}"
    if curl -f -s http://localhost > /dev/null 2>&1; then
        print_status "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        print_warning "Checking Nginx configuration..."
        sudo nginx -t
        sudo systemctl status nginx
        print_warning "Check if frontend build files exist and Nginx configuration is correct"
    fi
    
    # Check SSL certificate (only if domain is not the default)
    if [ "$DOMAIN_NAME" != "yourdomain.com" ]; then
        echo -e "${YELLOW}Checking SSL certificate...${NC}"
        if curl -f -s https://$DOMAIN_NAME > /dev/null 2>&1; then
            print_status "SSL certificate check passed"
        else
            print_warning "SSL certificate check failed - this is normal if DNS is not yet configured"
            print_warning "Make sure your domain DNS points to this server's IP address"
        fi
    else
        print_warning "Using default domain name - SSL check skipped"
        print_warning "Update DOMAIN_NAME environment variable with your actual domain"
    fi
    
    # Display service status summary
    echo -e "${BLUE}Service Status Summary:${NC}"
    echo "  PM2 Processes:"
    pm2 jlist | jq -r '.[] | "    \(.name): \(.pm2_env.status)"' 2>/dev/null || pm2 status
    echo "  Nginx Status: $(sudo systemctl is-active nginx)"
    echo "  UFW Status: $(sudo ufw status | head -1)"
}

# Function to display final information
display_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Application URLs:${NC}"
    echo "  HTTP:  http://$DOMAIN_NAME"
    echo "  HTTPS: https://$DOMAIN_NAME"
    echo "  API:   https://$DOMAIN_NAME/api"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  View logs:        pm2 logs"
    echo "  Restart app:      pm2 restart all"
    echo "  Nginx status:     sudo systemctl status nginx"
    echo "  SSL renewal:      sudo certbot renew --dry-run"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Point your domain DNS to this EC2 instance"
    echo "  2. Test the application at https://$DOMAIN_NAME"
    echo "  3. Configure your email settings in the backend .env file"
    echo "  4. Set up database backups"
    echo "  5. Configure monitoring and alerts"
    echo ""
    echo -e "${YELLOW}Important Files:${NC}"
    echo "  App directory:    $APP_DIR"
    echo "  Logs directory:   $LOG_DIR"
    echo "  Nginx config:     $NGINX_SITES/vc-assessment"
    echo "  Backend env:      $APP_DIR/backend/.env"
    echo "  PM2 config:       $APP_DIR/deployment/ecosystem.config.js"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting deployment with the following configuration:${NC}"
    echo "  Domain: $DOMAIN_NAME"
    echo "  Database: $DB_HOST"
    echo "  Admin Email: $ADMIN_EMAIL"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    check_root
    update_system
    install_nodejs
    install_nginx
    install_certbot
    create_directories
    clone_repository
    install_backend_deps
    install_frontend_deps
    setup_environment
    setup_database
    migrate_data
    configure_nginx
    setup_ssl
    setup_pm2
    setup_firewall
    setup_monitoring
    restart_services
    health_check
    display_final_info
}

# Run main function
main "$@"
