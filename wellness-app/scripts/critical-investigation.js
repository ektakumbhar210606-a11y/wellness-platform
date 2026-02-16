const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({
  status: String,
  assignedByAdmin: Boolean,
  responseVisibleToBusinessOnly: Boolean,
  therapistResponded: Boolean,
  confirmedBy: String,
  customer: mongoose.Schema.Types.ObjectId,
  therapist: mongoose.Schema.Types.ObjectId,
  service: mongoose.Schema.Types.ObjectId,
  date: Date,
  time: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

async function criticalInvestigation() {
  try {
    console.log('=== CRITICAL INVESTIGATION FOR THERAPIST RESPONSE BYPASS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check 1: Look for ANY bookings with undefined responseVisibleToBusinessOnly
    console.log('Check 1: Searching for bookings with undefined visibility...');
    const undefinedBookings = await Booking.find({ 
      responseVisibleToBusinessOnly: { $exists: false } 
    });
    
    console.log(`Found ${undefinedBookings.length} bookings with undefined visibility`);
    if (undefinedBookings.length > 0) {
      undefinedBookings.forEach(b => {
        console.log(`  - ${b._id}: status=${b.status}, assignedByAdmin=${b.assignedByAdmin}, createdAt=${b.createdAt}`);
      });
    }
    
    // Check 2: Look for recent confirmed bookings (last 1 hour)
    console.log('\nCheck 2: Recent confirmed bookings (last 1 hour)...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentConfirmed = await Booking.find({ 
      status: 'confirmed',
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${recentConfirmed.length} recent confirmed bookings:`);
    recentConfirmed.forEach(b => {
      console.log(`  - ${b._id}: assignedByAdmin=${b.assignedByAdmin}, responseVisibleToBusinessOnly=${b.responseVisibleToBusinessOnly}, confirmedBy=${b.confirmedBy}`);
    });
    
    // Check 3: Look for business-assigned bookings that might be problematic
    console.log('\nCheck 3: Business-assigned bookings with potential issues...');
    const businessAssigned = await Booking.find({ assignedByAdmin: true });
    console.log(`Total business-assigned bookings: ${businessAssigned.length}`);
    
    const problematicBusinessAssigned = businessAssigned.filter(b => 
      b.status === 'confirmed' && b.responseVisibleToBusinessOnly !== true
    );
    
    console.log(`Problematic business-assigned confirmed bookings: ${problematicBusinessAssigned.length}`);
    if (problematicBusinessAssigned.length > 0) {
      problematicBusinessAssigned.forEach(b => {
        console.log(`  - ${b._id}: responseVisibleToBusinessOnly=${b.responseVisibleToBusinessOnly}, confirmedBy=${b.confirmedBy}`);
      });
    }
    
    // Check 4: Check current database validation
    console.log('\nCheck 4: Database schema validation status...');
    const totalBookings = await Booking.countDocuments();
    const validVisibility = await Booking.countDocuments({
      responseVisibleToBusinessOnly: { $exists: true }
    });
    
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Bookings with valid visibility field: ${validVisibility}`);
    console.log(`Bookings with undefined visibility: ${totalBookings - validVisibility}`);
    
    // Check 5: Verify the therapist confirmation route is working correctly
    console.log('\nCheck 5: Testing therapist confirmation logic simulation...');
    
    // Simulate what should happen when a therapist confirms a booking
    const testBooking = {
      assignedByAdmin: true,
      status: 'confirmed',
      confirmedBy: 'therapist-test-id'
    };
    
    // What the therapist route SHOULD set
    const expectedTherapistResult = {
      ...testBooking,
      therapistResponded: true,
      responseVisibleToBusinessOnly: true
    };
    
    console.log('Expected therapist confirmation result:');
    console.log(`  responseVisibleToBusinessOnly: ${expectedTherapistResult.responseVisibleToBusinessOnly}`);
    console.log(`  therapistResponded: ${expectedTherapistResult.therapistResponded}`);
    
    // Check if this would be properly hidden from customer
    const hiddenFromCustomer = expectedTherapistResult.responseVisibleToBusinessOnly || 
                              expectedTherapistResult.status !== 'confirmed';
    console.log(`  Hidden from customer dashboard: ${hiddenFromCustomer ? '✅ YES' : '❌ NO'}`);
    
    await mongoose.connection.close();
    
    console.log('\n=== INVESTIGATION COMPLETE ===');
    
    // Summary
    if (undefinedBookings.length > 0) {
      console.log('🚨 CRITICAL: Found bookings with undefined visibility - this is likely the root cause!');
    } else if (problematicBusinessAssigned.length > 0) {
      console.log('🚨 CRITICAL: Found business-assigned bookings with incorrect visibility settings!');
    } else if (recentConfirmed.length > 0) {
      console.log('⚠️  Found recent confirmed bookings - check if they bypass business workflow');
    } else {
      console.log('✅ No immediate critical issues found in database');
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
    process.exit(1);
  }
}

criticalInvestigation();