// Fresh diagnostic to identify the root cause of therapist response visibility issue
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Booking schema definition
const bookingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled']
  },
  assignedByAdmin: {
    type: Boolean,
    default: false
  },
  responseVisibleToBusinessOnly: {
    type: Boolean,
    default: false
  },
  therapistResponded: {
    type: Boolean,
    default: false
  },
  confirmedBy: {
    type: String
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

async function freshDiagnosticInvestigation() {
  try {
    console.log('=== FRESH DIAGNOSTIC INVESTIGATION ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // 1. Check current problematic bookings
    console.log('1. IDENTIFYING CURRENT PROBLEMATIC BOOKINGS:');
    console.log('============================================');
    
    // Find all business-assigned bookings that are confirmed and visible to customers
    const problematicBookings = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed',
      responseVisibleToBusinessOnly: false,
      therapistResponded: true
    }).select('_id status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy confirmedAt createdAt');
    
    console.log(`Found ${problematicBookings.length} problematic bookings:`);
    if (problematicBookings.length > 0) {
      problematicBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking._id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Assigned by Admin: ${booking.assignedByAdmin}`);
        console.log(`   Response Visible to Business Only: ${booking.responseVisibleToBusinessOnly}`);
        console.log(`   Therapist Responded: ${booking.therapistResponded}`);
        console.log(`   Confirmed By: ${booking.confirmedBy}`);
        console.log(`   Confirmed At: ${booking.confirmedAt}`);
        console.log(`   Created At: ${booking.createdAt}`);
      });
    } else {
      console.log('No problematic bookings found currently.');
    }
    
    // 2. Check recent booking creation flow
    console.log('\n\n2. ANALYZING RECENT BOOKING CREATION FLOW:');
    console.log('==========================================');
    
    // Get recent bookings to understand the flow
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy createdAt');
    
    console.log('Recent bookings and their state:');
    recentBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. ID: ${booking._id}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`   Response Visible: ${!booking.responseVisibleToBusinessOnly ? '✅ CUSTOMER' : '❌ BUSINESS ONLY'}`);
      console.log(`   Therapist Responded: ${booking.therapistResponded}`);
      console.log(`   Confirmed By: ${booking.confirmedBy || 'Not confirmed'}`);
      if (booking.confirmedBy) {
        const isTherapist = booking.confirmedBy !== booking.customer?.toString();
        console.log(`   Confirmation Source: ${isTherapist ? '🚨 THERAPIST' : '✅ CUSTOMER/BUSINESS'}`);
      }
    });
    
    // 3. Test the actual workflow step by step
    console.log('\n\n3. TESTING WORKFLOW STEP BY STEP:');
    console.log('=================================');
    
    // Create a fresh test booking
    const testBooking = new Booking({
      status: 'pending',
      assignedByAdmin: true,
      responseVisibleToBusinessOnly: false,
      therapistResponded: false,
      createdAt: new Date()
    });
    
    await testBooking.save();
    console.log(`✅ Created fresh test booking: ${testBooking._id}`);
    console.log(`   Initial State: responseVisibleToBusinessOnly = ${testBooking.responseVisibleToBusinessOnly}`);
    
    // Simulate what happens when therapist confirms
    console.log('\n   Simulating therapist confirmation...');
    testBooking.status = 'confirmed';
    testBooking.therapistResponded = true;
    testBooking.responseVisibleToBusinessOnly = true; // This should be set by therapist route
    testBooking.confirmedBy = 'therapist-test-id';
    testBooking.confirmedAt = new Date();
    await testBooking.save();
    
    console.log(`   After therapist confirmation:`);
    console.log(`   Status: ${testBooking.status}`);
    console.log(`   Therapist Responded: ${testBooking.therapistResponded}`);
    console.log(`   Response Visible: ${!testBooking.responseVisibleToBusinessOnly ? '✅ CUSTOMER' : '❌ BUSINESS ONLY'}`);
    console.log(`   Should be visible to customer: ${!testBooking.responseVisibleToBusinessOnly ? 'YES' : 'NO'}`);
    
    // Test customer dashboard filtering logic
    console.log('\n   Testing customer dashboard filtering logic:');
    const isVisibleToCustomer = !testBooking.responseVisibleToBusinessOnly;
    const customerStatus = isVisibleToCustomer ? testBooking.status : 'pending';
    const inConfirmedTab = isVisibleToCustomer && testBooking.status === 'confirmed';
    
    console.log(`   Customer sees status as: "${customerStatus}"`);
    console.log(`   Appears in Confirmed tab: ${inConfirmedTab ? 'YES' : 'NO'}`);
    
    // Clean up
    await Booking.findByIdAndDelete(testBooking._id);
    console.log(`\n✅ Test booking cleaned up`);
    
    // 4. Check for any remaining problematic patterns
    console.log('\n\n4. CHECKING FOR PERSISTENT PATTERNS:');
    console.log('====================================');
    
    const totalBusinessBookings = await Booking.countDocuments({ assignedByAdmin: true });
    const therapistConfirmedBusiness = await Booking.countDocuments({ 
      assignedByAdmin: true, 
      therapistResponded: true,
      responseVisibleToBusinessOnly: false
    });
    const businessConfirmedBusiness = await Booking.countDocuments({ 
      assignedByAdmin: true, 
      therapistResponded: true,
      responseVisibleToBusinessOnly: false,
      confirmedBy: { $exists: true }
    });
    
    console.log(`Total business-assigned bookings: ${totalBusinessBookings}`);
    console.log(`Business-assigned bookings with therapist response BUT visible to customers: ${therapistConfirmedBusiness}`);
    console.log(`Business-assigned bookings with confirmedBy field: ${businessConfirmedBusiness}`);
    
    if (therapistConfirmedBusiness > 0) {
      console.log('\n🚨 CRITICAL: Found bookings that were therapist-confirmed but are still visible to customers!');
      console.log('This indicates the therapist confirmation route is NOT setting responseVisibleToBusinessOnly correctly.');
    }
    
    console.log('\n=== INVESTIGATION COMPLETE ===');
    console.log('Next steps:');
    console.log('1. If problematic bookings exist, investigate what process is setting responseVisibleToBusinessOnly = false');
    console.log('2. Verify therapist confirmation route logic');
    console.log('3. Check for any background processes that might be modifying bookings');
    console.log('4. Review all confirmation endpoints for proper visibility logic');
    
  } catch (error) {
    console.error('❌ Error during fresh diagnostic:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the fresh diagnostic
freshDiagnosticInvestigation();