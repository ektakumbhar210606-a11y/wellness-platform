// Simple migration script to update existing bookings
// This sets assignedByAdmin: false for all existing bookings that don't have this field
// Usage: node run-migration.js

import mongoose from 'mongoose';

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serenity_db')
  .then(async () => {
    console.log('Connected to database');
    
    import BookingModel from './models/Booking.js';
    
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
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });