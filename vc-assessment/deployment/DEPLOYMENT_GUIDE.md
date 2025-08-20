# VC Assessment Tool - AWS EC2 Deployment Guide

This guide provides detailed step-by-step instructions for deploying the VC Assessment Tool on AWS EC2 with PostgreSQL RDS.

## 📋 Prerequisites

### AWS Resources Required

- **EC2 Instance**: t3.micro (or larger) running Ubuntu 20.04/22.04
- **RDS Instance**: PostgreSQL 13+ (db.t3.micro for development)
- **Security Groups**: Properly configured for web traffic
- **Domain Name**: Registered and pointing to your EC2 instance
- **Key Pair**: For SSH access to EC2

### Local Requirements

- SSH client
- Git (for cloning repository)
- Basic knowledge of Linux commands

## 🚀 Quick Start (Automated Deployment)

### 1. Set Environment Variables

```bash
export DOMAIN_NAME="yourdomain.com"
export DB_HOST="your-rds-endpoint.region.rds.amazonaws.com"
export DB_NAME="vc_assessment"
export DB_USER="postgres"
export DB_PASSWORD="your_secure_password"
export ADMIN_EMAIL="admin@yourdomain.com"
```

### 2. Run Deployment Script

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone the repository
git clone https://github.com/your-username/vc-assessment.git
cd vc-assessment

# Make deployment script executable
chmod +x deployment/deploy.sh

# Run deployment
./deployment/deploy.sh
```

## 📖 Manual Deployment (Step-by-Step)

### Phase 1: AWS Infrastructure Setup

#### 1.1 Create RDS PostgreSQL Instance

1. **Go to AWS RDS Console**

   - Navigate to RDS in AWS Console
   - Click "Create database"

2. **Configure Database**

   ```
   Engine: PostgreSQL
   Version: 13.x or later
   Template: Free tier (for development)
   Instance: db.t3.micro
   Database name: vc_assessment
   Master username: postgres
   Master password: [secure password]
   ```

3. **Network Settings**

   ```
   VPC: Default VPC
   Subnet group: Default
   Public access: No
   Security group: Create new (allow PostgreSQL port 5432)
   ```

4. **Additional Settings**
   ```
   Initial database name: vc_assessment
   Backup retention: 7 days
   Monitoring: Enable
   ```

#### 1.2 Configure Security Groups

1. **RDS Security Group**

   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: EC2 Security Group ID
   ```

2. **EC2 Security Group**
   ```
   SSH (22): Your IP address
   HTTP (80): 0.0.0.0/0
   HTTPS (443): 0.0.0.0/0
   ```

#### 1.3 Launch EC2 Instance

1. **Instance Configuration**

   ```
   AMI: Ubuntu Server 20.04 LTS
   Instance Type: t3.micro
   Key Pair: Your existing key pair
   Security Group: Web server security group
   Storage: 8GB gp2 (default)
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

### Phase 2: Server Setup

#### 2.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2.2 Install Node.js 18.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 2.3 Install PM2 Process Manager

```bash
sudo npm install -g pm2

# Verify installation
pm2 --version
```

#### 2.4 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify installation
sudo systemctl status nginx
```

#### 2.5 Install Certbot for SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Phase 3: Application Deployment

#### 3.1 Create Application Directories

```bash
sudo mkdir -p /var/www/vc-assessment
sudo mkdir -p /var/log/vc-assessment
sudo chown -R $USER:$USER /var/www/vc-assessment
sudo chown -R $USER:$USER /var/log/vc-assessment
```

#### 3.2 Clone Repository

```bash
git clone https://github.com/your-username/vc-assessment.git /var/www/vc-assessment
cd /var/www/vc-assessment
```

#### 3.3 Setup Backend

1. **Install Dependencies**

   ```bash
   cd /var/www/vc-assessment/backend
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.production .env

   # Edit the .env file with your actual values
   nano .env
   ```

   Update these values:

   ```env
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_PASSWORD=your_secure_rds_password
   JWT_SECRET=your_super_secure_jwt_secret_32_chars_min
   FRONTEND_URL=https://yourdomain.com
   ADMIN_EMAIL=admin@yourdomain.com
   ```

3. **Build Backend**

   ```bash
   npm run build
   ```

4. **Test Database Connection**

   ```bash
   # Test connection using the PostgreSQL config
   node -e "
   require('dotenv').config();
   const { testConnection } = require('./src/config/database-postgres.ts');
   testConnection().then(success => {
     console.log('Database connection:', success ? 'SUCCESS' : 'FAILED');
     process.exit(success ? 0 : 1);
   });
   "
   ```

5. **Initialize Database**
   ```bash
   node -e "
   require('dotenv').config();
   const { initializeDatabase, seedDatabase } = require('./src/config/database-postgres.ts');
   initializeDatabase()
     .then(() => seedDatabase())
     .then(() => console.log('Database setup complete'))
     .catch(err => { console.error(err); process.exit(1); });
   "
   ```

#### 3.4 Setup Frontend

1. **Install Dependencies**

   ```bash
   cd /var/www/vc-assessment/frontend
   npm install
   ```

2. **Configure Environment**

   ```bash
   cp .env.production .env

   # Update API URL
   sed -i "s/yourdomain.com/your-actual-domain.com/g" .env
   ```

3. **Build Frontend**
   ```bash
   npm run build
   ```

### Phase 4: Web Server Configuration

#### 4.1 Configure Nginx

1. **Copy Configuration**

   ```bash
   sudo cp /var/www/vc-assessment/deployment/nginx.conf /etc/nginx/sites-available/vc-assessment
   ```

2. **Update Domain Name**

   ```bash
   sudo sed -i "s/yourdomain.com/your-actual-domain.com/g" /etc/nginx/sites-available/vc-assessment
   ```

3. **Enable Site**

   ```bash
   sudo ln -s /etc/nginx/sites-available/vc-assessment /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

4. **Test Configuration**

   ```bash
   sudo nginx -t
   ```

5. **Restart Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

#### 4.2 Setup SSL Certificate

1. **Obtain Certificate**

   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

2. **Test Auto-renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

### Phase 5: Process Management

#### 5.1 Configure PM2

1. **Update Ecosystem Config**

   ```bash
   cd /var/www/vc-assessment/deployment
   sed -i "s/yourdomain.com/your-actual-domain.com/g" ecosystem.config.js
   ```

2. **Start Application**

   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Save PM2 Configuration**

   ```bash
   pm2 save
   ```

4. **Setup Startup Script**
   ```bash
   pm2 startup
   # Follow the instructions provided by PM2
   ```

### Phase 6: Security & Monitoring

#### 6.1 Configure Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

#### 6.2 Setup Log Rotation

```bash
sudo tee /etc/logrotate.d/vc-assessment > /dev/null <<EOF
/var/log/vc-assessment/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### Phase 7: Data Migration (If Applicable)

#### 7.1 Migrate from SQLite (Optional)

If you have existing SQLite data:

```bash
cd /var/www/vc-assessment/deployment
node migrate-to-postgres.js
```

## 🔧 Post-Deployment Configuration

### DNS Configuration

Point your domain's A record to your EC2 instance's public IP:

```
Type: A
Name: @
Value: your-ec2-public-ip
TTL: 300

Type: A
Name: www
Value: your-ec2-public-ip
TTL: 300
```

### Email Configuration

Update email settings in `/var/www/vc-assessment/backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@yourdomain.com
```

## 🏥 Health Checks & Monitoring

### Application Health

```bash
# Check backend
curl http://localhost:5000/health

# Check frontend
curl http://localhost

# Check SSL
curl https://yourdomain.com
```

### PM2 Monitoring

```bash
# View application status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check system load
htop
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start

```bash
# Check logs
pm2 logs vc-assessment-backend

# Check environment variables
cd /var/www/vc-assessment/backend
cat .env

# Test database connection
node -e "require('dotenv').config(); const { testConnection } = require('./src/config/database-postgres.ts'); testConnection();"
```

#### Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

#### Database Connection Issues

```bash
# Test RDS connectivity
telnet your-rds-endpoint.region.rds.amazonaws.com 5432

# Check security
```
