import axios from 'axios';
import { 
  getRandomSeoulAirport, 
  getRandomDestination, 
  isLongHaulRoute, 
  getAirportInfo 
} from '../config/airports.js';

const FLIGHT_API_BASE_URL = process.env.FLIGHT_API_BASE_URL || 'https://naverflights.myrealtrip.com';
const API_PATH = '/air/b2c/AIR/INT/AIRINTSCH010010001033.k1xml';

/**
 * Generate random dates between 15 days from today and end of current year
 */
function generateRandomDates() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 15); // 15 days from today
  
  const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31st
  
  // Generate departure date
  const depTime = startDate.getTime() + Math.random() * (endOfYear.getTime() - startDate.getTime());
  const departureDate = new Date(depTime);
  
  // Generate return date (2-14 days after departure for round trip)
  const minReturnTime = departureDate.getTime() + (2 * 24 * 60 * 60 * 1000); // 2 days later
  const maxReturnTime = Math.min(
    departureDate.getTime() + (14 * 24 * 60 * 60 * 1000), // 14 days later
    endOfYear.getTime()
  );
  
  const returnTime = minReturnTime + Math.random() * (maxReturnTime - minReturnTime);
  const returnDate = new Date(returnTime);
  
  return {
    departure: departureDate.toISOString().split('T')[0], // YYYY-MM-DD format
    return: returnDate.toISOString().split('T')[0]
  };
}

/**
 * Build flight search URL with parameters
 */
function buildFlightSearchUrl(params) {
  const {
    departureAirport,
    arrivalAirport,
    departureDate,
    returnDate,
    isRoundTrip = true,
    adultCount = 1,
    childCount = 0,
    infantCount = 0,
    cabinClass = 'Y', // Economy
    nonstop = 'Y' // Keep default for backward compatibility
  } = params;

  const baseUrl = `${FLIGHT_API_BASE_URL}${API_PATH}`;
  const urlParams = new URLSearchParams();

  // Trip type
  urlParams.append('initform', isRoundTrip ? 'RT' : 'OW');
  urlParams.append('domintgubun', 'I'); // International
  
  // Airports
  urlParams.append('depctycd', departureAirport);
  urlParams.append('arrctycd', arrivalAirport);
  
  // Additional empty airport codes (as per sample URL)
  urlParams.append('depctycd', '');
  urlParams.append('depctycd', '');
  urlParams.append('arrctycd', '');
  urlParams.append('arrctycd', '');
  
  // Dates
  urlParams.append('depdt', departureDate);
  if (isRoundTrip) {
    urlParams.append('depdt', returnDate);
  }
  urlParams.append('depdt', '');
  urlParams.append('depdt', '');
  
  // Other parameters
  urlParams.append('opencase', 'N');
  urlParams.append('opencase', 'N');
  urlParams.append('opencase', 'N');
  urlParams.append('openday', '');
  urlParams.append('openday', '');
  urlParams.append('openday', '');
  urlParams.append('depdomintgbn', 'D');
  urlParams.append('tasktype', 'B2C');
  
  // Passenger counts
  urlParams.append('adtcount', adultCount.toString());
  urlParams.append('chdcount', childCount.toString());
  urlParams.append('infcount', infantCount.toString());
  
  // Flight preferences
  urlParams.append('cabinclass', cabinClass);
  urlParams.append('maxprice', '');
  urlParams.append('preferaircd', '');
  urlParams.append('nonstop', nonstop);
  urlParams.append('availcount', '4000');
  urlParams.append('secrchType', 'FARE');
  
  // Session ID (simplified)
  urlParams.append('KSESID', 'air:b2c:SELK138RB:SELK138RB:N00001:00');

  return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Generate random flight search parameters
 */
export function generateRandomFlightSearch() {
  const departureAirport = getRandomSeoulAirport();
  const arrivalAirport = getRandomDestination();
  const dates = generateRandomDates();
  const isRoundTrip = Math.random() > 0.3; // 70% chance of round trip
  const nonstop = Math.random() > 0.3 ? 'N' : 'Y'; // 70% chance of connecting flights
  
  return {
    departureAirport,
    arrivalAirport,
    departureDate: dates.departure,
    returnDate: isRoundTrip ? dates.return : null,
    isRoundTrip,
    isLongHaul: isLongHaulRoute(arrivalAirport),
    nonstop
  };
}

/**
 * Search flights using Naver Flights API
 */
export async function searchFlights(searchParams) {
  const startTime = Date.now();
  let httpStatus = null;
  let errorMessage = null;
  
  try {
    const url = buildFlightSearchUrl(searchParams);
    console.log(`🔍 Searching flights: ${searchParams.departureAirport} → ${searchParams.arrivalAirport}`);
    console.log(`📅 Dates: ${searchParams.departureDate}${searchParams.isRoundTrip ? ` → ${searchParams.returnDate}` : ''}`);
    console.log(`🌐 Request URL: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    httpStatus = response.status;
    const endTime = Date.now();
    const elapsedSeconds = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Flight search completed in ${elapsedSeconds}s (Status: ${httpStatus})`);
    
    return {
      success: true,
      httpStatus,
      elapsedSeconds,
      responseData: response.data,
      url
    };
    
  } catch (error) {
    const endTime = Date.now();
    const elapsedSeconds = Math.round((endTime - startTime) / 1000);
    
    if (error.response) {
      httpStatus = error.response.status;
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorMessage = 'No response received from server';
    } else {
      errorMessage = error.message;
    }
    
    console.error(`❌ Flight search failed after ${elapsedSeconds}s: ${errorMessage}`);
    
    return {
      success: false,
      httpStatus,
      elapsedSeconds,
      errorMessage,
      error,
      url: buildFlightSearchUrl(searchParams) // Include URL even on error for logging
    };
  }
}

/**
 * Get flight search info for display
 */
export function getFlightSearchInfo(searchParams) {
  const depInfo = getAirportInfo(searchParams.departureAirport);
  const arrInfo = getAirportInfo(searchParams.arrivalAirport);
  
  return {
    route: `${depInfo.city} (${searchParams.departureAirport}) → ${arrInfo.city} (${searchParams.arrivalAirport})`,
    departureInfo: depInfo,
    arrivalInfo: arrInfo,
    tripType: searchParams.isRoundTrip ? 'Round Trip' : 'One Way',
    isLongHaul: searchParams.isLongHaul
  };
} 