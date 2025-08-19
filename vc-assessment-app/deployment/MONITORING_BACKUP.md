# VC Assessment Tool - Monitoring & Backup Configuration

This guide covers setting up comprehensive monitoring, logging, and backup strategies for your VC Assessment Tool deployment.

## 📊 Monitoring Setup

### CloudWatch Integration

#### 1. Install CloudWatch Agent

```bash
# Download CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

# Install the agent
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Create IAM role for CloudWatch (if not exists)
# Attach CloudWatchAgentServerPolicy to your EC2 instance
```

#### 2. Configure CloudWatch Agent

Create configuration file:

```bash
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null <<EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "VCAssessment/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/vc-assessment/combined.log",
            "log_group_name": "/aws/ec2/vc-assessment/application",
            "log_stream_name": "{instance_id}/application.log"
          },
          {
            "file_path": "/var/log/nginx/vc-assessment.access.log",
            "log_group_name": "/aws/ec2/vc-assessment/nginx",
            "log_stream_name": "{instance_id}/access.log"
          },
          {
            "file_path": "/var/log/nginx/vc-assessment.error.log",
            "log_group_name": "/aws/ec2/vc-assessment/nginx",
            "log_stream_name": "{instance_id}/error.log"
          }
        ]
      }
    }
  }
}
EOF
```

#### 3. Start CloudWatch Agent

```bash
# Start the agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s

# Enable auto-start
sudo systemctl enable amazon-cloudwatch-agent
```

### Application Performance Monitoring

#### 1. PM2 Monitoring

```bash
# Install PM2 monitoring module
pm2 install pm2-server-monit

# View real-time monitoring
pm2 monit

# Generate monitoring report
pm2 report
```

#### 2. Custom Health Check Endpoint

Add to your backend (`src/routes/health.ts`):

```typescript
import { Router } from "express";
import { getDatabase } from "../config/database-postgres";

const router = Router();

router.get("/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: "disconnected",
    version: process.env.npm_package_version || "1.0.0",
  };

  try {
    const db = await getDatabase();
    const client = await db.connect();
    await client.query("SELECT 1");
    client.release();
    health.database = "connected";
  } catch (error) {
    health.database = "error";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### Uptime Monitoring

#### 1. AWS CloudWatch Alarms

Create CloudWatch alarms for:

```bash
# High CPU usage
aws cloudwatch put-metric-alarm \
  --alarm-name "VC-Assessment-High-CPU" \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High memory usage
aws cloudwatch put-metric-alarm \
  --alarm-name "VC-Assessment-High-Memory" \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name mem_used_percent \
  --namespace VCAssessment/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Disk space usage
aws cloudwatch put-metric-alarm \
  --alarm-name "VC-Assessment-Low-Disk-Space" \
  --alarm-description "Alert when disk usage exceeds 85%" \
  --metric-name used_percent \
  --namespace VCAssessment/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

#### 2. External Uptime Monitoring

Consider using services like:

- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**

Example UptimeRobot setup:

- Monitor: `https://yourdomain.com/health`
- Interval: 5 minutes
- Alert contacts: Your email/SMS

## 📋 Logging Strategy

### Centralized Logging

#### 1. Application Logs

Configure structured logging in your backend:

```typescript
// src/utils/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "vc-assessment-backend" },
  transports: [
    new winston.transports.File({
      filename: "/var/log/vc-assessment/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "/var/log/vc-assessment/combined.log",
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export default logger;
```

#### 2. Log Rotation Configuration

```bash
# Enhanced log rotation
sudo tee /etc/logrotate.d/vc-assessment > /dev/null <<EOF
/var/log/vc-assessment/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
        systemctl reload nginx
    endscript
}

/var/log/nginx/vc-assessment.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### Log Analysis

#### 1. Basic Log Analysis Scripts

```bash
# Create log analysis script
sudo tee /usr/local/bin/vc-assessment-logs > /dev/null <<'EOF'
#!/bin/bash

LOG_DIR="/var/log/vc-assessment"
NGINX_LOG_DIR="/var/log/nginx"

echo "=== VC Assessment Log Summary ==="
echo "Date: $(date)"
echo

echo "=== Application Errors (Last 24h) ==="
find $LOG_DIR -name "*.log" -mtime -1 -exec grep -h "ERROR\|error" {} \; | tail -10

echo
echo "=== Top 10 API Endpoints (Today) ==="
grep "$(date +%Y-%m-%d)" $NGINX_LOG_DIR/vc-assessment.access.log | \
  awk '{print $7}' | sort | uniq -c | sort -nr | head -10

echo
echo "=== Response Time Analysis (Today) ==="
grep "$(date +%Y-%m-%d)" $NGINX_LOG_DIR/vc-assessment.access.log | \
  awk '{print $NF}' | awk '{sum+=$1; count++} END {print "Average:", sum/count "ms"}'

echo
echo "=== Disk Usage ==="
df -h /var/log

echo
echo "=== Memory Usage ==="
free -h
EOF

chmod +x /usr/local/bin/vc-assessment-logs
```

## 💾 Backup Strategy

### Database Backups

#### 1. Automated RDS Backups

RDS automatically creates backups, but you can also create manual snapshots:

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier your-rds-instance \
  --db-snapshot-identifier vc-assessment-manual-$(date +%Y%m%d-%H%M%S)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier your-rds-instance
```

#### 2. Custom Database Backup Script

```bash
# Create backup script
sudo tee /usr/local/bin/backup-database > /dev/null <<'EOF'
#!/bin/bash

# Configuration
DB_HOST="${DB_HOST}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"
BACKUP_DIR="/var/backups/vc-assessment"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename
BACKUP_FILE="$BACKUP_DIR/vc-assessment-$(date +%Y%m%d-%H%M%S).sql"

# Create backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --no-password \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /usr/local/bin/backup-database
```

#### 3. Schedule Database Backups

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-database >> /var/log/vc-assessment/backup.log 2>&1") | crontab -
```

### Application Backups

#### 1. Code and Configuration Backup

```bash
# Create application backup script
sudo tee /usr/local/bin/backup-application > /dev/null <<'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/vc-assessment"
APP_DIR="/var/www/vc-assessment"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules and build files)
tar -czf "$BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S).tar.gz" \
  --exclude="node_modules" \
  --exclude="build" \
  --exclude="dist" \
  --exclude=".git" \
  -C /var/www vc-assessment

# Backup configuration files
tar -czf "$BACKUP_DIR/config-$(date +%Y%m%d-%H%M%S).tar.gz" \
  /etc/nginx/sites-available/vc-assessment \
  /var/www/vc-assessment/deployment/ecosystem.config.js \
  /var/www/vc-assessment/backend/.env

# Remove old backups
find $BACKUP_DIR -name "app-*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Application backup completed"
EOF

chmod +x /usr/local/bin/backup-application
```

#### 2. Schedule Application Backups

```bash
# Add to crontab (weekly backup)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-application >> /var/log/vc-assessment/backup.log 2>&1") | crontab -
```

### S3 Backup Integration

#### 1. Install AWS CLI

```bash
sudo apt install -y awscli
aws configure  # Configure with your AWS credentials
```

#### 2. S3 Backup Script

```bash
# Create S3 backup script
sudo tee /usr/local/bin/backup-to-s3 > /dev/null <<'EOF'
#!/bin/bash

S3_BUCKET="your-backup-bucket"
LOCAL_BACKUP_DIR="/var/backups/vc-assessment"

# Sync backups to S3
aws s3 sync $LOCAL_BACKUP_DIR s3://$S3_BUCKET/vc-assessment-backups/ \
  --delete \
  --storage-class STANDARD_IA

echo "S3 backup sync completed"
EOF

chmod +x /usr/local/bin/backup-to-s3
```

#### 3. Schedule S3 Sync

```bash
# Add to crontab (daily S3 sync)
(crontab -l 2>/dev/null; echo "0 4 * * * /usr/local/bin/backup-to-s3 >> /var/log/vc-assessment/backup.log 2>&1") | crontab -
```

## 🚨 Alerting Configuration

### Email Alerts

#### 1. Configure Postfix for Email Alerts

```bash
# Install postfix
sudo apt install -y postfix mailutils

# Configure postfix for relay (if using external SMTP)
sudo tee -a /etc/postfix/main.cf > /dev/null <<EOF
relayhost = [smtp.gmail.com]:587
smtp_use_tls = yes
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
EOF

# Create SASL password file
sudo tee /etc/postfix/sasl_passwd > /dev/null <<EOF
[smtp.gmail.com]:587 your-email@gmail.com:your-app-password
EOF

sudo postmap /etc/postfix/sasl_passwd
sudo chmod 600 /etc/postfix/sasl_passwd*
sudo systemctl restart postfix
```

#### 2. Alert Scripts

```bash
# Create alert script
sudo tee /usr/local/bin/send-alert > /dev/null <<'EOF'
#!/bin/bash

ALERT_TYPE="$1"
MESSAGE="$2"
EMAIL="admin@yourdomain.com"

SUBJECT="[VC Assessment] $ALERT_TYPE Alert"
BODY="Alert: $ALERT_TYPE
Time: $(date)
Server: $(hostname)
Message: $MESSAGE

Please check the system immediately."

echo "$BODY" | mail -s "$SUBJECT" "$EMAIL"
EOF

chmod +x /usr/local/bin/send-alert
```

### System Health Monitoring

#### 1. Health Check Script

```bash
# Create comprehensive health check
sudo tee /usr/local/bin/health-check > /dev/null <<'EOF'
#!/bin/bash

ALERT_SCRIPT="/usr/local/bin/send-alert"

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    $ALERT_SCRIPT "DISK SPACE" "Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 85 ]; then
    $ALERT_SCRIPT "MEMORY" "Memory usage is ${MEMORY_USAGE}%"
fi

# Check if application is running
if ! pm2 list | grep -q "vc-assessment-backend.*online"; then
    $ALERT_SCRIPT "APPLICATION" "VC Assessment backend is not running"
fi

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    $ALERT_SCRIPT "NGINX" "Nginx service is not running"
fi

# Check database connectivity
if ! curl -f http://localhost:5000/health > /dev/null 2>&1; then
    $ALERT_SCRIPT "HEALTH CHECK" "Application health check failed"
fi
EOF

chmod +x /usr/local/bin/health-check
```

#### 2. Schedule Health Checks

```bash
# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check") | crontab -
```

## 📈 Performance Optimization

### Database Performance

#### 1. Connection Pooling

Already configured in `database-postgres.ts` with:

- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

#### 2. Query Optimization

Monitor slow queries:

```sql
-- Enable slow query logging in PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
SELECT pg_reload_conf();
```

### Application Performance

#### 1. PM2 Cluster Mode (for larger instances)

For instances larger than t3.micro:

```javascript
// Update ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "vc-assessment-backend",
      script: "dist/index.js",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      // ... other config
    },
  ],
};
```

#### 2. Nginx Optimization

Add to nginx configuration:

```nginx
# Add to server block
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}

# Enable gzip compression
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json
    image/svg+xml;
```

## 🔍 Troubleshooting Tools

### Log Analysis Commands

```bash
# Real-time application logs
tail -f /var/log/vc-assessment/combined.log

# Search for errors in the last hour
grep -i error /var/log/vc-assessment/combined.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')"

# Analyze nginx access patterns
awk '{print $1}' /var/log/nginx/vc-assessment.access.log | sort | uniq -c | sort -nr | head -10

# Check response times
awk '{print $NF}' /var/log/nginx/vc-assessment.access.log | sort -n | tail -10
```

### Performance Monitoring

```bash
# System resource usage
htop

# Network connections
netstat -tulpn | grep :5000

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# PM2 process monitoring
pm2 monit
```

This comprehensive monitoring and backup setup ensures your VC Assessment Tool runs reliably with proper observability and data protection.
