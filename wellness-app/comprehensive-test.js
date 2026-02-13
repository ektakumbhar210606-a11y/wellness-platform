import mongoose from 'mongoose';

async function comprehensiveAssignmentTest() {
  try {
    console.log('=== Comprehensive Booking Assignment Test ===\n');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    await mongoose.connect(MONGODB_URI);
    
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
      fullName: String,
      associatedBusinesses: [{
        businessId: { type: mongoose.Schema.Types.ObjectId },
        status: String
      }]
    });
    
    const Therapist = mongoose.models.Therapist || mongoose.model('Therapist', therapistSchema);
    
    const businessSchema = new mongoose.Schema({
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String
    });
    
    const Business = mongoose.models.Business || mongoose.model('Business', businessSchema);
    
    // Step 1: Find a test booking (one that's not assigned)
    const testBooking = await Booking.findOne({ assignedByAdmin: false });
    if (!testBooking) {
      console.log('❌ No test booking found');
      await mongoose.connection.close();
      return;
    }
    
    console.log('1. Found test booking:', testBooking._id);
    console.log('   Current status:', testBooking.status);
    console.log('   Current therapist:', testBooking.therapist);
    console.log('   assignedByAdmin:', testBooking.assignedByAdmin);
    
    // Step 2: Find a test therapist
    const testTherapist = await Therapist.findOne({});
    if (!testTherapist) {
      console.log('❌ No test therapist found');
      await mongoose.connection.close();
      return;
    }
    
    console.log('2. Found test therapist:', testTherapist.fullName);
    console.log('   Therapist ID:', testTherapist._id);
    
    // Step 3: Find a test business
    const testBusiness = await Business.findOne({});
    if (!testBusiness) {
      console.log('❌ No test business found');
      await mongoose.connection.close();
      return;
    }
    
    console.log('3. Found test business:', testBusiness.name);
    console.log('   Business ID:', testBusiness._id);
    console.log('   Business owner:', testBusiness.owner);
    
    // Step 4: Associate therapist with business if not already
    const isAssociated = testTherapist.associatedBusinesses?.some(
      assoc => assoc.businessId.toString() === testBusiness._id.toString() && assoc.status === 'approved'
    );
    
    if (!isAssociated) {
      console.log('4. Associating therapist with business...');
      await Therapist.findByIdAndUpdate(testTherapist._id, {
        $addToSet: {
          associatedBusinesses: {
            businessId: testBusiness._id,
            status: 'approved'
          }
        }
      });
      console.log('   Association created');
    } else {
      console.log('4. Therapist already associated with business');
    }
    
    // Step 5: Simulate the assignment process
    console.log('\n5. Simulating assignment process...');
    const updatedBooking = await Booking.findByIdAndUpdate(
      testBooking._id,
      {
        therapist: testTherapist._id,
        status: 'pending', // This matches what the assign API does
        assignedByAdmin: true,
        assignedById: testBusiness.owner.toString()
      },
      { new: true }
    );
    
    console.log('   Updated booking:');
    console.log('   - therapist:', updatedBooking.therapist);
    console.log('   - status:', updatedBooking.status);
    console.log('   - assignedByAdmin:', updatedBooking.assignedByAdmin);
    console.log('   - assignedById:', updatedBooking.assignedById);
    
    // Step 6: Test the therapist dashboard query (this is what should find the booking)
    console.log('\n6. Testing therapist dashboard query...');
    const dashboardQuery = {
      therapist: testTherapist._id,
      assignedByAdmin: true,
      status: { $in: ['pending', 'confirmed'] }
    };
    
    const dashboardBookings = await Booking.find(dashboardQuery);
    console.log(`   Found ${dashboardBookings.length} bookings for therapist dashboard`);
    
    dashboardBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ${booking._id}`);
      console.log(`      - Status: ${booking.status}`);
      console.log(`      - Assigned by admin: ${booking.assignedByAdmin}`);
      console.log(`      - Assigned by ID: ${booking.assignedById}`);
    });
    
    // Step 7: Test the "by-therapist" API query (what the assignment modal uses)
    console.log('\n7. Testing by-therapist API query...');
    const serviceSchema = new mongoose.Schema({
      business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
      name: String
    });
    
    const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
    
    // Find services for this business
    const businessServices = await Service.find({ business: testBusiness._id }).select('_id');
    const serviceIds = businessServices.map(s => s._id);
    
    console.log('   Business services found:', serviceIds.length);
    
    const byTherapistQuery = {
      service: { $in: serviceIds },
      therapist: testTherapist._id,
      status: 'pending' // This is what the API uses
    };
    
    const byTherapistBookings = await Booking.find(byTherapistQuery);
    console.log(`   Found ${byTherapistBookings.length} bookings for by-therapist API`);
    
    byTherapistBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ${booking._id}`);
      console.log(`      - Status: ${booking.status}`);
      console.log(`      - Assigned by admin: ${booking.assignedByAdmin}`);
      console.log(`      - Service ID: ${booking.service}`);
    });
    
    // Step 8: Cleanup - reset the booking
    console.log('\n8. Cleaning up test data...');
    await Booking.findByIdAndUpdate(testBooking._id, {
      therapist: null,
      status: 'pending',
      assignedByAdmin: false,
      assignedById: null
    });
    
    // Remove the association if we created it
    if (!isAssociated) {
      await Therapist.findByIdAndUpdate(testTherapist._id, {
        $pull: {
          associatedBusinesses: {
            businessId: testBusiness._id
          }
        }
      });
    }
    
    console.log('   Test booking reset to original state');
    console.log('\n=== Test Complete ===');
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.connection.close();
  }
}

comprehensiveAssignmentTest();