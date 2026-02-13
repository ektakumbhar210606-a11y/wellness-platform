/**
 * Utility functions for time formatting and conversion
 */

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in HH:MM format (e.g., "14:30")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM")
 */
export function formatTimeTo12Hour(time24: string): string {
  if (!time24 || typeof time24 !== 'string') {
    return '';
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time24)) {
    console.warn('Invalid time format:', time24);
    return time24; // Return original if invalid
  }

  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  // Determine AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  let hours12 = hours;
  if (hours === 0) {
    hours12 = 12; // 00:xx is 12:xx AM
  } else if (hours > 12) {
    hours12 = hours - 12; // 13:xx is 1:xx PM, etc.
  }
  // 1-12 hours stay the same

  const result = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  console.log(`Converted ${time24} to ${result}`);
  return result;
}

/**
 * Convert 12-hour time format with AM/PM to 24-hour format
 * @param time12 - Time in 12-hour format with AM/PM (e.g., "2:30 PM")
 * @returns Time in 24-hour format (e.g., "14:30")
 */
export function formatTimeTo24Hour(time12: string): string {
  if (!time12 || typeof time12 !== 'string') {
    return '';
  }

  // Validate time format with AM/PM
  const timeRegex = /^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i;
  const match = time12.match(timeRegex);
  
  if (!match) {
    console.warn('Invalid 12-hour time format:', time12);
    return time12; // Return original if invalid
  }

  let [, hours, minutes, period] = match;
  let hours24 = parseInt(hours, 10);
  
  period = period.toUpperCase();
  
  if (period === 'AM' && hours24 === 12) {
    hours24 = 0; // 12 AM is 00:00
  } else if (period === 'PM' && hours24 !== 12) {
    hours24 += 12; // Convert PM to 24-hour format
  }

  return `${hours24.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Format a time range (start and end times) to 12-hour format
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Formatted time range (e.g., "9:00 AM - 5:00 PM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  if (!startTime || !endTime) {
    return 'Not specified';
  }

  const startFormatted = formatTimeTo12Hour(startTime);
  const endFormatted = formatTimeTo12Hour(endTime);

  const result = `${startFormatted} - ${endFormatted}`;
  console.log(`Time range ${startTime} to ${endTime} formatted as ${result}`);
  return result;
}

/**
 * Format business hours object to 12-hour format
 * @param businessHours - Business hours object with open/close times
 * @returns Formatted business hours string
 */
export function formatBusinessHours(businessHours: any): string {
  if (!businessHours) {
    return 'Not specified';
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const formattedHours = [];

  for (const day of days) {
    const dayHours = businessHours[day];
    if (dayHours && !dayHours.closed) {
      const formatted = formatTimeRange(dayHours.open, dayHours.close);
      formattedHours.push(`${day}: ${formatted}`);
    } else {
      formattedHours.push(`${day}: Closed`);
    }
  }

  return formattedHours.join(', ');
}