// Debug script to trace booking visibility issues
const debugBookingVisibility = async () => {
  const { connectToDatabase } = await import('./lib/db.ts');
  const BookingModel = (await import('./models/Booking')).default;
  const ServiceModel = (await import('./models/Service')).default;
  const BusinessModel = (await import('./models/Business')).default;
  const UserModel = (await import('./models/User')).default;

  try {
    await connectToDatabase();
    console.log('=== Debugging Booking Visibility Issue ===\n');

    // Get all bookings to understand the current state
    const allBookings = await BookingModel.find({})
      .populate('service')
      .populate('customer')
      .populate('therapist')
      .lean();

    console.log(`Total bookings in system: ${allBookings.length}`);

    if (allBookings.length > 0) {
      console.log('\nAll bookings:');
      allBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Service: ${booking.service?.name || 'N/A'} | Customer: ${booking.customer?.name || 'N/A'} | Status: ${booking.status} | Assigned: ${!!booking.assignedByAdmin} | Therapist: ${booking.therapist?.fullName || 'None'}`);
      });

      // Group by status
      const byStatus = {};
      allBookings.forEach(booking => {
        const status = booking.status || 'unknown';
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(booking);
      });

      console.log('\nBookings by status:');
      Object.keys(byStatus).forEach(status => {
        console.log(`  ${status}: ${byStatus[status].length} bookings`);
      });

      // Group by assignment status
      const assignedBookings = allBookings.filter(b => b.assignedByAdmin);
      const unassignedBookings = allBookings.filter(b => !b.assignedByAdmin);
      console.log(`\nAssigned bookings: ${assignedBookings.length}`);
      console.log(`Unassigned bookings: ${unassignedBookings.length}`);

      if (assignedBookings.length > 0) {
        console.log('\nAssigned bookings details:');
        assignedBookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. Service: ${booking.service?.name || 'N/A'} | Customer: ${booking.customer?.name || 'N/A'} | Status: ${booking.status} | Therapist: ${booking.therapist?.fullName || 'None'}`);
        });
      }
    } else {
      console.log('No bookings found in the database.');
    }

    // Get all services to understand business associations
    const allServices = await ServiceModel.find({}).populate('business').lean();
    console.log(`\nTotal services: ${allServices.length}`);
    
    if (allServices.length > 0) {
      console.log('\nServices and their businesses:');
      allServices.forEach((service, index) => {
        console.log(`  ${index + 1}. Service: ${service.name} | Business: ${service.business?.name || service.business?._id || 'N/A'}`);
      });
    }

    // Get all businesses
    const allBusinesses = await BusinessModel.find({}).populate('owner').lean();
    console.log(`\nTotal businesses: ${allBusinesses.length}`);
    
    if (allBusinesses.length > 0) {
      console.log('\nBusinesses:');
      allBusinesses.forEach((business, index) => {
        console.log(`  ${index + 1}. Business: ${business.name} | Owner: ${business.owner?.name || business.owner?.email || business.owner?._id || 'N/A'}`);
      });
    }

    console.log('\n=== Debug Complete ===');
    console.log('\nThis script helps understand the current state of bookings, services, and businesses in the database.');

  } catch (error) {
    console.error('Error during debugging:', error);
  }
};

debugBookingVisibility();