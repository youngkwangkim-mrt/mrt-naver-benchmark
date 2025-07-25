import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration and services
import { testConnection } from './config/supabase.js';

// Import routes
import flightRoutes from './routes/flightRoutes.js';
import dataRoutes from './routes/dataRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve static files for dashboard
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/data', dataRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Naver Flight Monitoring API',
    version: '1.0.0',
    description: 'Flight Price Monitoring Web Service using Naver Flights API and Supabase',
    endpoints: {
      flights: {
        'POST /api/flights/monitor/random': 'Perform random flight search and store results',
        'POST /api/flights/monitor/custom': 'Perform custom flight search with specified parameters',
        'GET /api/flights/airports': 'Get available airports information'
      },
      data: {
        'GET /api/data/recent': 'Get recent flight monitoring records',
        'GET /api/data/stats': 'Get flight monitoring statistics',
        'GET /api/data/records': 'Get flight records with filters',
        'GET /api/data/performance-metrics': 'Get performance metrics with percentiles',
        'GET /api/data/recent-calls': 'Get recent API calls for dashboard (limit: 30, 50, 100)',
        'GET /api/data/route-performance-analysis': 'Get route performance analysis (period: 1h, 6h, 24h, 7d)',
        'GET /api/data/health': 'Health check endpoint'
      }
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Dashboard routes
app.get('/performance-analysis', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/performance-analysis.html'));
});

app.get('/route-performance', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/performance-analysis.html'));
});

// Default dashboard route (serve index.html for all non-API routes)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
  
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

// Server startup
async function startServer() {
  try {
    console.log('🚀 Starting Naver Flight Monitoring Server...');
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your SUPABASE_KEY environment variable.');
      process.exit(1);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📋 Recent API Calls Dashboard: http://localhost:${PORT}`);
      console.log(`📊 Route Performance Analysis: http://localhost:${PORT}/performance-analysis`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/data/health`);
      console.log('');
      console.log('Available API endpoints:');
      console.log('  POST /api/flights/monitor/random   - Random flight search');
      console.log('  POST /api/flights/monitor/custom   - Custom flight search');
      console.log('  GET  /api/flights/airports         - Airport information');
      console.log('  GET  /api/data/recent              - Recent records');
      console.log('  GET  /api/data/stats               - Statistics');
      console.log('  GET  /api/data/records             - Filtered records');
      console.log('  GET  /api/data/performance-metrics - Performance charts');
      console.log('  GET  /api/data/recent-calls        - Recent API calls dashboard data');
      console.log('  GET  /api/data/route-performance-analysis - Route performance analysis');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
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

// Start the server
startServer(); 