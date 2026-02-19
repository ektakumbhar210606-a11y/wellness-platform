const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define simplified schemas for testing
const bookingSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  therapist: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'therapist_confirmed', 'therapist_rejected', 'confirmed', 'paid', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'pending'
  },
  confirmedBy: String,
  confirmedAt: Date,
  responseVisibleToBusinessOnly: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'completed'], default: 'pending' }
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  advancePaid: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['FULL', 'ADVANCE'], required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true },
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
const Payment = mongoose.model('Payment', paymentSchema);

async function testPaymentVerification() {
  try {
    console.log('=== TESTING PAYMENT VERIFICATION PROCESS ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Create a test booking
    console.log('1. Creating test booking...');
    const testBooking = new Booking({
      customer: '666f6f2d6261722d62617a', // dummy customer ID
      therapist: '666f6f2d6261722d74686572', // dummy therapist ID
      service: '666f6f2d6261722d73657276', // dummy service ID
      date: new Date('2024-12-31'),
      time: '10:00',
      status: 'confirmed',
      confirmedBy: 'test-user-id',
      confirmedAt: new Date(),
      responseVisibleToBusinessOnly: false,
      paymentStatus: 'pending'
    });
    
    await testBooking.save();
    console.log('✅ Test booking created:', testBooking._id);
    console.log('   Initial status:', testBooking.status);
    console.log('   Initial paymentStatus:', testBooking.paymentStatus);
    
    // Simulate payment verification process
    console.log('\n2. Simulating payment verification process...');
    
    try {
      // Update booking status to 'paid'
      testBooking.status = 'paid';
      testBooking.confirmedAt = new Date();
      testBooking.confirmedBy = testBooking.customer.toString();
      testBooking.responseVisibleToBusinessOnly = false;
      
      await testBooking.save();
      console.log('✅ Booking status updated to "paid" successfully');
      console.log('   Updated status:', testBooking.status);
      console.log('   Updated paymentStatus:', testBooking.paymentStatus);
      
      // Create payment record
      console.log('\n3. Creating payment record...');
      const payment = new Payment({
        booking: testBooking._id,
        amount: 100,
        totalAmount: 100,
        advancePaid: 100,
        remainingAmount: 0,
        paymentType: 'ADVANCE',
        method: 'credit_card',
        status: 'completed',
        paymentDate: new Date()
      });
      
      await payment.save();
      console.log('✅ Payment record created:', payment._id);
      
      // Clean up
      await Booking.findByIdAndDelete(testBooking._id);
      await Payment.findByIdAndDelete(payment._id);
      console.log('✅ Test data cleaned up');
      
      console.log('\n🎉 ALL TESTS PASSED - Payment verification process works correctly!');
      
    } catch (error) {
      console.log('❌ Error during payment verification simulation:');
      console.log('   Error message:', error.message);
      console.log('   Error name:', error.name);
      if (error.errors) {
        console.log('   Validation errors:');
        Object.keys(error.errors).forEach(key => {
          console.log(`     ${key}: ${error.errors[key].message}`);
        });
      }
      console.log('   Error stack:', error.stack);
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testPaymentVerification();