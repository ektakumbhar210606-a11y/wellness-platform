const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({
  status: String,
  assignedByAdmin: Boolean,
  responseVisibleToBusinessOnly: Boolean,
  therapistResponded: Boolean,
  confirmedBy: String,
  createdAt: Date
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

async function checkRecentBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const bookings = await Booking.find({ assignedByAdmin: true })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('Recent business-assigned bookings:');
    bookings.forEach(b => {
      console.log(`ID: ${b._id}`);
      console.log(`  Created: ${b.createdAt}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  VisibleToBusinessOnly: ${b.responseVisibleToBusinessOnly}`);
      console.log(`  TherapistResponded: ${b.therapistResponded}`);
      console.log(`  ConfirmedBy: ${b.confirmedBy}`);
      console.log('');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentBookings();