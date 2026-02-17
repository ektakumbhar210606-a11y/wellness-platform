const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({
  status: String,
  assignedByAdmin: Boolean,
  responseVisibleToBusinessOnly: Boolean,
  therapistResponded: Boolean,
  confirmedBy: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

async function checkProblematicBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const bookings = await Booking.find({
      assignedByAdmin: true,
      therapistResponded: true,
      responseVisibleToBusinessOnly: false
    });
    
    console.log('Problematic bookings:');
    bookings.forEach(b => {
      console.log(`ID: ${b._id}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  ConfirmedBy: ${b.confirmedBy}`);
      console.log(`  Created: ${b.createdAt}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProblematicBooking();