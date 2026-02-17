// Diagnostic script to check current booking visibility issues
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
  confirmedBy: String
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

async function diagnoseBookingVisibility() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to database');
    console.log('Diagnosing booking visibility issues...\n');
    
    // Check 1: Find all confirmed bookings with responseVisibleToBusinessOnly = false
    console.log('=== CHECK 1: Confirmed bookings visible to customers ===');
    const visibleConfirmedBookings = await Booking.find({
      status: 'confirmed',
      responseVisibleToBusinessOnly: false
    }).select('_id status assignedByAdmin therapistResponded confirmedBy createdAt');
    
    console.log(`Found ${visibleConfirmedBookings.length} confirmed bookings visible to customers:`);
    visibleConfirmedBookings.forEach(booking => {
      console.log(`  - ID: ${booking._id}`);
      console.log(`    Status: ${booking.status}`);
      console.log(`    Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`    Therapist Responded: ${booking.therapistResponded}`);
      console.log(`    Confirmed By: ${booking.confirmedBy || 'N/A'}`);
      console.log(`    Created: ${booking.createdAt}`);
      console.log('');
    });
    
    // Check 2: Find bookings with undefined responseVisibleToBusinessOnly
    console.log('=== CHECK 2: Bookings with undefined visibility flags ===');
    const undefinedVisibilityBookings = await Booking.find({
      responseVisibleToBusinessOnly: { $exists: false }
    }).select('_id status assignedByAdmin createdAt');
    
    console.log(`Found ${undefinedVisibilityBookings.length} bookings with undefined visibility:`);
    undefinedVisibilityBookings.forEach(booking => {
      console.log(`  - ID: ${booking._id}`);
      console.log(`    Status: ${booking.status}`);
      console.log(`    Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`    Created: ${booking.createdAt}`);
      console.log('');
    });
    
    // Check 3: Find recent bookings that might be bypassing the workflow
    console.log('=== CHECK 3: Recent confirmed bookings (last 24 hours) ===');
    const recentConfirmed = await Booking.find({
      status: 'confirmed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).select('_id status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy createdAt');
    
    console.log(`Found ${recentConfirmed.length} recent confirmed bookings:`);
    recentConfirmed.forEach(booking => {
      console.log(`  - ID: ${booking._id}`);
      console.log(`    Status: ${booking.status}`);
      console.log(`    Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`    Visible to Business Only: ${booking.responseVisibleToBusinessOnly}`);
      console.log(`    Therapist Responded: ${booking.therapistResponded}`);
      console.log(`    Confirmed By: ${booking.confirmedBy || 'N/A'}`);
      console.log(`    Created: ${booking.createdAt}`);
      console.log('');
    });
    
    // Check 4: Test the filtering logic that customer dashboard uses
    console.log('=== CHECK 4: Customer dashboard filtering simulation ===');
    
    // Get all bookings for a sample customer (or all bookings for analysis)
    const allBookings = await Booking.find({}).limit(20).select('_id status responseVisibleToBusinessOnly');
    
    console.log('Booking visibility simulation for customer dashboard:');
    allBookings.forEach(booking => {
      const isVisibleToCustomer = !booking.responseVisibleToBusinessOnly;
      const displayStatus = isVisibleToCustomer ? booking.status : 'pending';
      const inRequestsTab = booking.responseVisibleToBusinessOnly || booking.status !== 'confirmed';
      const inConfirmedTab = booking.status === 'confirmed' && !booking.responseVisibleToBusinessOnly;
      
      console.log(`  - ID: ${booking._id}`);
      console.log(`    Actual Status: ${booking.status}`);
      console.log(`    Visible to Customer: ${isVisibleToCustomer ? 'YES' : 'NO'}`);
      console.log(`    Display Status: "${displayStatus}"`);
      console.log(`    In Requests Tab: ${inRequestsTab ? 'YES' : 'NO'}`);
      console.log(`    In Confirmed Tab: ${inConfirmedTab ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    console.log('=== DIAGNOSIS COMPLETE ===');
    
    // Summary
    if (visibleConfirmedBookings.length > 0) {
      console.log('🚨 ISSUE: Found confirmed bookings that are visible to customers');
      console.log('   These should only be visible after business processing');
    }
    
    if (undefinedVisibilityBookings.length > 0) {
      console.log('🚨 ISSUE: Found bookings with undefined visibility flags');
      console.log('   These need to be corrected to ensure proper filtering');
    }
    
    if (recentConfirmed.length > 0) {
      console.log('⚠️  Found recent confirmed bookings - check if they follow proper workflow');
    }
    
    if (visibleConfirmedBookings.length === 0 && undefinedVisibilityBookings.length === 0) {
      console.log('✅ No immediate visibility issues found');
      console.log('   The system appears to be working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the diagnosis
diagnoseBookingVisibility();