module.exports = {
  apps: [
    {
      name: 'vc-assessment-backend',
      script: 'dist/index.js',
      cwd: '/var/www/vc-assessment/backend',
      instances: 1, // For t3.micro, use 1 instance
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: '/var/log/vc-assessment/combined.log',
      out_file: '/var/log/vc-assessment/out.log',
      error_file: '/var/log/vc-assessment/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false, // Set to true for development
      max_memory_restart: '400M', // Restart if memory usage exceeds 400MB
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Environment variables file
      env_file: '/var/www/vc-assessment/backend/.env.production',
      
      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Cron restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
      
      // Source map support
      source_map_support: true,
      
      // Merge logs from all instances
      merge_logs: true,
      
      // Time zone
      time: true
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-ec2-instance-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/vc-assessment.git',
      path: '/var/www/vc-assessment',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
