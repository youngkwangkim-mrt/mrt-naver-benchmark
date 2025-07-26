#!/bin/bash

# Naver Flight Monitoring Project Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment of Naver Flight Monitoring Project..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Update package list only (no upgrade to save time)
# Set UPDATE_PACKAGES=true to enable package updates
if [ "${UPDATE_PACKAGES:-false}" = "true" ]; then
    echo "📦 Updating system packages..."
    sudo apt update && sudo apt upgrade -y
else
    echo "📦 Updating package list only..."
    sudo apt update
fi

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    sudo apt install -y nginx
fi

# Create application directory
APP_DIR="/opt/naver-flight-monitoring"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy project files
echo "📋 Copying project files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install --production

# Create environment file if not exists
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your production settings"
    echo "   - Set SUPABASE_KEY"
    echo "   - Set NODE_ENV=production"
    echo "   - Set PORT=3000"
fi

# Create PM2 ecosystem file
echo "⚙️  Creating PM2 ecosystem file..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'naver-flight-monitoring',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/server-err.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true
    },
    {
      name: 'naver-flight-monitor',
      script: 'src/monitor.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BASE_URL: 'http://localhost:3000',
        MONITOR_INTERVAL: '10000'
      },
      error_file: './logs/monitor-err.log',
      out_file: './logs/monitor-out.log',
      log_file: './logs/monitor-combined.log',
      time: true
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Create nginx configuration
echo "🌐 Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/naver-flight-monitoring << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/naver-flight-monitoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Note: Monitoring is now handled by PM2 process 'naver-flight-monitor'
echo "📊 Monitoring will be handled by PM2 process 'naver-flight-monitor'"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Application directory: $APP_DIR"
echo "   - PM2 processes: naver-flight-monitoring (server), naver-flight-monitor (monitoring)"
echo "   - Nginx configuration: /etc/nginx/sites-available/naver-flight-monitoring"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit .env file with your production settings:"
echo "      nano $APP_DIR/.env"
echo ""
echo "   2. Restart the application:"
echo "      pm2 restart naver-flight-monitoring"
echo ""
echo "   3. Check application status:"
echo "      pm2 status"
echo "      pm2 logs naver-flight-monitoring"
echo ""
echo "   4. Check monitoring process:"
echo "      pm2 logs naver-flight-monitor"
echo "      pm2 status"
echo ""
echo "   5. Access the application:"
echo "      - Dashboard: http://your-server-ip"
echo "      - API: http://your-server-ip/api"
echo "      - Health check: http://your-server-ip/api/data/health"
echo ""
echo "🛠️  Useful commands:"
echo "   - View server logs: pm2 logs naver-flight-monitoring"
echo "   - View monitor logs: pm2 logs naver-flight-monitor"
echo "   - Restart all: pm2 restart all"
echo "   - Stop all: pm2 stop all"
echo "   - Start all: pm2 start all" 