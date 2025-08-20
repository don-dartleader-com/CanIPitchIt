# VC Assessment Tool - AWS EC2 Deployment Package

This deployment package provides everything you need to deploy the VC Assessment Tool on AWS EC2 with PostgreSQL RDS, including automated scripts, manual instructions, and comprehensive monitoring.

## 📦 Package Contents

### Core Deployment Files

- **`deploy.sh`** - Automated deployment script
- **`DEPLOYMENT_GUIDE.md`** - Detailed step-by-step manual instructions
- **`MONITORING_BACKUP.md`** - Comprehensive monitoring and backup setup

### Configuration Files

- **`nginx.conf`** - Production Nginx configuration
- **`ecosystem.config.js`** - PM2 process management configuration
- **`database-postgres.ts`** - PostgreSQL database configuration
- **`.env.production`** - Production environment templates

### Migration & Utilities

- **`migrate-to-postgres.js`** - SQLite to PostgreSQL migration script

## 🚀 Quick Deployment

### Prerequisites

1. **AWS EC2 Instance** (t3.micro or larger) running Ubuntu 20.04/22.04
2. **PostgreSQL RDS Instance** (db.t3.micro for development)
3. **Domain name** pointing to your EC2 instance
4. **SSH access** to your EC2 instance

### One-Command Deployment

```bash
# 1. SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Set your configuration
export DOMAIN_NAME="yourdomain.com"
export DB_HOST="your-rds-endpoint.region.rds.amazonaws.com"
export DB_PASSWORD="your_secure_password"
export ADMIN_EMAIL="admin@yourdomain.com"

# 3. Clone and deploy
git clone https://github.com/your-username/vc-assessment.git
cd vc-assessment
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

## 📋 Deployment Architecture

### Single EC2 Instance Setup

```
┌─────────────────────────────────────────┐
│                EC2 Instance             │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │    Nginx    │  │   Node.js App   │   │
│  │ (Port 80/443)│  │   (Port 5000)   │   │
│  │             │  │                 │   │
│  │ ┌─────────┐ │  │ ┌─────────────┐ │   │
│  │ │Frontend │ │  │ │   Backend   │ │   │
│  │ │ (React) │ │  │ │ (Express)   │ │   │
│  │ └─────────┘ │  │ └─────────────┘ │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            PostgreSQL RDS               │
│         (Managed Database)              │
└─────────────────────────────────────────┘
```

### Key Components

- **Nginx**: Reverse proxy, SSL termination, static file serving
- **PM2**: Process management, auto-restart, monitoring
- **Node.js Backend**: API server with PostgreSQL connection
- **React Frontend**: Built and served as static files
- **PostgreSQL RDS**: Managed database with automated backups

## 🔧 Configuration Overview

### Environment Variables

The deployment uses these key environment variables:

| Variable      | Description         | Example                             |
| ------------- | ------------------- | ----------------------------------- |
| `DOMAIN_NAME` | Your domain name    | `yourdomain.com`                    |
| `DB_HOST`     | RDS endpoint        | `your-rds.region.rds.amazonaws.com` |
| `DB_PASSWORD` | Database password   | `secure_password_123`               |
| `JWT_SECRET`  | JWT signing secret  | `auto-generated-32-chars`           |
| `ADMIN_EMAIL` | Admin email address | `admin@yourdomain.com`              |

### Security Features

- **SSL/TLS encryption** with Let's Encrypt certificates
- **Security headers** (HSTS, CSP, XSS protection)
- **Rate limiting** on API endpoints
- **Firewall configuration** (UFW)
- **Database connection pooling**

## 📊 Monitoring & Observability

### Built-in Monitoring

- **PM2 monitoring** - Process health and performance
- **Nginx access/error logs** - Web server metrics
- **Application logs** - Structured JSON logging
- **Health check endpoint** - `/health` for uptime monitoring

### Optional CloudWatch Integration

- **System metrics** (CPU, memory, disk)
- **Application logs** forwarded to CloudWatch
- **Custom alarms** for critical thresholds
- **Dashboard** for visual monitoring

### Log Locations

```
/var/log/vc-assessment/
├── combined.log      # Application logs
├── error.log         # Error logs only
└── backup.log        # Backup operation logs

/var/log/nginx/
├── vc-assessment.access.log  # Web access logs
└── vc-assessment.error.log   # Web server errors
```

## 💾 Backup Strategy

### Automated Backups

- **RDS automated backups** (7-day retention)
- **Daily database dumps** with compression
- **Weekly application backups** (code + config)
- **Log rotation** (30-day retention)

### Optional S3 Integration

- **Backup sync to S3** for off-site storage
- **Lifecycle policies** for cost optimization
- **Cross-region replication** for disaster recovery

## 🚨 Alerting & Health Checks

### Health Monitoring

- **System resource monitoring** (disk, memory, CPU)
- **Application health checks** every 5 minutes
- **Database connectivity checks**
- **SSL certificate expiration monitoring**

### Alert Channels

- **Email alerts** for critical issues
- **CloudWatch alarms** (if configured)
- **External uptime monitoring** (UptimeRobot, Pingdom)

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Application Won't Start

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs vc-assessment-backend

# Check environment variables
cat /var/www/vc-assessment/backend/.env
```

#### Database Connection Issues

```bash
# Test database connectivity
cd /var/www/vc-assessment/backend
node -e "require('dotenv').config(); const { testConnection } = require('./src/config/database-postgres.ts'); testConnection();"

# Check RDS security groups
# Ensure EC2 security group can access RDS on port 5432
```

#### SSL Certificate Problems

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test nginx configuration
sudo nginx -t
```

#### High Resource Usage

```bash
# Check system resources
htop
df -h
free -h

# Check application performance
pm2 monit

# Analyze logs for errors
tail -f /var/log/vc-assessment/combined.log
```

## 📈 Performance Optimization

### For t3.micro Instances

- **Single PM2 process** (fork mode)
- **Connection pooling** (max 20 connections)
- **Nginx caching** for static assets
- **Gzip compression** enabled

### For Larger Instances

- **PM2 cluster mode** (multiple processes)
- **Increased connection pool** size
- **Redis caching** (optional)
- **CDN integration** (CloudFront)

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest code
cd /var/www/vc-assessment
git pull origin main

# Update backend
cd backend
npm install
npm run build

# Update frontend
cd ../frontend
npm install
npm run build

# Restart application
pm2 restart all
```

### System Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
sudo systemctl restart nginx
pm2 restart all

# Check system health
/usr/local/bin/health-check
```

## 📞 Support & Resources

### Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Detailed manual instructions
- **[Monitoring & Backup](MONITORING_BACKUP.md)** - Advanced monitoring setup
- **[AWS RDS Documentation](https://docs.aws.amazon.com/rds/)**
- **[PM2 Documentation](https://pm2.keymetrics.io/docs/)**

### Useful Commands

```bash
# View deployment status
pm2 status
sudo systemctl status nginx
curl https://yourdomain.com/health

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/vc-assessment.error.log
tail -f /var/log/vc-assessment/combined.log

# System monitoring
htop
df -h
free -h

# SSL certificate management
sudo certbot certificates
sudo certbot renew --dry-run
```

### Emergency Procedures

#### Application Down

1. Check PM2 status: `pm2 status`
2. Restart application: `pm2 restart all`
3. Check logs: `pm2 logs`
4. Verify database connection
5. Check system resources

#### Database Issues

1. Check RDS status in AWS Console
2. Verify security group rules
3. Test connectivity from EC2
4. Check application logs for database errors
5. Consider failover to read replica (if configured)

#### SSL Certificate Expired

1. Check certificate status: `sudo certbot certificates`
2. Renew certificate: `sudo certbot renew`
3. Restart nginx: `sudo systemctl restart nginx`
4. Verify SSL: `curl -I https://yourdomain.com`

## 🎯 Next Steps After Deployment

1. **Configure DNS** - Point your domain to the EC2 instance
2. **Test application** - Verify all functionality works
3. **Set up monitoring** - Configure CloudWatch and external monitoring
4. **Configure backups** - Set up S3 sync and test restore procedures
5. **Performance testing** - Load test your application
6. **Security review** - Run security scans and penetration tests
7. **Documentation** - Document any custom configurations
8. **Team training** - Train your team on maintenance procedures

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] EC2 instance launched and accessible
- [ ] RDS PostgreSQL instance created
- [ ] Security groups configured
- [ ] Domain DNS configured
- [ ] SSH key pair available

### Deployment

- [ ] Environment variables set
- [ ] Deployment script executed successfully
- [ ] Application accessible via HTTP
- [ ] SSL certificate obtained and working
- [ ] Database connection verified
- [ ] Health check endpoint responding

### Post-Deployment

- [ ] Monitoring configured
- [ ] Backup scripts tested
- [ ] Log rotation configured
- [ ] Alerting set up
- [ ] Performance baseline established
- [ ] Documentation updated
- [ ] Team notified

---

**Need help?** Check the troubleshooting section or review the detailed guides in this deployment package.
