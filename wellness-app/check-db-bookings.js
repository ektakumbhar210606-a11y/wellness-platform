import mongoose from 'mongoose';

// Connect to database
async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Use the same connection logic as the app
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('Connected to database');
    
    // Get the Booking model
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
    
    // Check for assigned bookings
    console.log('\n=== Checking Assigned Bookings ===');
    const assignedBookings = await Booking.find({ assignedByAdmin: true }).lean();
    
    console.log(`Found ${assignedBookings.length} bookings with assignedByAdmin = true:`);
    
    if (assignedBookings.length === 0) {
      console.log('No assigned bookings found in database');
      
      // Check all bookings to see what exists
      console.log('\n=== Checking All Bookings ===');
      const allBookings = await Booking.find({}).limit(10).lean();
      
      console.log(`Found ${allBookings.length} total bookings:`);
      allBookings.forEach((booking, index) => {
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log(`ID: ${booking._id}`);
        console.log(`Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`);
        console.log(`Therapist: ${booking.therapist?.fullName || 'Not assigned'}`);
        console.log(`Service: ${booking.service?.name}`);
        console.log(`Date: ${booking.date}`);
        console.log(`Time: ${booking.time}`);
        console.log(`Status: ${booking.status}`);
        console.log(`Assigned by Admin: ${booking.assignedByAdmin}`);
        console.log(`Assigned by ID: ${booking.assignedById}`);
      });
      
    } else {
      assignedBookings.forEach((booking, index) => {
        console.log(`\n--- Assigned Booking ${index + 1} ---`);
        console.log(`ID: ${booking._id}`);
        console.log(`Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`);
        console.log(`Therapist: ${booking.therapist?.fullName}`);
        console.log(`Service: ${booking.service?.name}`);
        console.log(`Date: ${booking.date}`);
        console.log(`Time: ${booking.time}`);
        console.log(`Status: ${booking.status}`);
        console.log(`Assigned by Admin: ${booking.assignedByAdmin}`);
        console.log(`Assigned by ID: ${booking.assignedById}`);
      });
      
      // Check if these would appear in therapist dashboard
      console.log('\n=== Testing Therapist Dashboard Query ===');
      const therapistIds = [...new Set(assignedBookings.map(b => b.therapist?._id?.toString()).filter(Boolean))];
      
      for (const therapistId of therapistIds) {
        const therapist = await Therapist.findById(therapistId);
        if (therapist) {
          console.log(`\nTherapist: ${therapist.fullName} (ID: ${therapist._id})`);
          
          const query = {
            therapist: therapist._id,
            assignedByAdmin: true,
            status: { $in: ['pending', 'confirmed'] }
          };
          
          const matchingBookings = await Booking.find(query)
            .populate('customer', 'firstName lastName email')
            .populate('service', 'name')
            .lean();
          
          console.log(`Bookings that would appear in dashboard: ${matchingBookings.length}`);
          matchingBookings.forEach((booking, idx) => {
            console.log(`  ${idx + 1}. ${booking.service?.name} - ${booking.customer?.firstName} ${booking.customer?.lastName} - ${new Date(booking.date).toDateString()} ${booking.time} (${booking.status})`);
          });
        }
      }
    }
    
    await mongoose.connection.close();
    console.log('\nDatabase check complete');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

checkDatabase();