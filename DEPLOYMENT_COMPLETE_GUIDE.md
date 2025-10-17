# 🚀 Complete Deployment Guide for Naxtap Marketplace

## 📋 Prerequisites

- Ubuntu server with root access
- Domain `naxtap.az` configured with DNS pointing to your server
- SSH access to server: `ssh -i "%USERPROFILE%\.ssh\hassan" root@31.97.113.219`

## 🔧 Step 1: Server Setup

### 1.1 Connect to your server
```bash
ssh -i "%USERPROFILE%\.ssh\hassan" root@31.97.113.219
```

### 1.2 Run the server setup script
```bash
# Download and run the setup script
curl -o server-setup.sh https://raw.githubusercontent.com/your-repo/naxtap/main/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

This script will:
- ✅ Update system packages
- ✅ Install Node.js 18.x, npm, yarn
- ✅ Install PM2, Nginx, Certbot
- ✅ Install PostgreSQL and Redis
- ✅ Configure firewall
- ✅ Create application directories
- ✅ Setup log rotation

## 📦 Step 2: Code Deployment

### 2.1 Clone your repository
```bash
cd /var/www/naxtap
git clone https://github.com/your-username/naxtap.git .
```

### 2.2 Install dependencies
```bash
npm install
```

### 2.3 Configure environment variables
```bash
# Copy the environment template
cp env.example .env

# Edit the environment file
nano .env
```

**Required environment variables:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Frontend URL
FRONTEND_URL=https://naxtap.az
EXPO_PUBLIC_FRONTEND_URL=https://naxtap.az

# Database Configuration
DATABASE_URL=postgresql://naxtap_user:naxtap_password@localhost:5432/naxtap_db

# JWT Configuration (Generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Payriff Payment Gateway (Add your credentials)
PAYRIFF_MERCHANT_ID=your-payriff-merchant-id
PAYRIFF_SECRET_KEY=your-payriff-secret-key
PAYRIFF_BASE_URL=https://api.payriff.com

# Rate Limiting
API_RATE_LIMIT=100

# Redis
REDIS_URL=redis://localhost:6379
```

### 2.4 Build the application
```bash
# Build the web application
npm run build:web

# Type check (optional)
npm run typecheck
```

## 🌐 Step 3: Web Server Configuration

### 3.1 Run the deployment script
```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- ✅ Configure Nginx with SSL
- ✅ Setup Let's Encrypt certificates
- ✅ Configure reverse proxy
- ✅ Start the application with PM2
- ✅ Setup auto-renewal

### 3.2 Manual Nginx configuration (if needed)
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/naxtap.az
```

**Nginx configuration content:**
```nginx
server {
    listen 80;
    server_name naxtap.az www.naxtap.az;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name naxtap.az www.naxtap.az;
    
    ssl_certificate /etc/letsencrypt/live/naxtap.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naxtap.az/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.3 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/naxtap.az /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Step 4: SSL Certificate Setup

### 4.1 Get SSL certificate
```bash
sudo certbot --nginx -d naxtap.az -d www.naxtap.az
```

### 4.2 Setup auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Step 5: Start the Application

### 5.1 Start with PM2
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5.2 Check application status
```bash
pm2 status
pm2 logs
```

## 📊 Step 6: Monitoring and Maintenance

### 6.1 Useful commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart all

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Check disk space
df -h

# Check memory usage
free -h

# Monitor processes
htop
```

### 6.2 Log locations
- Application logs: `/var/www/naxtap/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## 🔧 Step 7: Database Setup (Optional)

### 7.1 Connect to PostgreSQL
```bash
sudo -u postgres psql
```

### 7.2 Create database tables (if needed)
```sql
\c naxtap_db;

-- Example tables (adjust based on your needs)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Troubleshooting

### Common issues and solutions:

#### 1. Application won't start
```bash
# Check logs
pm2 logs

# Check if ports are in use
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :3001

# Restart application
pm2 restart all
```

#### 2. SSL certificate issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL
openssl s_client -connect naxtap.az:443
```

#### 3. Nginx configuration issues
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

#### 4. Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U naxtap_user -d naxtap_db
```

## 📈 Performance Optimization

### 1. Enable Gzip compression
Already configured in Nginx

### 2. Setup caching
```bash
# Redis is already installed and running
# Use it for session storage and caching
```

### 3. Monitor resources
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor with PM2
pm2 monit
```

## 🔄 Updates and Maintenance

### 1. Update application code
```bash
cd /var/www/naxtap
git pull origin main
npm install
npm run build:web
pm2 restart all
```

### 2. Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Backup database
```bash
# Create backup
pg_dump -h localhost -U naxtap_user naxtap_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U naxtap_user naxtap_db < backup_20240101.sql
```

## 📞 Support

If you encounter any issues:

1. Check the logs first
2. Verify all services are running
3. Check firewall settings
4. Verify DNS configuration
5. Check SSL certificate status

## 🎉 Deployment Complete!

Your Naxtap marketplace should now be live at: **https://naxtap.az**

### Quick verification checklist:
- [ ] Website loads at https://naxtap.az
- [ ] SSL certificate is valid
- [ ] API endpoints respond at https://naxtap.az/api/
- [ ] PM2 processes are running
- [ ] Nginx is serving the site
- [ ] Database is accessible

### Next steps:
1. Configure your Payriff payment credentials
2. Set up email notifications
3. Configure social login
4. Add your actual API keys
5. Test all functionality

**Congratulations! Your Naxtap marketplace is now live! 🚀**
