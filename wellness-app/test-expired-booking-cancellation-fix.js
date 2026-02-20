import mongoose from 'mongoose';
import { cancelExpiredBookings } from './utils/cancelExpiredBookings.js';
import BookingModel, { BookingStatus } from './models/Booking.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testCancellationFix() {
  try {
    console.log('=== TESTING EXPIRED BOOKING CANCELLATION FIX ===\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Create test bookings with different statuses
    console.log('1. Creating test bookings...');
    
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    pastDate.setHours(10, 0, 0, 0); // Set to 10:00 AM yesterday
    
    // Test booking 1: Unpaid pending booking (should be cancelled)
    const unpaidPendingBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: pastDate,
      time: '10:00',
      status: BookingStatus.Pending,
      paymentStatus: 'pending',
      createdAt: new Date()
    });
    await unpaidPendingBooking.save();
    console.log(`✅ Created unpaid pending booking: ${unpaidPendingBooking._id}`);
    
    // Test booking 2: Paid confirmed booking (should NOT be cancelled)
    const paidConfirmedBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: pastDate,
      time: '11:00',
      status: BookingStatus.Confirmed,
      paymentStatus: 'completed',
      createdAt: new Date()
    });
    await paidConfirmedBooking.save();
    console.log(`✅ Created paid confirmed booking: ${paidConfirmedBooking._id}`);
    
    // Test booking 3: Partial payment confirmed booking (should NOT be cancelled)
    const partialPaymentBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: pastDate,
      time: '12:00',
      status: BookingStatus.Confirmed,
      paymentStatus: 'partial',
      createdAt: new Date()
    });
    await partialPaymentBooking.save();
    console.log(`✅ Created partial payment booking: ${partialPaymentBooking._id}`);
    
    // Test booking 4: Completed booking (should NOT be cancelled)
    const completedBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: pastDate,
      time: '13:00',
      status: BookingStatus.Completed,
      paymentStatus: 'completed',
      createdAt: new Date()
    });
    await completedBooking.save();
    console.log(`✅ Created completed booking: ${completedBooking._id}`);
    
    // Test booking 5: Future unpaid booking (should NOT be cancelled)
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const futureBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: futureDate,
      time: '14:00',
      status: BookingStatus.Pending,
      paymentStatus: 'pending',
      createdAt: new Date()
    });
    await futureBooking.save();
    console.log(`✅ Created future unpaid booking: ${futureBooking._id}\n`);
    
    // Verify initial states
    console.log('2. Verifying initial booking states:');
    console.log(`   Unpaid pending: status=${unpaidPendingBooking.status}, payment=${unpaidPendingBooking.paymentStatus}`);
    console.log(`   Paid confirmed: status=${paidConfirmedBooking.status}, payment=${paidConfirmedBooking.paymentStatus}`);
    console.log(`   Partial payment: status=${partialPaymentBooking.status}, payment=${partialPaymentBooking.paymentStatus}`);
    console.log(`   Completed: status=${completedBooking.status}, payment=${completedBooking.paymentStatus}`);
    console.log(`   Future: status=${futureBooking.status}, payment=${futureBooking.paymentStatus}\n`);
    
    // Run the cancellation function
    console.log('3. Running automatic cancellation...');
    const result = await cancelExpiredBookings();
    console.log(`✅ Cancellation result: ${result.cancelledCount} bookings cancelled\n`);
    
    // Verify final states
    console.log('4. Verifying final booking states:');
    
    const updatedUnpaidPending = await BookingModel.findById(unpaidPendingBooking._id);
    const updatedPaidConfirmed = await BookingModel.findById(paidConfirmedBooking._id);
    const updatedPartialPayment = await BookingModel.findById(partialPaymentBooking._id);
    const updatedCompleted = await BookingModel.findById(completedBooking._id);
    const updatedFuture = await BookingModel.findById(futureBooking._id);
    
    console.log(`   Unpaid pending: status=${updatedUnpaidPending.status} ${updatedUnpaidPending.status === 'cancelled' ? '✅ CORRECTLY CANCELLED' : '❌ INCORRECTLY KEPT'}`);
    console.log(`   Paid confirmed: status=${updatedPaidConfirmed.status} ${updatedPaidConfirmed.status !== 'cancelled' ? '✅ CORRECTLY KEPT' : '❌ INCORRECTLY CANCELLED'}`);
    console.log(`   Partial payment: status=${updatedPartialPayment.status} ${updatedPartialPayment.status !== 'cancelled' ? '✅ CORRECTLY KEPT' : '❌ INCORRECTLY CANCELLED'}`);
    console.log(`   Completed: status=${updatedCompleted.status} ${updatedCompleted.status !== 'cancelled' ? '✅ CORRECTLY KEPT' : '❌ INCORRECTLY CANCELLED'}`);
    console.log(`   Future: status=${updatedFuture.status} ${updatedFuture.status !== 'cancelled' ? '✅ CORRECTLY KEPT' : '❌ INCORRECTLY CANCELLED'}`);
    
    // Test results summary
    console.log('\n5. Test Results Summary:');
    const tests = [
      { name: 'Unpaid pending booking', expected: 'cancelled', actual: updatedUnpaidPending.status },
      { name: 'Paid confirmed booking', expected: 'not cancelled', actual: updatedPaidConfirmed.status !== 'cancelled' ? 'not cancelled' : 'cancelled' },
      { name: 'Partial payment booking', expected: 'not cancelled', actual: updatedPartialPayment.status !== 'cancelled' ? 'not cancelled' : 'cancelled' },
      { name: 'Completed booking', expected: 'not cancelled', actual: updatedCompleted.status !== 'cancelled' ? 'not cancelled' : 'cancelled' },
      { name: 'Future unpaid booking', expected: 'not cancelled', actual: updatedFuture.status !== 'cancelled' ? 'not cancelled' : 'cancelled' }
    ];
    
    let passedTests = 0;
    tests.forEach(test => {
      const passed = test.expected === (test.actual === 'cancelled' ? 'cancelled' : 'not cancelled');
      console.log(`   ${test.name}: ${passed ? '✅ PASS' : '❌ FAIL'} (expected: ${test.expected}, got: ${test.actual})`);
      if (passed) passedTests++;
    });
    
    console.log(`\n=== TEST SUMMARY: ${passedTests}/${tests.length} tests passed ===`);
    
    if (passedTests === tests.length) {
      console.log('🎉 All tests passed! The fix is working correctly.');
      console.log('✅ Unpaid/pending bookings are being cancelled automatically');
      console.log('✅ Paid bookings are protected from automatic cancellation');
      console.log('✅ Completed bookings are protected from automatic cancellation');
    } else {
      console.log('❌ Some tests failed. Please review the implementation.');
    }
    
    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await BookingModel.deleteMany({
      _id: {
        $in: [
          unpaidPendingBooking._id,
          paidConfirmedBooking._id,
          partialPaymentBooking._id,
          completedBooking._id,
          futureBooking._id
        ]
      }
    });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  }
}

// Run the test
testCancellationFix();