import mongoose from 'mongoose';
import { connectToDatabase } from './lib/db';
import BookingModel from './models/Booking';

async function fixBookingSchema() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');
    
    // Find all bookings that don't have the assignedByAdmin field
    const bookingsWithoutAssignedField = await BookingModel.find({
      $or: [
        { assignedByAdmin: { $exists: false } },
        { assignedById: { $exists: false } }
      ]
    });
    
    console.log(`Found ${bookingsWithoutAssignedField.length} bookings without assigned fields`);
    
    // Update each booking to add the missing fields
    for (const booking of bookingsWithoutAssignedField) {
      await BookingModel.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            assignedByAdmin: booking.assignedByAdmin || false,
            assignedById: booking.assignedById || null
          }
        },
        { new: true, runValidators: true }
      );
      console.log(`Updated booking ${booking._id}`);
    }
    
    console.log('Schema fix complete!');
    
    // Verify the fix
    const totalBookings = await BookingModel.countDocuments();
    const bookingsWithAssignedFlag = await BookingModel.countDocuments({ assignedByAdmin: true });
    const bookingsWithoutAssignedFlag = await BookingModel.countDocuments({ assignedByAdmin: false });
    
    console.log(`\n=== Verification ===`);
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Bookings with assignedByAdmin = true: ${bookingsWithAssignedFlag}`);
    console.log(`Bookings with assignedByAdmin = false: ${bookingsWithoutAssignedFlag}`);
    
    mongoose.connection.close();
    
  } catch (error) {
    console.error('Error fixing booking schema:', error);
    mongoose.connection.close();
  }
}

fixBookingSchema();