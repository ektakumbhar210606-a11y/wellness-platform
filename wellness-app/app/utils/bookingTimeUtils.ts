/**
 * Utility functions for booking time calculations and restrictions
 */

/**
 * Check if a booking is within 24 hours from current time
 * @param bookingDate - The booking date (string or Date)
 * @param bookingTime - The booking time (string in HH:mm format)
 * @returns boolean - true if booking is within 24 hours, false otherwise
 */
export function isBookingWithin24Hours(bookingDate: string | Date, bookingTime: string): boolean {
  try {
    // Parse the booking date and time
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    // Get current time
    const now = new Date();
    
    // Calculate the time difference in milliseconds
    const timeDifference = bookingDateTime.getTime() - now.getTime();
    
    // Convert 24 hours to milliseconds (24 * 60 * 60 * 1000)
    const twentyFourHoursInMs = 86400000;
    
    // Return true if the booking is within 24 hours (including past bookings)
    return timeDifference <= twentyFourHoursInMs;
  } catch (error) {
    console.error('Error checking booking time:', error);
    // If there's an error parsing the time, be conservative and return true
    // (restrict rescheduling by default)
    return true;
  }
}

/**
 * Check if reschedule should be restricted for a booking
 * @param bookingDate - The booking date
 * @param bookingTime - The booking time
 * @param userRole - The role of the user checking (customer, business, therapist)
 * @returns boolean - true if reschedule should be restricted, false if allowed
 */
export function shouldRestrictReschedule(bookingDate: string | Date, bookingTime: string, userRole: string): boolean {
  // Only restrict for customer and business dashboards
  if (userRole === 'therapist') {
    return false; // Therapists always have reschedule access
  }
  
  // Check if booking is within 24 hours
  return isBookingWithin24Hours(bookingDate, bookingTime);
}