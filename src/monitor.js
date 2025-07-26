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