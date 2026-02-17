// Diagnostic script to check current booking state and visibility logic
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
  }
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
    console.log('Diagnosing booking visibility issue...\n');
    
    // Find recent bookings to analyze
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status assignedByAdmin responseVisibleToBusinessOnly therapistResponded createdAt');
    
    console.log('=== RECENT BOOKINGS ANALYSIS ===\n');
    
    if (recentBookings.length === 0) {
      console.log('No bookings found in database');
      return;
    }
    
    recentBookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`  ID: ${booking._id}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Assigned by Admin: ${booking.assignedByAdmin}`);
      console.log(`  Response Visible to Business Only: ${booking.responseVisibleToBusinessOnly}`);
      console.log(`  Therapist Responded: ${booking.therapistResponded}`);
      console.log(`  Created: ${booking.createdAt}`);
      console.log('');
      
      // Check if this booking would be visible to customer
      const isVisibleToCustomer = !booking.responseVisibleToBusinessOnly;
      const displayStatus = isVisibleToCustomer ? booking.status : 'pending';
      const statusTag = isVisibleToCustomer ? '✅ VISIBLE' : '❌ HIDDEN';
      
      console.log(`  Customer View: ${statusTag} (shows as "${displayStatus}")`);
      console.log(`  Should be in Confirmed tab: ${isVisibleToCustomer && booking.status === 'confirmed' ? 'YES' : 'NO'}`);
      console.log('');
    });
    
    // Test the filtering logic that customer dashboard uses
    console.log('=== CUSTOMER DASHBOARD FILTERING LOGIC TEST ===\n');
    
    const testBookings = [
      { status: 'pending', responseVisibleToBusinessOnly: false, description: 'Normal pending booking' },
      { status: 'confirmed', responseVisibleToBusinessOnly: false, description: 'Confirmed by business/customer' },
      { status: 'confirmed', responseVisibleToBusinessOnly: true, description: 'Confirmed by therapist (should be hidden)' },
      { status: 'cancelled', responseVisibleToBusinessOnly: true, description: 'Cancelled by therapist (should be hidden)' },
      { status: 'rescheduled', responseVisibleToBusinessOnly: true, description: 'Rescheduled by therapist (should be hidden)' }
    ];
    
    console.log('Booking Requests Filter (should show pending + hidden confirmed):');
    testBookings.forEach(booking => {
      const shouldShow = booking.responseVisibleToBusinessOnly || booking.status !== 'confirmed';
      console.log(`  ${booking.description}: ${shouldShow ? '✅ SHOW' : '❌ HIDE'}`);
    });
    
    console.log('\nConfirmed Bookings Filter (should only show visible confirmed):');
    testBookings.forEach(booking => {
      const shouldShow = booking.status === 'confirmed' && !booking.responseVisibleToBusinessOnly;
      console.log(`  ${booking.description}: ${shouldShow ? '✅ SHOW' : '❌ HIDE'}`);
    });
    
    console.log('\n=== POTENTIAL ISSUE AREAS ===');
    console.log('1. Check if responseVisibleToBusinessOnly is being set correctly in therapist routes');
    console.log('2. Verify customer dashboard is using the updated filtering logic');
    console.log('3. Ensure no other routes are bypassing the visibility logic');
    console.log('4. Confirm business processing routes are setting responseVisibleToBusinessOnly = false');
    
  } catch (error) {
    console.error('Error diagnosing booking visibility:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the diagnosis
diagnoseBookingVisibility();