import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db';
import BookingModel from '../models/Booking';
import PaymentModel from '../models/Payment';

/**
 * Migration script to update existing bookings with proper payment status
 * based on their associated payment records
 */
async function updateBookingPaymentStatus() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    // Find all bookings
    const allBookings = await BookingModel.find({});
    
    console.log(`Found ${allBookings.length} bookings to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const booking of allBookings) {
      // Check payment status by looking at all payments for this booking
      const payments = await PaymentModel.find({ 
        booking: booking._id 
      });

      // Calculate overall payment status
      let overallPaymentStatus: 'pending' | 'partial' | 'completed' = 'pending';
      
      if (payments.length > 0) {
        const completedPayments = payments.filter(p => p.status === 'completed');
        if (completedPayments.length > 0) {
          // Check if there are any advance payments
          const advancePayments = completedPayments.filter(p => p.paymentType === 'ADVANCE');
          const fullPayments = completedPayments.filter(p => p.paymentType === 'FULL');
          
          if (fullPayments.length > 0) {
            // If any payment is FULL type, the booking is fully paid
            overallPaymentStatus = 'completed';
          } else if (advancePayments.length > 0) {
            // If there are only ADVANCE payments, it's partial payment
            overallPaymentStatus = 'partial';
          } else {
            // If there are completed payments but none are FULL or ADVANCE, treat as completed
            overallPaymentStatus = 'completed';
          }
        }
      }

      // Update the booking with the calculated payment status
      await BookingModel.findByIdAndUpdate(
        booking._id,
        { paymentStatus: overallPaymentStatus },
        { new: true, runValidators: true }
      );

      console.log(`Updated booking ${booking._id} with paymentStatus: ${overallPaymentStatus}`);
      updatedCount++;
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`Updated ${updatedCount} bookings`);
    console.log(`Skipped ${skippedCount} bookings`);

    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  updateBookingPaymentStatus();
}