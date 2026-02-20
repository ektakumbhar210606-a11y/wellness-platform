import { connectToDatabase } from '../lib/db';
import BookingModel, { IBooking, BookingStatus } from '../models/Booking';

/**
 * Function to automatically cancel expired bookings
 * A booking is considered expired if:
 * 1. The date is in the past (before today), OR
 * 2. The date is today but the time has passed
 * 
 * IMPORTANT: Only unpaid bookings (paymentStatus: 'pending') are subject to automatic cancellation.
 * Bookings with paymentStatus 'completed' or 'partial' are protected from automatic cancellation.
 * Bookings with status 'completed' are also protected from automatic cancellation.
 */
export async function cancelExpiredBookings(): Promise<{ cancelledCount: number; cancelledBookings: IBooking[] }> {
  try {
    await connectToDatabase();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find bookings that are pending or confirmed AND have not been paid
    // Only cancel unpaid bookings that are still in pending or confirmed status
    const activeBookings = await BookingModel.find({
      $and: [
        {
          $or: [
            { status: BookingStatus.Pending },
            { status: BookingStatus.Confirmed }
          ]
        },
        {
          $or: [
            { paymentStatus: 'pending' },
            { paymentStatus: null },
            { paymentStatus: undefined }
          ]
        },
        { status: { $ne: BookingStatus.Completed } }
      ]
    });

    const cancelledBookings: IBooking[] = [];
    let cancelledCount = 0;

    for (const booking of activeBookings) {
      if (isBookingExpired(booking, now)) {
        const updatedBooking = await BookingModel.findByIdAndUpdate(
          booking._id,
          { status: BookingStatus.Cancelled },
          { new: true }
        );
        
        if (updatedBooking) {
          cancelledBookings.push(updatedBooking);
          cancelledCount++;
        }
      }
    }

    console.log(`Cancelled ${cancelledCount} expired unpaid bookings (paid/completed bookings are protected, only paymentStatus: 'pending' bookings are cancelled)`);
    return { cancelledCount, cancelledBookings };
  } catch (error) {
    console.error('Error cancelling expired bookings:', error);
    throw error;
  }
}

/**
 * Helper function to check if a booking has expired
 * @param booking The booking to check
 * @param currentTime The current time for comparison (defaults to now)
 * @returns boolean indicating if the booking has expired
 */
export function isBookingExpired(booking: IBooking, currentTime: Date = new Date()): boolean {
  const bookingDate = new Date(booking.date);
  const today = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  
  // If the booking date is in the past, it's expired
  if (bookingDate < today) {
    return true;
  }

  // If it's today, check if the time has passed
  if (isSameDay(bookingDate, today)) {
    const [hours, minutes] = booking.time.split(':').map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    return bookingDateTime < currentTime;
  }

  // Future booking
  return false;
}

/**
 * Helper function to check if two dates are the same day
 * @param date1 First date to compare
 * @param date2 Second date to compare
 * @returns boolean indicating if both dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}