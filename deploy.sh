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

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

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
  apps: [{
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
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

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash

# Script to call /monitor/random endpoint every 10 seconds
BASE_URL="http://localhost:3000"

while true; do
    echo "$(date): Calling /api/flights/monitor/random..."
    
    # Call the random monitoring endpoint
    response=$(curl -s -X POST "$BASE_URL/api/flights/monitor/random" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s")
    
    # Extract HTTP status and response time
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_time=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Success - Status: $http_status, Time: ${response_time}s"
    else
        echo "❌ Failed - Status: $http_status, Time: ${response_time}s"
        echo "Response: $response"
    fi
    
    echo "----------------------------------------"
    
    # Wait 10 seconds
    sleep 10
done
EOF

chmod +x monitor.sh

# Create systemd service for monitoring
echo "🔧 Creating systemd service for monitoring..."
sudo tee /etc/systemd/system/naver-flight-monitor.service << EOF
[Unit]
Description=Naver Flight Monitoring Scheduler
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start monitoring service
sudo systemctl daemon-reload
sudo systemctl enable naver-flight-monitor.service
sudo systemctl start naver-flight-monitor.service

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Application directory: $APP_DIR"
echo "   - PM2 process: naver-flight-monitoring"
echo "   - Nginx configuration: /etc/nginx/sites-available/naver-flight-monitoring"
echo "   - Monitoring service: naver-flight-monitor.service"
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
echo "   4. Check monitoring service:"
echo "      sudo systemctl status naver-flight-monitor.service"
echo "      sudo journalctl -u naver-flight-monitor.service -f"
echo ""
echo "   5. Access the application:"
echo "      - Dashboard: http://your-server-ip"
echo "      - API: http://your-server-ip/api"
echo "      - Health check: http://your-server-ip/api/data/health"
echo ""
echo "🛠️  Useful commands:"
echo "   - View logs: pm2 logs naver-flight-monitoring"
echo "   - Restart app: pm2 restart naver-flight-monitoring"
echo "   - Stop app: pm2 stop naver-flight-monitoring"
echo "   - Monitor service logs: sudo journalctl -u naver-flight-monitor.service -f"
echo "   - Stop monitoring: sudo systemctl stop naver-flight-monitor.service" 