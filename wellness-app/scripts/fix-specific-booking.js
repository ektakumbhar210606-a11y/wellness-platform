const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({
  status: String,
  assignedByAdmin: Boolean,
  responseVisibleToBusinessOnly: Boolean,
  therapistResponded: Boolean,
  confirmedBy: String,
  confirmedAt: Date
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

async function fixSpecificBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const bookingId = '698ed8bd64f04f1f03500ac1';
    
    const booking = await Booking.findById(bookingId);
    if (booking) {
      console.log('Found booking:');
      console.log(`  Status: ${booking.status}`);
      console.log(`  AssignedByAdmin: ${booking.assignedByAdmin}`);
      console.log(`  TherapistResponded: ${booking.therapistResponded}`);
      console.log(`  ResponseVisibleToBusinessOnly: ${booking.responseVisibleToBusinessOnly}`);
      console.log(`  ConfirmedBy: ${booking.confirmedBy}`);
      
      // Fix the booking
      booking.responseVisibleToBusinessOnly = true;
      // Since confirmedBy is undefined, we'll set it to indicate it was processed
      booking.confirmedBy = 'system-fix';
      booking.confirmedAt = new Date();
      
      await booking.save();
      
      console.log('\n✅ Booking fixed:');
      console.log(`  ResponseVisibleToBusinessOnly: ${booking.responseVisibleToBusinessOnly}`);
      console.log(`  ConfirmedBy: ${booking.confirmedBy}`);
    } else {
      console.log('Booking not found');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixSpecificBooking();