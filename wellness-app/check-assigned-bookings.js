const checkAssignedBookings = async () => {
  const { connectToDatabase } = await import('./lib/db.js');
  const BookingModel = (await import('./models/Booking')).default;
  const TherapistModel = (await import('./models/Therapist')).default;
  
  try {
    await connectToDatabase();
    console.log('=== Checking Assigned Bookings in Database ===\n');
    
    // Find all bookings with assignedByAdmin = true
    const assignedBookings = await BookingModel.find({ assignedByAdmin: true })
      .populate('customer', 'firstName lastName email')
      .populate('therapist', 'fullName professionalTitle')
      .populate('service', 'name')
      .lean();
    
    console.log(`Found ${assignedBookings.length} bookings with assignedByAdmin = true:`);
    
    if (assignedBookings.length === 0) {
      console.log('No bookings found with assignedByAdmin = true');
      return;
    }
    
    assignedBookings.forEach((booking, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
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
    
    // Check if these bookings would appear in therapist dashboard
    console.log('\n=== Checking Therapist Dashboard Query ===');
    
    // Get unique therapist IDs from assigned bookings
    const therapistIds = [...new Set(assignedBookings.map(b => b.therapist?._id?.toString()).filter(Boolean))];
    
    console.log(`Found ${therapistIds.length} unique therapists with assigned bookings:`);
    
    for (const therapistId of therapistIds) {
      const therapist = await TherapistModel.findById(therapistId);
      if (!therapist) {
        console.log(`Therapist with ID ${therapistId} not found in database`);
        continue;
      }
      
      console.log(`\n--- Therapist: ${therapist.fullName} ---`);
      console.log(`Therapist ID: ${therapist._id}`);
      console.log(`User ID: ${therapist.user}`);
      
      // Simulate the therapist dashboard query
      const query = {
        therapist: therapist._id,
        assignedByAdmin: true,
        status: { $in: ['pending', 'confirmed'] }
      };
      
      const matchingBookings = await BookingModel.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('service', 'name')
        .lean();
      
      console.log(`Bookings that would appear in therapist dashboard: ${matchingBookings.length}`);
      
      matchingBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.service?.name} - ${booking.customer?.firstName} ${booking.customer?.lastName} - ${booking.date} ${booking.time} (${booking.status})`);
      });
    }
    
    console.log('\n=== Check Complete ===');
    
  } catch (error) {
    console.error('Error checking assigned bookings:', error);
  }
};

// Run the check
checkAssignedBookings();