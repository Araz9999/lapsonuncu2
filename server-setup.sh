#!/bin/bash

# Naxtap Marketplace Server Setup Script
# Run this script first on your Ubuntu server before deployment

set -e

echo "🔧 Setting up Ubuntu server for Naxtap Marketplace..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18.x
print_status "Installing Node.js 18.x (LTS)..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install npm and yarn
print_status "Installing npm and yarn..."
sudo npm install -g npm@latest yarn

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install serve for static files
print_status "Installing serve for static file serving..."
sudo npm install -g serve

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx

# Install Redis (optional, for caching)
print_status "Installing Redis..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PostgreSQL (optional, for database)
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Configure PostgreSQL
print_status "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER naxtap_user WITH PASSWORD 'naxtap_password';"
sudo -u postgres psql -c "CREATE DATABASE naxtap_db OWNER naxtap_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE naxtap_db TO naxtap_user;"

# Configure firewall
print_status "Configuring UFW firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw --force enable

# Create application user (optional)
print_status "Creating application user..."
if ! id "naxtap" &>/dev/null; then
    sudo useradd -m -s /bin/bash naxtap
    sudo usermod -aG sudo naxtap
    print_success "Created naxtap user"
else
    print_warning "User naxtap already exists"
fi

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/naxtap
sudo chown $USER:$USER /var/www/naxtap

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/naxtap > /dev/null <<EOF
/var/www/naxtap/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Setup monitoring with htop (optional)
print_status "Installing system monitoring tools..."
sudo apt install -y htop iotop nethogs

# Create environment file template
print_status "Creating environment file template..."
cat > /var/www/naxtap/.env <<EOF
# Production Environment Variables for Naxtap Marketplace

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Frontend URL
FRONTEND_URL=https://naxtap.az
EXPO_PUBLIC_FRONTEND_URL=https://naxtap.az

# Database Configuration
DATABASE_URL=postgresql://naxtap_user:naxtap_password@localhost:5432/naxtap_db

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Payriff Payment Gateway (ADD YOUR CREDENTIALS)
PAYRIFF_MERCHANT_ID=
PAYRIFF_SECRET_KEY=
PAYRIFF_BASE_URL=https://api.payriff.com

# Rate Limiting
API_RATE_LIMIT=100

# Redis
REDIS_URL=redis://localhost:6379
EOF

print_success "Server setup completed successfully!"

echo ""
echo "📋 Next steps:"
echo "1. Clone your repository to /var/www/naxtap"
echo "2. Copy the .env file to your project root"
echo "3. Update the .env file with your actual credentials"
echo "4. Run the deployment script: ./deploy.sh"
echo ""
echo "🔑 Important credentials created:"
echo "  PostgreSQL user: naxtap_user"
echo "  PostgreSQL password: naxtap_password"
echo "  Database: naxtap_db"
echo "  JWT Secret: Generated automatically"
echo ""
echo "🌐 Your server is now ready for deployment!"
