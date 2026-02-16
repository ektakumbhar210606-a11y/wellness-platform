// Comprehensive diagnostic script to trace the entire booking workflow
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

async function comprehensiveWorkflowDiagnosis() {
  try {
    console.log('=== COMPREHENSIVE BOOKING WORKFLOW DIAGNOSIS ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // 1. Check current database state
    console.log('1. DATABASE STATE ANALYSIS:');
    console.log('==========================');
    
    const totalBookings = await Booking.countDocuments();
    const businessAssignedBookings = await Booking.countDocuments({ assignedByAdmin: true });
    const therapistRespondedBookings = await Booking.countDocuments({ therapistResponded: true });
    const businessOnlyVisible = await Booking.countDocuments({ responseVisibleToBusinessOnly: true });
    const customerVisible = await Booking.countDocuments({ responseVisibleToBusinessOnly: false });
    
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Business-assigned bookings: ${businessAssignedBookings}`);
    console.log(`Therapist responded bookings: ${therapistRespondedBookings}`);
    console.log(`Business-only visible: ${businessOnlyVisible}`);
    console.log(`Customer visible: ${customerVisible}`);
    console.log('');
    
    // 2. Analyze recent business-assigned bookings
    console.log('2. RECENT BUSINESS-ASSIGNED BOOKINGS:');
    console.log('=====================================');
    
    const recentBusinessBookings = await Booking.find({ assignedByAdmin: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy confirmedAt createdAt');
    
    if (recentBusinessBookings.length === 0) {
      console.log('No business-assigned bookings found');
      return;
    }
    
    recentBusinessBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`  ID: ${booking._id}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`  Response Visible to Business Only: ${booking.responseVisibleToBusinessOnly}`);
      console.log(`  Therapist Responded: ${booking.therapistResponded}`);
      console.log(`  Confirmed By: ${booking.confirmedBy || 'N/A'}`);
      console.log(`  Confirmed At: ${booking.confirmedAt || 'N/A'}`);
      console.log(`  Created: ${booking.createdAt}`);
      
      // Workflow analysis
      const isVisibleToCustomer = !booking.responseVisibleToBusinessOnly;
      const customerStatus = isVisibleToCustomer ? booking.status : 'pending';
      const shouldBeInConfirmedTab = isVisibleToCustomer && booking.status === 'confirmed';
      
      console.log(`  Customer View: ${isVisibleToCustomer ? '✅ VISIBLE' : '❌ HIDDEN'} (shows as "${customerStatus}")`);
      console.log(`  In Confirmed Tab: ${shouldBeInConfirmedTab ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // 3. Check for problematic patterns
    console.log('3. PROBLEMATIC PATTERNS ANALYSIS:');
    console.log('=================================');
    
    // Bookings that are business-assigned but visible to customers (should be hidden after therapist response)
    const problematicBookings = await Booking.find({
      assignedByAdmin: true,
      responseVisibleToBusinessOnly: false,
      therapistResponded: true
    }).select('status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy confirmedAt createdAt');
    
    console.log(`Business-assigned bookings with therapist response BUT visible to customers: ${problematicBookings.length}`);
    
    if (problematicBookings.length > 0) {
      console.log('\nProblematic bookings:');
      problematicBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking._id} - Status: ${booking.status} - Confirmed by: ${booking.confirmedBy}`);
      });
    }
    
    // 4. Test the filtering logic
    console.log('\n4. CUSTOMER DASHBOARD FILTERING LOGIC TEST:');
    console.log('==========================================');
    
    const testCases = [
      { 
        status: 'pending', 
        responseVisibleToBusinessOnly: false, 
        description: 'Normal pending booking' 
      },
      { 
        status: 'confirmed', 
        responseVisibleToBusinessOnly: false, 
        description: 'Confirmed by business/customer (should be visible)' 
      },
      { 
        status: 'confirmed', 
        responseVisibleToBusinessOnly: true, 
        description: 'Confirmed by therapist (should be HIDDEN)' 
      },
      { 
        status: 'cancelled', 
        responseVisibleToBusinessOnly: true, 
        description: 'Cancelled by therapist (should be HIDDEN)' 
      },
      { 
        status: 'rescheduled', 
        responseVisibleToBusinessOnly: true, 
        description: 'Rescheduled by therapist (should be HIDDEN)' 
      }
    ];
    
    console.log('Booking Requests Filter (should show pending + hidden confirmed):');
    testCases.forEach(testCase => {
      const shouldShow = testCase.responseVisibleToBusinessOnly || testCase.status !== 'confirmed';
      console.log(`  ${testCase.description}: ${shouldShow ? '✅ SHOW' : '❌ HIDE'}`);
    });
    
    console.log('\nConfirmed Bookings Filter (should only show visible confirmed):');
    testCases.forEach(testCase => {
      const shouldShow = testCase.status === 'confirmed' && !testCase.responseVisibleToBusinessOnly;
      console.log(`  ${testCase.description}: ${shouldShow ? '✅ SHOW' : '❌ HIDE'}`);
    });
    
    // 5. Check for bookings confirmed by therapists vs business
    console.log('\n5. CONFIRMATION SOURCE ANALYSIS:');
    console.log('===============================');
    
    const therapistConfirmed = await Booking.countDocuments({
      status: 'confirmed',
      confirmedBy: { $ne: null },
      therapistResponded: true
    });
    
    const businessConfirmed = await Booking.countDocuments({
      status: 'confirmed',
      confirmedBy: { $ne: null },
      therapistResponded: true,
      responseVisibleToBusinessOnly: false
    });
    
    console.log(`Total confirmed bookings with confirmedBy: ${therapistConfirmed}`);
    console.log(`Business-processed confirmed bookings: ${businessConfirmed}`);
    console.log(`Potentially therapist-confirmed visible bookings: ${therapistConfirmed - businessConfirmed}`);
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('Next steps:');
    console.log('1. Check if therapist confirmation routes are setting responseVisibleToBusinessOnly correctly');
    console.log('2. Verify customer dashboard is using the updated filtering logic');
    console.log('3. Ensure no other routes are bypassing the visibility logic');
    console.log('4. Confirm business processing routes are setting responseVisibleToBusinessOnly = false');
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the diagnosis
comprehensiveWorkflowDiagnosis();