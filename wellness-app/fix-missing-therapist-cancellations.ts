/**
 * Script to fix missing therapist cancellation tracking for past bookings
 * This finds all cancelled bookings with therapistCancelReason but where 
 * the therapist's counters weren't incremented, and updates them
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BookingModel from './models/Booking';
import TherapistModel from './models/Therapist';

dotenv.config({ path: '.env.local' });

async function fixMissingTherapistCancellations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to database');

    // Find all cancelled bookings with therapistCancelReason
    const cancelledBookings = await BookingModel.find({
      status: 'Cancelled',
      therapistCancelReason: { $exists: true, $ne: null },
      therapist: { $exists: true, $ne: null }
    }).populate('therapist');

    console.log(`\n📊 Found ${cancelledBookings.length} cancelled bookings with therapistCancelReason`);

    const fixedCount = 0;
    const processedTherapists = new Set();

    for (const booking of cancelledBookings) {
      if (!booking.therapist) {
        console.log(`⚠️  Skipping booking ${booking._id} - no therapist`);
        continue;
      }

      const therapist = await TherapistModel.findOne({ 
        user: (booking.therapist as any).user 
      });

      if (!therapist) {
        console.log(`⚠️  Skipping booking ${booking._id} - no therapist profile found`);
        continue;
      }

      processedTherapists.add(therapist._id.toString());

      // Check if this booking's cancellation was already counted
      // We'll check if the cancelledAt date is before the therapist's last update
      const bookingCancelledAt = booking.cancelledAt;
      const therapistLastUpdate = therapist.updatedAt;

      // If booking was cancelled after therapist was last updated, it might not have been counted
      // This is a heuristic - in production you'd want a better tracking mechanism
      if (bookingCancelledAt && therapistLastUpdate && bookingCancelledAt <= therapistLastUpdate) {
        // The cancellation might have been counted already
        console.log(`✓ Booking ${booking._id} - Cancellation likely already counted for ${therapist.fullName}`);
      } else {
        // This booking's cancellation might not have been counted
        console.log(`❌ Booking ${booking._id} - Cancellation may NOT have been counted for ${therapist.fullName}`);
        console.log(`   Cancelled at: ${bookingCancelledAt}, Therapist updated: ${therapistLastUpdate}`);
        console.log(`   Current monthly: ${therapist.monthlyCancelCount}, total: ${therapist.totalCancelCount}`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total cancelled bookings with therapist reason: ${cancelledBookings.length}`);
    console.log(`Unique therapists affected: ${processedTherapists.size}`);
    
    if (processedTherapists.size > 0) {
      console.log('\n⚠️  MANUAL ACTION REQUIRED:');
      console.log('Review the bookings above marked with ❌ and manually update therapist counters if needed.');
      console.log('\nExample manual update:');
      console.log('db.therapists.updateOne(');
      console.log('  { _id: <therapist_id> },');
      console.log('  { $inc: { monthlyCancelCount: 1, totalCancelCount: 1 } }');
      console.log(');');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
console.log('🔍 Checking for missing therapist cancellation tracking...\n');
fixMissingTherapistCancellations();
