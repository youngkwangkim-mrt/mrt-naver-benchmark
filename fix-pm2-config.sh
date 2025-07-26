#!/bin/bash

# Fix PM2 configuration for ES modules compatibility
# This script fixes the ecosystem.config.js to ecosystem.config.cjs issue

set -e

APP_DIR="/opt/naver-flight-monitoring"

echo "🔧 Fixing PM2 configuration for ES modules compatibility..."

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory not found: $APP_DIR"
    echo "   Please run the deployment script first: ./deploy.sh"
    exit 1
fi

cd "$APP_DIR"

# Stop PM2 process if running
echo "🛑 Stopping PM2 process..."
pm2 stop naver-flight-monitoring 2>/dev/null || true
pm2 delete naver-flight-monitoring 2>/dev/null || true

# Remove old ecosystem.config.js if exists
if [ -f "ecosystem.config.js" ]; then
    echo "🗑️  Removing old ecosystem.config.js..."
    rm ecosystem.config.js
fi

# Create new ecosystem.config.cjs
echo "⚙️  Creating new ecosystem.config.cjs..."
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

# Create logs directory if not exists
mkdir -p logs

# Start application with new configuration
echo "🚀 Starting application with new PM2 configuration..."
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "✅ PM2 configuration fixed successfully!"
echo ""
echo "📋 Current status:"
pm2 status
echo ""
echo "📝 Useful commands:"
echo "   - View logs: pm2 logs naver-flight-monitoring"
echo "   - Restart: pm2 restart naver-flight-monitoring"
echo "   - Stop: pm2 stop naver-flight-monitoring" 