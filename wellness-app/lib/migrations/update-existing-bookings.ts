import mongoose from 'mongoose';
import BookingModel from '../../models/Booking';

/**
 * Migration script to update existing bookings with the assignedByAdmin field
 * This sets the field to false for all existing bookings since they weren't 
 * explicitly assigned by an admin when the feature was introduced
 */

async function updateExistingBookings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serenity_db');
    console.log('Connected to database');

    // Update all existing bookings to have assignedByAdmin: false by default
    // This is because they were created by customers, not explicitly assigned by admins
    const result = await BookingModel.updateMany(
      { assignedByAdmin: { $exists: false } }, // Only update bookings where field doesn't exist
      { $set: { assignedByAdmin: false } }    // Set it to false
    );

    console.log(`Updated ${result.modifiedCount} bookings with assignedByAdmin: false`);

    // Close connection
    await mongoose.connection.close();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  updateExistingBookings();
}