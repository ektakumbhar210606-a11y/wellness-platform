import mongoose from 'mongoose';
import BookingModel, { BookingStatus } from './models/Booking.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Function to restore cancelled bookings to their appropriate previous status
 * This function analyzes each cancelled booking and determines the most logical 
 * previous status based on payment status, completion status, and other factors
 */
async function restoreCancelledBookings() {
  try {
    console.log('=== BOOKING RESTORATION PROCESS STARTED ===\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find all cancelled bookings
    const cancelledBookings = await BookingModel.find({ 
      status: BookingStatus.Cancelled 
    });
    
    console.log(`Found ${cancelledBookings.length} cancelled bookings to restore\n`);
    
    if (cancelledBookings.length === 0) {
      console.log('✅ No cancelled bookings found. Nothing to restore.');
      return { restoredCount: 0, restoredBookings: [] };
    }
    
    const restoredBookings = [];
    let restoredCount = 0;
    
    console.log('Processing each cancelled booking...\n');
    
    for (const booking of cancelledBookings) {
      console.log(`Processing booking ID: ${booking._id}`);
      console.log(`  Current status: ${booking.status}`);
      console.log(`  Payment status: ${booking.paymentStatus}`);
      console.log(`  Created at: ${booking.createdAt}`);
      console.log(`  Completed at: ${booking.completedAt}`);
      console.log(`  Confirmed at: ${booking.confirmedAt}`);
      console.log(`  Assigned by admin: ${booking.assignedByAdmin}`);
      console.log(`  Therapist responded: ${booking.therapistResponded}`);
      
      // Determine the most appropriate previous status
      const previousStatus = determinePreviousStatus(booking);
      
      console.log(`  Determined previous status: ${previousStatus}`);
      
      // Update the booking status
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        booking._id,
        { 
          status: previousStatus,
          // Clear cancellation metadata since we're restoring
          cancelledBy: undefined,
          cancelledAt: undefined
        },
        { new: true, runValidators: true }
      );
      
      if (updatedBooking) {
        restoredBookings.push({
          id: updatedBooking._id.toString(),
          previousStatus: booking.status,
          restoredStatus: updatedBooking.status,
          paymentStatus: updatedBooking.paymentStatus,
          completedAt: updatedBooking.completedAt
        });
        restoredCount++;
        console.log(`  ✅ Successfully restored to ${previousStatus}\n`);
      } else {
        console.log(`  ❌ Failed to restore booking\n`);
      }
    }
    
    console.log(`=== RESTORATION SUMMARY ===`);
    console.log(`Restored ${restoredCount} bookings out of ${cancelledBookings.length} cancelled bookings`);
    
    if (restoredBookings.length > 0) {
      console.log('\nRestored bookings details:');
      restoredBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id}`);
        console.log(`     Previous: ${booking.previousStatus} → Restored: ${booking.restoredStatus}`);
        console.log(`     Payment Status: ${booking.paymentStatus}`);
        if (booking.completedAt) {
          console.log(`     Completed At: ${booking.completedAt}`);
        }
      });
    }
    
    return { restoredCount, restoredBookings };
    
  } catch (error) {
    console.error('❌ Error during booking restoration:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n=== BOOKING RESTORATION PROCESS COMPLETED ===');
  }
}

/**
 * Determine the most appropriate previous status for a cancelled booking
 * based on its properties and payment/completion status
 */
function determinePreviousStatus(booking) {
  // Priority 1: If it was completed, restore to completed
  if (booking.completedAt || booking.status === BookingStatus.Completed) {
    return BookingStatus.Completed;
  }
  
  // Priority 2: If it was paid, restore to paid
  if (booking.paymentStatus === 'completed') {
    return BookingStatus.Paid;
  }
  
  // Priority 3: If it had partial payment, restore to confirmed
  if (booking.paymentStatus === 'partial') {
    return BookingStatus.Confirmed;
  }
  
  // Priority 4: If it was confirmed by someone, restore to confirmed
  if (booking.confirmedAt || booking.confirmedBy) {
    return BookingStatus.Confirmed;
  }
  
  // Priority 5: If it was assigned by admin and therapist responded, restore to therapist_confirmed
  if (booking.assignedByAdmin && booking.therapistResponded) {
    return BookingStatus.TherapistConfirmed;
  }
  
  // Priority 6: If it was assigned by admin but no therapist response, restore to pending
  if (booking.assignedByAdmin) {
    return BookingStatus.Pending;
  }
  
  // Default: Restore to pending (safest option for unassigned bookings)
  return BookingStatus.Pending;
}

/**
 * Function to preview what the restoration would do without actually making changes
 */
async function previewRestoration() {
  try {
    console.log('=== BOOKING RESTORATION PREVIEW ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const cancelledBookings = await BookingModel.find({ 
      status: BookingStatus.Cancelled 
    });
    
    console.log(`Found ${cancelledBookings.length} cancelled bookings\n`);
    
    if (cancelledBookings.length === 0) {
      console.log('✅ No cancelled bookings found.');
      return;
    }
    
    console.log('Preview of restoration actions:');
    console.log('================================\n');
    
    cancelledBookings.forEach((booking, index) => {
      const previousStatus = determinePreviousStatus(booking);
      console.log(`${index + 1}. Booking ID: ${booking._id}`);
      console.log(`   Current Status: ${booking.status}`);
      console.log(`   Would Restore To: ${previousStatus}`);
      console.log(`   Payment Status: ${booking.paymentStatus}`);
      console.log(`   Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`   Therapist Responded: ${booking.therapistResponded}`);
      console.log(`   Completed At: ${booking.completedAt}`);
      console.log(`   Confirmed At: ${booking.confirmedAt}`);
      console.log('');
    });
    
    const statusDistribution = {};
    cancelledBookings.forEach(booking => {
      const targetStatus = determinePreviousStatus(booking);
      statusDistribution[targetStatus] = (statusDistribution[targetStatus] || 0) + 1;
    });
    
    console.log('Summary of proposed status changes:');
    Object.entries(statusDistribution).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} bookings`);
    });
    
  } catch (error) {
    console.error('❌ Error during preview:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n=== PREVIEW COMPLETE ===');
  }
}

// Export functions for use
export { restoreCancelledBookings, previewRestoration, determinePreviousStatus };

// Run the restoration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--preview')) {
    previewRestoration();
  } else if (args.includes('--restore')) {
    restoreCancelledBookings();
  } else {
    console.log('Usage:');
    console.log('  node restore-cancelled-bookings.js --preview    # Preview changes without applying them');
    console.log('  node restore-cancelled-bookings.js --restore   # Actually restore the bookings');
    console.log('');
    console.log('⚠️  WARNING: The restore operation will modify database records.');
    console.log('⚠️  Always run --preview first to see what changes will be made.');
  }
}