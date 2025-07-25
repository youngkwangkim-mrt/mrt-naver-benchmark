/**
 * Timezone Utility for Korean Standard Time (KST, UTC+9)
 * Handles all datetime conversions and formatting for the application
 */

/**
 * Get current datetime in KST
 * @returns {Date} Current date/time in KST timezone
 */
export function getCurrentKST() {
  const now = new Date();
  // Use proper timezone conversion
  return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
}

/**
 * Convert UTC datetime to KST
 * @param {Date|string} utcDateTime - UTC datetime
 * @returns {Date} KST datetime
 */
export function convertUTCtoKST(utcDateTime) {
  const utcDate = typeof utcDateTime === 'string' ? new Date(utcDateTime) : utcDateTime;
  // Use proper timezone conversion instead of manual offset
  return new Date(utcDate.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
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
  
  // Convert to KST and format with proper offset
  const kstDate = convertUTCtoKST(date);
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getSeconds()).padStart(2, '0');
  const milliseconds = String(kstDate.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+09:00`;
}

/**
 * Get current KST as ISO string with offset
 * @returns {string} Current KST in ISO format with +09:00
 */
export function getCurrentKSTISOString() {
  return formatKSTISOString(new Date());
}

/**
 * Format datetime for database storage (UTC timestamps)
 * @param {Date|string} dateTime - Date to format
 * @returns {string} UTC datetime formatted for database
 */
export function formatForDatabase(dateTime = null) {
  const date = dateTime ? new Date(dateTime) : new Date();
  // Store as proper UTC timestamp - don't add KST offset
  return date.toISOString();
}

/**
 * Format call time for display (MM/DD HH:mm:ss in KST)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time string
 */
export function formatCallTimeKST(timestamp) {
  const date = new Date(timestamp);
  
  return date.toLocaleString('en-US', {
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
  const depFormatted = depDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  });
  
  if (isRoundTrip && returnDate) {
    const retDate = new Date(returnDate);
    const retFormatted = retDate.toLocaleDateString('en-US', {
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
  if (intervalMinutes <= 60) {
    // Show time for hourly or shorter intervals
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });
  } else {
    // Show date and time for longer intervals
    return date.toLocaleDateString('en-US', {
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
 * @returns {Object} Start and end times in UTC for database queries with KST display
 */
export function getKSTTimeRange(timePeriod) {
  const now = new Date();
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
 * @param {string} dbTimestamp - Database timestamp (UTC)
 * @returns {string} KST ISO string with offset
 */
export function convertDBTimestampToKST(dbTimestamp) {
  if (!dbTimestamp) return null;
  
  // Database stores in UTC, convert to KST for API response
  const utcDate = new Date(dbTimestamp);
  return formatKSTISOString(utcDate);
} 