// Test script to simulate therapist confirmation and check visibility behavior
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

async function testTherapistConfirmation() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected to database');
    console.log('Testing therapist confirmation workflow...\n');
    
    // Create a test booking that simulates a business-assigned booking
    const testBooking = new Booking({
      status: 'pending',
      assignedByAdmin: true,
      responseVisibleToBusinessOnly: false,
      therapistResponded: false,
      createdAt: new Date()
    });
    
    await testBooking.save();
    console.log('Created test booking:');
    console.log(`  ID: ${testBooking._id}`);
    console.log(`  Status: ${testBooking.status}`);
    console.log(`  Assigned by Admin: ${testBooking.assignedByAdmin}`);
    console.log(`  Response Visible to Business Only: ${testBooking.responseVisibleToBusinessOnly}`);
    console.log('');
    
    // Simulate what happens when therapist confirms the booking
    // This should set responseVisibleToBusinessOnly to true
    console.log('=== SIMULATING THERAPIST CONFIRMATION ===');
    testBooking.status = 'confirmed';
    testBooking.therapistResponded = true;
    testBooking.responseVisibleToBusinessOnly = true; // This is what therapist routes should do
    
    await testBooking.save();
    
    console.log('After therapist confirmation:');
    console.log(`  Status: ${testBooking.status}`);
    console.log(`  Therapist Responded: ${testBooking.therapistResponded}`);
    console.log(`  Response Visible to Business Only: ${testBooking.responseVisibleToBusinessOnly}`);
    console.log('');
    
    // Simulate what the customer dashboard should see
    console.log('=== CUSTOMER DASHBOARD VIEW ===');
    const isVisibleToCustomer = !testBooking.responseVisibleToBusinessOnly;
    const displayStatus = isVisibleToCustomer ? testBooking.status : 'pending';
    const statusTag = isVisibleToCustomer ? '✅ VISIBLE' : '❌ HIDDEN';
    
    console.log(`Customer sees booking as: ${statusTag} (shows as "${displayStatus}")`);
    console.log(`Should be in Confirmed tab: ${isVisibleToCustomer && testBooking.status === 'confirmed' ? 'YES' : 'NO'}`);
    console.log('');
    
    // Simulate what happens when business processes the therapist response
    console.log('=== SIMULATING BUSINESS PROCESSING ===');
    testBooking.responseVisibleToBusinessOnly = false; // Business makes it visible to customer
    
    await testBooking.save();
    
    console.log('After business processing:');
    console.log(`  Status: ${testBooking.status}`);
    console.log(`  Response Visible to Business Only: ${testBooking.responseVisibleToBusinessOnly}`);
    console.log('');
    
    // Check final customer view
    const finalIsVisibleToCustomer = !testBooking.responseVisibleToBusinessOnly;
    const finalDisplayStatus = finalIsVisibleToCustomer ? testBooking.status : 'pending';
    const finalStatusTag = finalIsVisibleToCustomer ? '✅ VISIBLE' : '❌ HIDDEN';
    
    console.log('Final customer view:');
    console.log(`Customer sees booking as: ${finalStatusTag} (shows as "${finalDisplayStatus}")`);
    console.log(`Should be in Confirmed tab: ${finalIsVisibleToCustomer && testBooking.status === 'confirmed' ? 'YES' : 'NO'}`);
    console.log('');
    
    // Clean up test booking
    await Booking.findByIdAndDelete(testBooking._id);
    console.log('Test booking cleaned up.');
    
  } catch (error) {
    console.error('Error testing therapist confirmation:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the test
testTherapistConfirmation();