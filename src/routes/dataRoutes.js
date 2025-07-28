import express from 'express';
import { getCurrentKSTISOString } from '../utils/timezone.js';
import { 
  getRecentFlightRecords, 
  getFlightMonitoringStats, 
  getFlightRecordsWithFilters,
  getPerformanceMetrics,
  getRecentApiCalls,
  getRoutePerformanceAnalysis
} from '../services/databaseService.js';

const router = express.Router();

/**
 * GET /api/data/recent
 * Get recent flight monitoring records
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const records = await getRecentFlightRecords(limit);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
      timestamp: getCurrentKSTISOString() // KST timestamp for response
    });
  } catch (error) {
    console.error('❌ Failed to fetch recent records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/stats
 * Get flight monitoring statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days) || 7;
    const stats = await getFlightMonitoringStats(daysBack);
    
    res.json({
      success: true,
      data: stats,
      timestamp: getCurrentKSTISOString() // KST timestamp for response
    });
  } catch (error) {
    console.error('❌ Failed to fetch statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/records
 * Get flight records with optional filters
 */
router.get('/records', async (req, res) => {
  try {
    const filters = {};
    
    // Parse query parameters
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.departureAirport) filters.departureAirport = req.query.departureAirport.toUpperCase();
    if (req.query.arrivalAirport) filters.arrivalAirport = req.query.arrivalAirport.toUpperCase();
    if (req.query.isRoundTrip !== undefined) filters.isRoundTrip = req.query.isRoundTrip === 'true';
    if (req.query.isLongHaul !== undefined) filters.isLongHaul = req.query.isLongHaul === 'true';
    if (req.query.successful !== undefined) filters.successful = req.query.successful === 'true';
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    const records = await getFlightRecordsWithFilters(filters);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
      filters
    });
  } catch (error) {
    console.error('❌ Failed to fetch filtered records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/performance-metrics
 * Get performance metrics with percentiles for the last hour
 */
router.get('/performance-metrics', async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Failed to fetch performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const testRecord = await getRecentFlightRecords(1);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

/**
 * GET /api/data/recent-calls
 * Get recent API calls for the recent calls dashboard
 */
router.get('/recent-calls', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Validate limit parameter
    if (![30, 50, 100].includes(limit)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be 30, 50, or 100.'
      });
    }
    
    const records = await getRecentApiCalls(limit);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
      limit: limit,
      timestamp: getCurrentKSTISOString() // KST timestamp for response
    });
  } catch (error) {
    console.error('❌ Failed to fetch recent API calls:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/route-performance-analysis
 * Get route performance analysis comparing Long Haul vs Short Haul routes
 */
router.get('/route-performance-analysis', async (req, res) => {
  try {
    const timePeriod = req.query.period || '24h';
    
    // Validate time period parameter
    if (!['1h', '6h', '24h', '72h', '7d'].includes(timePeriod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time period. Must be one of: 1h, 6h, 24h, 72h, 7d'
      });
    }
    
    const analysisData = await getRoutePerformanceAnalysis(timePeriod);
    
    res.json({
      success: true,
      data: analysisData,
      timestamp: getCurrentKSTISOString() // KST timestamp for response
    });
  } catch (error) {
    console.error('❌ Failed to fetch route performance analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to check data counts
router.get('/test-counts', async (req, res) => {
  try {
    const { supabase } = await import('../config/supabase.js');
    const { getKSTTimeRange } = await import('../utils/timezone.js');
    
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('naver_flight_monitoring')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get 72h count with no limit
    const timeRange = getKSTTimeRange('72h');
    const { count: count72h, error: error72h } = await supabase
      .from('naver_flight_monitoring')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .eq('http_status', 200);
    
    if (error72h) throw error72h;
    
    // Get actual data with range to test
    const { data: actualData, error: dataError } = await supabase
      .from('naver_flight_monitoring')
      .select('*')
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .eq('http_status', 200)
      .order('created_at', { ascending: true })
      .range(0, 50000);
    
    if (dataError) throw dataError;
    
    res.json({
      success: true,
      data: {
        totalRecordsInDB: totalCount,
        recordsIn72h: count72h,
        actualDataFetched: actualData.length,
        timeRange: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('❌ Test counts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 