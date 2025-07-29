import express from 'express';
import { 
  generateRandomFlightSearch, 
  searchFlights, 
  getFlightSearchInfo 
} from '../services/flightService.js';
import { insertFlightMonitoringRecord } from '../services/databaseService.js';
import { getCurrentKSTISOString } from '../utils/timezone.js';
import { 
  SEOUL_AIRPORTS, 
  DESTINATION_AIRPORTS, 
  LONG_HAUL_DESTINATIONS, 
  AIRPORTS,
  isLongHaulRoute 
} from '../config/airports.js';

const router = express.Router();

/**
 * POST /api/flights/monitor/random
 * Performs a random flight search and stores results
 */
router.post('/monitor/random', async (req, res) => {
  const startTime = new Date();
  const startAt = getCurrentKSTISOString();
  
  try {
    console.log('🚀 Starting random flight monitoring...');
    
    // Generate random search parameters
    const searchParams = generateRandomFlightSearch();
    const flightInfo = getFlightSearchInfo(searchParams);
    
    console.log(`📋 Generated search: ${flightInfo.route} (${flightInfo.tripType})`);
    
    // Perform flight search
    const searchResult = await searchFlights(searchParams);
    const endTime = new Date();
    const endAt = getCurrentKSTISOString();
    
    // Prepare database record
    const dbRecord = {
      startAt: startTime, // Pass Date object to formatForDatabase
      endAt: endTime, // Pass Date object to formatForDatabase
      elapsedSeconds: searchResult.elapsedSeconds,
      departureAirport: searchParams.departureAirport,
      arrivalAirport: searchParams.arrivalAirport,
      departureDate: searchParams.departureDate,
      arrivalDate: searchParams.returnDate,
      isRoundTrip: searchParams.isRoundTrip,
      isLongHaulRoute: searchParams.isLongHaul,
      nonstop: searchParams.nonstop,
      httpStatus: searchResult.httpStatus,
      errorMessage: searchResult.errorMessage,
      rawRequest: searchResult.url // Store the complete request URL
    };
    
    // Store in database
    const savedRecord = await insertFlightMonitoringRecord(dbRecord);
    
    // Return response
    res.json({
      success: true,
      data: {
        id: savedRecord.id,
        searchParams,
        flightInfo,
        result: {
          success: searchResult.success,
          httpStatus: searchResult.httpStatus,
          elapsedSeconds: searchResult.elapsedSeconds,
          errorMessage: searchResult.errorMessage
        },
        timing: {
          startAt,
          endAt,
          elapsedMs: endTime.getTime() - startTime.getTime()
        }
      }
    });
    
  } catch (error) {
    const endTime = new Date();
    const endAt = getCurrentKSTISOString();
    console.error('❌ Random flight monitoring failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timing: {
        startAt,
        endAt,
        elapsedMs: endTime.getTime() - startTime.getTime()
      }
    });
  }
});

/**
 * POST /api/flights/monitor/custom
 * Performs a custom flight search with specified parameters
 */
router.post('/monitor/custom', async (req, res) => {
  const startTime = new Date();
  const startAt = getCurrentKSTISOString();
  
  try {
    const { 
      departureAirport, 
      arrivalAirport, 
      departureDate, 
      returnDate,
      isRoundTrip = true,
      nonstop 
    } = req.body;
    
    // Validate required parameters
    if (!departureAirport || !arrivalAirport || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: departureAirport, arrivalAirport, departureDate'
      });
    }
    
    const searchParams = {
      departureAirport: departureAirport.toUpperCase(),
      arrivalAirport: arrivalAirport.toUpperCase(),
      departureDate,
      returnDate: isRoundTrip ? returnDate : null,
      isRoundTrip,
      isLongHaul: isLongHaulRoute(arrivalAirport.toUpperCase()),
      nonstop: nonstop || (Math.random() > 0.3 ? 'N' : 'Y') // Use provided value or 70% chance of connecting flights
    };
    
    const flightInfo = getFlightSearchInfo(searchParams);
    console.log(`📋 Custom search: ${flightInfo.route} (${flightInfo.tripType})`);
    
    // Perform flight search
    const searchResult = await searchFlights(searchParams);
    const endTime = new Date();
    const endAt = getCurrentKSTISOString();
    
    // Prepare database record
    const dbRecord = {
      startAt: startTime, // Pass Date object to formatForDatabase
      endAt: endTime, // Pass Date object to formatForDatabase
      elapsedSeconds: searchResult.elapsedSeconds,
      departureAirport: searchParams.departureAirport,
      arrivalAirport: searchParams.arrivalAirport,
      departureDate: searchParams.departureDate,
      arrivalDate: searchParams.returnDate,
      isRoundTrip: searchParams.isRoundTrip,
      isLongHaulRoute: searchParams.isLongHaul,
      nonstop: searchParams.nonstop,
      httpStatus: searchResult.httpStatus,
      errorMessage: searchResult.errorMessage,
      rawRequest: searchResult.url // Store the complete request URL
    };
    
    // Store in database
    const savedRecord = await insertFlightMonitoringRecord(dbRecord);
    
    // Return response
    res.json({
      success: true,
      data: {
        id: savedRecord.id,
        searchParams,
        flightInfo,
        result: {
          success: searchResult.success,
          httpStatus: searchResult.httpStatus,
          elapsedSeconds: searchResult.elapsedSeconds,
          errorMessage: searchResult.errorMessage
        },
        timing: {
          startAt,
          endAt,
          elapsedMs: endTime.getTime() - startTime.getTime()
        }
      }
    });
    
  } catch (error) {
    const endTime = new Date();
    const endAt = getCurrentKSTISOString();
    console.error('❌ Custom flight monitoring failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timing: {
        startAt,
        endAt,
        elapsedMs: endTime.getTime() - startTime.getTime()
      }
    });
  }
});

/**
 * GET /api/flights/airports
 * Returns available airports information
 */
router.get('/airports', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        seoul: SEOUL_AIRPORTS,
        destinations: DESTINATION_AIRPORTS,
        longHaul: LONG_HAUL_DESTINATIONS,
        all: AIRPORTS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 