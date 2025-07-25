# Flight Price Monitoring Web Service

A comprehensive Node.js web application that monitors flight prices by calling the Naver Flights API and storing results in Supabase. Features both API endpoints for automated monitoring and a beautiful dashboard for data visualization.

![Flight Monitoring Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## 🌟 Features

### ✈️ Flight Monitoring
- **Random Flight Search**: Automatically generates and searches random flight routes
- **Custom Flight Search**: Manual flight search with specific parameters
- **Dynamic Route Configuration**: Supports 50+ airports across Asia, Americas, Europe, and Pacific
- **Smart Date Generation**: Random dates between 15 days from today and end of current year
- **Round Trip & One-Way Support**: Flexible trip type configuration

### 📊 Dashboard & Analytics
- **Real-time Dashboard**: Beautiful web interface with live data updates
- **Performance Metrics**: Success rates, response times, and route statistics
- **Data Filtering**: Filter by status, trip type, route type, and date ranges
- **System Health Monitoring**: Database connectivity and API status checks
- **Interactive Controls**: Trigger searches and view results in real-time

### 🔧 Technical Features
- **RESTful API**: Complete API endpoints for external integration
- **Supabase Integration**: Robust database operations with error handling
- **Environment Configuration**: Secure configuration management
- **Error Handling**: Comprehensive error logging and recovery
- **CORS Support**: Configurable cross-origin resource sharing
- **Security**: Helmet.js security headers and input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Supabase account and project
- Supabase API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd naver-flight-monitoring
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   SUPABASE_KEY=your_supabase_anon_key_here
   PORT=3000
   NODE_ENV=development
   FLIGHT_API_BASE_URL=https://naverflights.myrealtrip.com
   LOG_LEVEL=info
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Dashboard: http://localhost:3000
   - API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/data/health

## 📊 Database Schema

The application uses the existing Supabase table `naver_flight_monitoring`:

```sql
CREATE TABLE naver_flight_monitoring (
    id NUMERIC PRIMARY KEY,
    start_at TIMESTAMP WITHOUT TIME ZONE,
    end_at TIMESTAMP WITHOUT TIME ZONE,
    elapsed_seconds BIGINT,
    departure_airport TEXT,
    arrival_airport TEXT,
    departure_date DATE,
    return_date DATE,
    is_round_trip BOOLEAN,
    is_long_haul_route BOOLEAN,
    http_status INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠 API Documentation

### Flight Monitoring Endpoints

#### POST `/api/flights/monitor/random`
Performs a random flight search and stores results.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "searchParams": {
      "departureAirport": "ICN",
      "arrivalAirport": "NRT",
      "departureDate": "2024-03-15",
      "returnDate": "2024-03-18",
      "isRoundTrip": true,
      "isLongHaul": false
    },
    "flightInfo": {
      "route": "Seoul (ICN) → Tokyo (NRT)",
      "tripType": "Round Trip"
    },
    "result": {
      "success": true,
      "httpStatus": 200,
      "elapsedSeconds": 3
    }
  }
}
```

#### POST `/api/flights/monitor/custom`
Performs a custom flight search with specified parameters.

**Request Body:**
```json
{
  "departureAirport": "ICN",
  "arrivalAirport": "LAX",
  "departureDate": "2024-04-01",
  "returnDate": "2024-04-10",
  "isRoundTrip": true
}
```

#### GET `/api/flights/airports`
Returns available airports information.

### Data Retrieval Endpoints

#### GET `/api/data/recent?limit=50`
Get recent flight monitoring records.

#### GET `/api/data/stats?days=7`
Get flight monitoring statistics for the last N days.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "successful": 142,
    "failed": 8,
    "successRate": 94.7,
    "avgElapsedSeconds": 4.2,
    "topRoutes": [
      {
        "route": "ICN-NRT",
        "count": 25,
        "successRate": "96.0"
      }
    ]
  }
}
```

#### GET `/api/data/records`
Get flight records with optional filters.

**Query Parameters:**
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `departureAirport`: Filter by departure airport code
- `arrivalAirport`: Filter by arrival airport code
- `isRoundTrip`: Filter by trip type (true/false)
- `isLongHaul`: Filter by route type (true/false)
- `successful`: Filter by success status (true/false)
- `limit`: Limit number of results

#### GET `/api/data/health`
Health check endpoint for monitoring system status.

## 🌍 Supported Routes

### Seoul Departure Airports
- **ICN**: Incheon International Airport

### Destination Regions

#### Asia (Short & Medium Haul)
- Tokyo (NRT, HND), Osaka (KIX), Fukuoka (FUK), Sapporo (CTS)
- Da Nang (DAD), Bangkok (BKK), Cebu (CEB), Singapore (SIN)
- Hong Kong (HKG), Taipei (TPE), Chiang Mai (CNX), Hanoi (HAN)

#### Americas (Long Haul)
- Los Angeles (LAX), New York (JFK), San Francisco (SFO), Las Vegas (LAS)

#### Europe (Long Haul)
- Paris (CDG), London (LHR), Rome (FCO), Barcelona (BCN), Frankfurt (FRA)

#### Pacific
- Guam (GUM), Saipan (SPN)

## 🖥 Dashboard Features

### Real-time Monitoring
- **Live Statistics**: Total searches, success rate, average response time
- **System Health**: Database connectivity and API status
- **Top Routes**: Most popular flight routes with success rates

### Interactive Controls
- **Random Search**: Trigger a random flight search with one click
- **Custom Search**: Manual flight search with date/route selection
- **Data Refresh**: Update dashboard data in real-time

### Data Analysis
- **Filtering**: Filter records by status, trip type, route type
- **Performance Metrics**: Detailed analysis of API performance
- **Historical Data**: View trends and patterns over time

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_KEY` | Supabase anonymous key | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `FLIGHT_API_BASE_URL` | Naver Flights API base URL | https://naverflights.myrealtrip.com |
| `LOG_LEVEL` | Logging level | info |

### Security Configuration

The application includes:
- **Helmet.js**: Security headers and CSP policies
- **CORS**: Configurable origin restrictions
- **Input Validation**: Parameter validation and sanitization
- **Error Handling**: Secure error messages in production

## 🔄 External Integration

### GitHub Actions Integration
The API endpoints are designed to be called by external schedulers like GitHub Actions:

```yaml
# Example GitHub Actions workflow
name: Flight Monitoring
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Flight Monitoring
        run: |
          curl -X POST ${{ secrets.MONITORING_URL }}/api/flights/monitor/random \
               -H "Content-Type: application/json"
```

### Webhook Support
All monitoring endpoints return detailed results suitable for webhook integration and external processing.

## 📈 Performance & Monitoring

### Response Time Tracking
- Automatic measurement of API call durations
- Storage of elapsed time for performance analysis
- Dashboard visualization of response times

### Error Handling
- Comprehensive error logging with context
- Graceful degradation for API failures
- Detailed error reporting in dashboard

### Health Monitoring
- Database connectivity checks
- API endpoint health validation
- System status reporting

## 🚀 Deployment

### Production Deployment

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export SUPABASE_KEY=your_production_key
   export PORT=3000
   ```

2. **Install dependencies**
   ```bash
   npm ci --only=production
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Management
For production environments, consider using PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name "flight-monitoring"
pm2 startup
pm2 save
```

## 🧪 Testing

### API Testing
Test the API endpoints using curl or your preferred HTTP client:

```bash
# Health check
curl http://localhost:3000/api/data/health

# Trigger random monitoring
curl -X POST http://localhost:3000/api/flights/monitor/random \
     -H "Content-Type: application/json"

# Get recent records
curl http://localhost:3000/api/data/recent?limit=10
```

### Load Testing
For performance testing, monitor the dashboard while running load tests against the API endpoints.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the dashboard health endpoint for system status
- Review the server logs for error details

---

**Built with ❤️ for reliable flight price monitoring** 