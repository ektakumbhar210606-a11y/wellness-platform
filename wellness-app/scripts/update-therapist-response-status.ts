import { connectToDatabase } from '../lib/db';
import BookingModel from '../models/Booking';

async function updateTherapistResponseStatus() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    console.log('Updating therapist response status for existing bookings...');

    // Find all bookings that were assigned by admin and have had therapist interactions
    // These are bookings that should be marked as having therapist response
    const bookingsToUpdate = await BookingModel.find({
      assignedByAdmin: true,
      $or: [
        { status: { $in: ['confirmed', 'cancelled', 'rescheduled'] } },
        { confirmedAt: { $exists: true, $ne: null } },
        { cancelledAt: { $exists: true, $ne: null } },
        { rescheduledAt: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${bookingsToUpdate.length} bookings to update`);

    if (bookingsToUpdate.length > 0) {
      // Update all these bookings to mark therapist as responded
      const result = await BookingModel.updateMany(
        { 
          _id: { $in: bookingsToUpdate.map(b => b._id) },
          assignedByAdmin: true
        },
        { $set: { therapistResponded: true } }
      );

      console.log(`Updated ${result.modifiedCount} bookings to mark therapist as responded`);
    } else {
      console.log('No bookings found that need updating');
    }

    // Also update bookings that are still pending but were assigned by admin
    // These should remain as therapist not responded
    const pendingBookings = await BookingModel.updateMany(
      {
        assignedByAdmin: true,
        status: 'pending'
      },
      {
        $set: { therapistResponded: false }
      }
    );

    console.log(`Marked ${pendingBookings.modifiedCount} pending bookings as therapist not responded`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
updateTherapistResponseStatus();