// Simple migration script that can be run directly
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Booking schema definition
const bookingSchema = new mongoose.Schema({
  responseVisibleToBusinessOnly: {
    type: Boolean,
    default: false
  },
  therapistResponded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

async function updateResponseVisibility() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to database');
    console.log('Updating response visibility for existing bookings...');
    
    // Update all existing bookings to set responseVisibleToBusinessOnly to false (default)
    // This ensures backward compatibility for existing bookings
    const result = await Booking.updateMany(
      { responseVisibleToBusinessOnly: { $exists: false } },
      { $set: { responseVisibleToBusinessOnly: false } }
    );

    console.log(`Updated ${result.modifiedCount} bookings with default response visibility setting`);
    
    // Also update any bookings that have therapist responses but don't have the flag set
    const therapistRespondedBookings = await Booking.updateMany(
      { 
        therapistResponded: true,
        responseVisibleToBusinessOnly: { $exists: false }
      },
      { $set: { responseVisibleToBusinessOnly: false } }
    );

    console.log(`Updated ${therapistRespondedBookings.modifiedCount} therapist-responded bookings with default visibility setting`);

    console.log('Response visibility update completed successfully!');
    
  } catch (error) {
    console.error('Error updating response visibility:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the update
updateResponseVisibility();