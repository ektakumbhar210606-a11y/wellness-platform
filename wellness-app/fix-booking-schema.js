import mongoose from 'mongoose';

async function fixBookingSchema() {
  try {
    console.log('Connecting to database...');
    
    // Use the same connection logic as the app
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    await mongoose.connect(MONGODB_URI);
    
    console.log('Connected to database');
    
    // Define the booking schema
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
    
    // Find all bookings that don't have the assignedByAdmin field
    const bookingsWithoutAssignedField = await Booking.find({
      $or: [
        { assignedByAdmin: { $exists: false } },
        { assignedById: { $exists: false } }
      ]
    });
    
    console.log(`Found ${bookingsWithoutAssignedField.length} bookings without assigned fields`);
    
    // Update each booking to add the missing fields
    for (const booking of bookingsWithoutAssignedField) {
      await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            assignedByAdmin: false,
            assignedById: null
          }
        },
        { new: true }
      );
      console.log(`Updated booking ${booking._id}`);
    }
    
    console.log('Schema fix complete!');
    
    // Verify the fix
    const totalBookings = await Booking.countDocuments();
    const bookingsWithAssignedFlag = await Booking.countDocuments({ assignedByAdmin: true });
    const bookingsWithoutAssignedFlag = await Booking.countDocuments({ assignedByAdmin: false });
    
    console.log(`\n=== Verification ===`);
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Bookings with assignedByAdmin = true: ${bookingsWithAssignedFlag}`);
    console.log(`Bookings with assignedByAdmin = false: ${bookingsWithoutAssignedFlag}`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error fixing booking schema:', error);
    await mongoose.connection.close();
  }
}

fixBookingSchema();