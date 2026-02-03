const mongoose = require('mongoose');

async function testBookingAssignment() {
  try {
    console.log('Connecting to database...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    await mongoose.connect(MONGODB_URI);
    
    console.log('Connected to database');
    
    // Define schemas
    const bookingSchema = new mongoose.Schema({
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist' },
      service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      date: Date,
      time: String,
      status: String,
      assignedByAdmin: { type: Boolean, default: false },
      assignedById: String
    }, { timestamps: true });
    
    const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
    
    const therapistSchema = new mongoose.Schema({
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fullName: String
    });
    
    const Therapist = mongoose.models.Therapist || mongoose.model('Therapist', therapistSchema);
    
    // Find a booking to test with
    const booking = await Booking.findOne({ assignedByAdmin: false });
    if (!booking) {
      console.log('No bookings available for testing');
      await mongoose.connection.close();
      return;
    }
    
    console.log('Testing booking:', booking._id);
    console.log('Current assignedByAdmin:', booking.assignedByAdmin);
    
    // Find a therapist to assign to
    const therapist = await Therapist.findOne({});
    if (!therapist) {
      console.log('No therapists found in database');
      await mongoose.connection.close();
      return;
    }
    
    console.log('Assigning to therapist:', therapist.fullName);
    
    // Test the assignment update
    console.log('\n=== Testing Assignment Update ===');
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      {
        therapist: therapist._id,
        status: 'pending',
        assignedByAdmin: true,
        assignedById: 'TEST_ADMIN_ID'
      },
      { new: true }
    );
    
    console.log('Updated booking:', updatedBooking._id);
    console.log('assignedByAdmin:', updatedBooking.assignedByAdmin);
    console.log('assignedById:', updatedBooking.assignedById);
    console.log('therapist:', updatedBooking.therapist);
    
    // Test the therapist dashboard query
    console.log('\n=== Testing Therapist Dashboard Query ===');
    const query = {
      therapist: therapist._id,
      assignedByAdmin: true,
      status: { $in: ['pending', 'confirmed'] }
    };
    
    const therapistBookings = await Booking.find(query);
    console.log(`Found ${therapistBookings.length} bookings for therapist dashboard`);
    
    therapistBookings.forEach((b, i) => {
      console.log(`  ${i + 1}. Booking ${b._id} - assignedByAdmin: ${b.assignedByAdmin} - status: ${b.status}`);
    });
    
    // Reset for cleanup
    console.log('\n=== Resetting for cleanup ===');
    await Booking.findByIdAndUpdate(
      booking._id,
      {
        therapist: null,
        assignedByAdmin: false,
        assignedById: null
      }
    );
    
    console.log('Test complete - booking reset to original state');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error testing booking assignment:', error);
    await mongoose.connection.close();
  }
}

testBookingAssignment();