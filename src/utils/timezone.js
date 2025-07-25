/**
 * Timezone Utility for Korean Standard Time (KST, UTC+9)
 * Handles all datetime conversions and formatting for the application
 */

/**
 * Get current datetime in KST
 * @returns {Date} Current date/time in KST
 */
export function getCurrentKST() {
  const now = new Date();
  // Convert to KST (UTC+9)
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return kstTime;
}

/**
 * Convert UTC datetime to KST
 * @param {Date|string} utcDateTime - UTC datetime
 * @returns {Date} KST datetime
 */
export function convertUTCtoKST(utcDateTime) {
  const utcDate = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  return new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
}

/**
 * Format datetime as ISO 8601 string with KST offset
 * @param {Date|string} dateTime - Date to format
 * @returns {string} ISO 8601 string with +09:00 offset
 */
export function formatKSTISOString(dateTime) {
  let date;
  
  if (typeof dateTime === 'string') {
    date = new Date(dateTime);
  } else {
    date = dateTime;
  }
  
  // Ensure we're working with KST
  const kstDate = convertUTCtoKST(date);
  
  // Format as ISO string and replace Z with +09:00
  const isoString = kstDate.toISOString();
  return isoString.replace('Z', '+09:00');
}

/**
 * Get current KST as ISO string with offset
 * @returns {string} Current KST in ISO format with +09:00
 */
export function getCurrentKSTISOString() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return formatKSTISOString(kstTime);
}

/**
 * Format datetime for database storage (KST as ISO string)
 * @param {Date|string} dateTime - Date to format
 * @returns {string} KST datetime formatted for database
 */
export function formatForDatabase(dateTime = null) {
  const date = dateTime ? new Date(dateTime) : new Date();
  const kstDate = convertUTCtoKST(date);
  return kstDate.toISOString();
}

/**
 * Format call time for display (MM/DD HH:mm:ss in KST)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
export function formatCallTimeKST(timestamp) {
  const date = new Date(timestamp);
  const kstDate = convertUTCtoKST(date);
  
  return kstDate.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  });
}

/**
 * Format dates for display (MM/DD format in KST)
 * @param {string} departureDate - Departure date
 * @param {string} returnDate - Return date
 * @param {boolean} isRoundTrip - Whether it's a round trip
 * @returns {string} Formatted date string
 */
export function formatDatesKST(departureDate, returnDate, isRoundTrip) {
  if (!departureDate) return 'N/A';
  
  const depDate = new Date(departureDate);
  const kstDepDate = convertUTCtoKST(depDate);
  const depFormatted = kstDepDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  });
  
  if (isRoundTrip && returnDate) {
    const retDate = new Date(returnDate);
    const kstRetDate = convertUTCtoKST(retDate);
    const retFormatted = kstRetDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    });
    return `${depFormatted} to ${retFormatted}`;
  }
  
  return depFormatted;
}

/**
 * Format interval label for charts (KST time)
 * @param {Date} date - Date to format
 * @param {number} intervalMinutes - Interval in minutes
 * @returns {string} Formatted label
 */
export function formatIntervalLabelKST(date, intervalMinutes) {
  const kstDate = convertUTCtoKST(date);
  
  if (intervalMinutes <= 60) {
    // Show time for hourly or shorter intervals
    return kstDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });
  } else {
    // Show date and time for longer intervals
    return kstDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });
  }
}

/**
 * Get time range in KST for performance analysis
 * @param {string} timePeriod - Time period (1h, 6h, 24h, 7d)
 * @returns {Object} Start and end times in KST
 */
export function getKSTTimeRange(timePeriod) {
  const now = getCurrentKST();
  let startTime = new Date(now);
  
  switch (timePeriod) {
    case '1h':
      startTime.setHours(now.getHours() - 1);
      break;
    case '6h':
      startTime.setHours(now.getHours() - 6);
      break;
    case '24h':
      startTime.setDate(now.getDate() - 1);
      break;
    case '7d':
      startTime.setDate(now.getDate() - 7);
      break;
    default:
      startTime.setDate(now.getDate() - 1);
  }
  
  return {
    start: startTime,
    end: now,
    startISO: formatKSTISOString(startTime),
    endISO: formatKSTISOString(now)
  };
}

/**
 * Convert database timestamp to KST for API responses
 * @param {string} dbTimestamp - Database timestamp
 * @returns {string} KST ISO string with offset
 */
export function convertDBTimestampToKST(dbTimestamp) {
  if (!dbTimestamp) return null;
  
  // Database stores in UTC, convert to KST for API response
  const utcDate = new Date(dbTimestamp);
  return formatKSTISOString(utcDate);
} 