#!/bin/bash

# Local testing script for monitoring functionality
# Usage: ./test-monitoring.sh [interval_seconds]

# Default interval is 10 seconds
INTERVAL=${1:-10}
BASE_URL="http://localhost:3000"

echo "🧪 Starting monitoring test..."
echo "📡 Target URL: $BASE_URL/api/flights/monitor/random"
echo "⏱️  Interval: $INTERVAL seconds"
echo "🛑 Press Ctrl+C to stop"
echo ""

# Check if server is running
if ! curl -s "$BASE_URL/api/data/health" > /dev/null; then
    echo "❌ Server is not running at $BASE_URL"
    echo "   Please start the server first: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

counter=1

while true; do
    echo "[$counter] $(date): Calling /api/flights/monitor/random..."
    
    # Call the random monitoring endpoint
    response=$(curl -s -X POST "$BASE_URL/api/flights/monitor/random" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s")
    
    # Extract HTTP status and response time
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_time=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Success - Status: $http_status, Time: ${response_time}s"
        
        # Extract and display some useful info from response
        if echo "$response" | grep -q '"success":true'; then
            # Extract route info if available
            route_info=$(echo "$response" | grep -o '"route":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$route_info" ]; then
                echo "   🛫 Route: $route_info"
            fi
            
            # Extract elapsed time if available
            elapsed=$(echo "$response" | grep -o '"elapsedSeconds":[0-9.]*' | cut -d':' -f2)
            if [ -n "$elapsed" ]; then
                echo "   ⏱️  API Elapsed: ${elapsed}s"
            fi
        fi
    else
        echo "❌ Failed - Status: $http_status, Time: ${response_time}s"
        echo "   Response: $response"
    fi
    
    echo "----------------------------------------"
    
    # Wait for next interval
    sleep $INTERVAL
    counter=$((counter + 1))
done 