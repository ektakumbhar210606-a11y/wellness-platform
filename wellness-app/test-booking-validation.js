const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Booking schema definition
const bookingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'therapist_confirmed', 'therapist_rejected', 'confirmed', 'paid', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    message: 'Status must be either pending, therapist_confirmed, therapist_rejected, confirmed, paid, completed, cancelled, no-show, or rescheduled'
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
  confirmedBy: String,
  confirmedAt: Date,
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

async function testBookingValidation() {
  try {
    console.log('=== TESTING BOOKING VALIDATION ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Test 1: Create a booking with 'paid' status
    console.log('1. Testing creation of booking with "paid" status:');
    const testBooking = new Booking({
      status: 'paid',
      confirmedBy: 'test-user-id',
      confirmedAt: new Date(),
      paymentStatus: 'completed'
    });
    
    try {
      await testBooking.save();
      console.log('✅ Booking with "paid" status created successfully');
      console.log(`   Booking ID: ${testBooking._id}`);
      console.log(`   Status: ${testBooking.status}`);
      console.log(`   Payment Status: ${testBooking.paymentStatus}`);
      
      // Test 2: Update existing booking to 'paid' status
      console.log('\n2. Testing update of booking to "paid" status:');
      testBooking.status = 'paid';
      testBooking.paymentStatus = 'completed';
      await testBooking.save();
      console.log('✅ Booking updated to "paid" status successfully');
      console.log(`   Updated Status: ${testBooking.status}`);
      console.log(`   Updated Payment Status: ${testBooking.paymentStatus}`);
      
      // Clean up
      await Booking.findByIdAndDelete(testBooking._id);
      console.log('✅ Test booking cleaned up');
      
    } catch (error) {
      console.log('❌ Error creating/updating booking with "paid" status:');
      console.log('   Error message:', error.message);
      console.log('   Error name:', error.name);
      if (error.errors) {
        console.log('   Validation errors:');
        Object.keys(error.errors).forEach(key => {
          console.log(`     ${key}: ${error.errors[key].message}`);
        });
      }
    }
    
    // Test 3: Check if 'paid' is in the enum values
    console.log('\n3. Checking enum validation:');
    const schemaPath = Booking.schema.path('status');
    console.log('   Allowed status values:', schemaPath.enumValues);
    console.log('   "paid" in enum values:', schemaPath.enumValues.includes('paid'));
    
    console.log('\n=== VALIDATION TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error during validation test:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testBookingValidation();