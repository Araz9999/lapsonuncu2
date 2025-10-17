#!/bin/bash

# Naxtap Marketplace Deployment Script
# For Ubuntu Server on Hostinger VPS

set -e

echo "🚀 Starting Naxtap Marketplace Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
print_status "Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_warning "Node.js already installed: $NODE_VERSION"
fi

# Install PM2 globally
print_status "Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_warning "PM2 already installed"
fi

# Install serve globally for static file serving
print_status "Installing serve for static file serving..."
if ! command -v serve &> /dev/null; then
    sudo npm install -g serve
    print_success "Serve installed successfully"
else
    print_warning "Serve already installed"
fi

# Install Nginx
print_status "Installing and configuring Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    print_success "Nginx installed successfully"
else
    print_warning "Nginx already installed"
fi

# Install SSL certificate tools
print_status "Installing Certbot for SSL certificates..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed successfully"
else
    print_warning "Certbot already installed"
fi

# Create application directory
APP_DIR="/var/www/naxtap"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install project dependencies
print_status "Installing project dependencies..."
npm install --legacy-peer-deps

# Build the web application
print_status "Building web application..."
npm run build:web

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/naxtap.az > /dev/null <<EOF
server {
    listen 80;
    server_name naxtap.az www.naxtap.az;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name naxtap.az www.naxtap.az;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/naxtap.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naxtap.az/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://naxtap.az" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://naxtap.az";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3001;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/naxtap.az /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
print_status "Starting Nginx..."
sudo systemctl restart nginx

# Setup SSL certificate
print_status "Setting up SSL certificate with Let's Encrypt..."
if [ ! -d "/etc/letsencrypt/live/naxtap.az" ]; then
    sudo certbot --nginx -d naxtap.az -d www.naxtap.az --non-interactive --agree-tos --email admin@naxtap.az
    print_success "SSL certificate installed successfully"
else
    print_warning "SSL certificate already exists"
fi

# Setup auto-renewal for SSL
print_status "Setting up SSL auto-renewal..."
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

print_success "Deployment completed successfully!"
print_status "Your application should now be available at: https://naxtap.az"

# Display useful commands
echo ""
echo "🔧 Useful commands:"
echo "  pm2 status                    - Check application status"
echo "  pm2 logs                      - View application logs"
echo "  pm2 restart naxtap-api        - Restart API server"
echo "  pm2 restart naxtap-web        - Restart web server"
echo "  sudo systemctl status nginx   - Check Nginx status"
echo "  sudo nginx -t                 - Test Nginx configuration"
echo "  sudo systemctl restart nginx  - Restart Nginx"
echo ""
echo "📁 Important directories:"
echo "  Application: $APP_DIR"
echo "  Logs: $APP_DIR/logs"
echo "  Nginx config: /etc/nginx/sites-available/naxtap.az"
echo ""
echo "🔒 SSL Certificate:"
echo "  Auto-renewal is configured"
echo "  Certificate location: /etc/letsencrypt/live/naxtap.az/"
echo ""
echo "🎉 Deployment completed! Your Naxtap marketplace is now live!"

