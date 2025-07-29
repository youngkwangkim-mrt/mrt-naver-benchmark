#!/bin/bash

# Naver Flight Monitoring Project Redeployment Script
# This script handles redeployment and fixes common issues

set -e

APP_DIR="/opt/naver-flight-monitoring"
SERVICE_NAME="naver-flight-monitoring"
MONITOR_NAME="naver-flight-monitor"

echo "🔄 Starting redeployment of Naver Flight Monitoring Project..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Stop existing processes
echo "🛑 Stopping existing processes..."
pm2 stop $SERVICE_NAME 2>/dev/null || true
pm2 stop $MONITOR_NAME 2>/dev/null || true
pm2 delete $SERVICE_NAME 2>/dev/null || true
pm2 delete $MONITOR_NAME 2>/dev/null || true

# Stop systemd service if exists (old method)
echo "🛑 Stopping old systemd service..."
sudo systemctl stop naver-flight-monitor.service 2>/dev/null || true
sudo systemctl disable naver-flight-monitor.service 2>/dev/null || true

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory not found: $APP_DIR"
    echo "   Please run the initial deployment first: ./deploy.sh"
    exit 1
fi

cd "$APP_DIR"

# Backup current .env if exists
if [ -f ".env" ]; then
    echo "💾 Backing up current .env file..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update from git if it's a git repository
if [ -d ".git" ]; then
    echo "📥 Updating from git repository..."
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "⚠️  Git pull failed, continuing with local files"
else
    echo "⚠️  Not a git repository, skipping git update"
fi

# Install/update dependencies
echo "📦 Installing/updating Node.js dependencies..."
npm install --production

# Ensure .env file exists
if [ ! -f ".env" ]; then
    echo "🔧 Creating .env file from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "⚠️  Please edit .env file with your production settings"
        echo "   nano $APP_DIR/.env"
    else
        echo "❌ No env.example found, creating basic .env..."
        cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_KEY=your_supabase_key_here

# Server Configuration
PORT=3000
NODE_ENV=production

# Flight API Configuration
FLIGHT_API_BASE_URL=https://naverflights.myrealtrip.com

# Logging
LOG_LEVEL=info
EOF
        echo "⚠️  Please edit .env file with your actual SUPABASE_KEY"
        echo "   nano $APP_DIR/.env"
    fi
fi

# Create/update PM2 ecosystem file
echo "⚙️  Creating/updating PM2 ecosystem file..."
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

# Test if monitor.js exists
if [ ! -f "src/monitor.js" ]; then
    echo "❌ src/monitor.js not found. Creating it..."
    cat > src/monitor.js << 'EOF'
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const INTERVAL = parseInt(process.env.MONITOR_INTERVAL) || 10000; // 10 seconds

console.log('🚀 Starting Naver Flight Monitoring Service...');
console.log(`📡 Target URL: ${BASE_URL}/api/flights/monitor/random`);
console.log(`⏱️  Interval: ${INTERVAL / 1000} seconds`);
console.log('');

let counter = 0;

async function callRandomMonitor() {
    counter++;
    const startTime = new Date();
    
    try {
        console.log(`[${counter}] ${startTime.toISOString()}: Calling /api/flights/monitor/random...`);
        
        const response = await axios.post(`${BASE_URL}/api/flights/monitor/random`, {}, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });
        
        const endTime = new Date();
        const elapsedMs = endTime.getTime() - startTime.getTime();
        
        if (response.status === 200) {
            console.log(`✅ Success - Status: ${response.status}, Time: ${(elapsedMs / 1000).toFixed(2)}s`);
            
            // Extract useful info from response
            if (response.data && response.data.success) {
                const data = response.data.data;
                if (data.flightInfo && data.flightInfo.route) {
                    console.log(`   🛫 Route: ${data.flightInfo.route}`);
                }
                if (data.result && data.result.elapsedSeconds) {
                    console.log(`   ⏱️  API Elapsed: ${data.result.elapsedSeconds}s`);
                }
                if (data.id) {
                    console.log(`   🆔 Record ID: ${data.id}`);
                }
            }
        } else {
            console.log(`❌ Unexpected Status: ${response.status}`);
        }
        
    } catch (error) {
        const endTime = new Date();
        const elapsedMs = endTime.getTime() - startTime.getTime();
        
        if (error.response) {
            console.log(`❌ Failed - Status: ${error.response.status}, Time: ${(elapsedMs / 1000).toFixed(2)}s`);
            console.log(`   Error: ${error.response.data?.error || error.message}`);
        } else if (error.code === 'ECONNABORTED') {
            console.log(`⏰ Timeout - Request took longer than 30s`);
        } else {
            console.log(`❌ Network Error - Time: ${(elapsedMs / 1000).toFixed(2)}s`);
            console.log(`   Error: ${error.message}`);
        }
    }
    
    console.log('----------------------------------------');
}

// Start monitoring loop
async function startMonitoring() {
    while (true) {
        await callRandomMonitor();
        
        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the monitoring service
startMonitoring().catch(error => {
    console.error('❌ Monitoring service failed:', error);
    process.exit(1);
});
EOF
fi

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Test if server is running
echo "🔍 Testing server connection..."
sleep 5

if curl -s http://localhost:3000/api/data/health > /dev/null; then
    echo "✅ Server is running successfully"
else
    echo "⚠️  Server might not be running yet, checking logs..."
    pm2 logs $SERVICE_NAME --lines 10
fi

echo ""
echo "✅ Redeployment completed successfully!"
echo ""
echo "📋 Current status:"
pm2 status
echo ""
echo "🔧 Next steps:"
echo "   1. Check if .env file has correct settings:"
echo "      nano $APP_DIR/.env"
echo ""
echo "   2. View server logs:"
echo "      pm2 logs $SERVICE_NAME"
echo ""
echo "   3. View monitor logs:"
echo "      pm2 logs $MONITOR_NAME"
echo ""
echo "   4. Restart if needed:"
echo "      pm2 restart all"
echo ""
echo "🛠️  Useful commands:"
echo "   - View all logs: pm2 logs"
echo "   - Restart all: pm2 restart all"
echo "   - Stop all: pm2 stop all"
echo "   - Start all: pm2 start all"
echo "   - Monitor status: pm2 monit" 