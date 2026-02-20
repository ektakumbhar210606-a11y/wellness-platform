/**
 * Test script to verify the automatic cancellation fix
 * This script verifies that only unpaid bookings (paymentStatus: 'pending') are cancelled
 * while paid and completed bookings are protected from automatic cancellation
 */

import { connectToDatabase } from './lib/db.js';
import BookingModel, { BookingStatus } from './models/Booking.js';
import { cancelExpiredBookings } from './utils/cancelExpiredBookings.js';
import mongoose from 'mongoose';

async function runTest() {
  try {
    console.log('=== TESTING AUTOMATIC CANCELLATION FIX ===\n');
    
    await connectToDatabase();
    console.log('✓ Database connected successfully\n');

    // Create test bookings with various statuses and payment statuses
    const now = new Date();
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    console.log('1. Creating test bookings...');

    // Unpaid pending booking (should be cancelled)
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

    // Paid confirmed booking (should NOT be cancelled)
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

    // Partially paid booking (should NOT be cancelled)
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

    // Completed booking (should NOT be cancelled)
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

    // Future unpaid booking (should NOT be cancelled - not expired)
    const futureBooking = new BookingModel({
      customer: new mongoose.Types.ObjectId(),
      therapist: new mongoose.Types.ObjectId(),
      service: new mongoose.Types.ObjectId(),
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days in future
      time: '14:00',
      status: BookingStatus.Pending,
      paymentStatus: 'pending',
      createdAt: new Date()
    });

    // Save all test bookings
    await Promise.all([
      unpaidPendingBooking.save(),
      paidConfirmedBooking.save(),
      partialPaymentBooking.save(),
      completedBooking.save(),
      futureBooking.save()
    ]);

    console.log('✅ Created 5 test bookings:');
    console.log(`   Unpaid pending: status=${unpaidPendingBooking.status}, payment=${unpaidPendingBooking.paymentStatus}`);
    console.log(`   Paid confirmed: status=${paidConfirmedBooking.status}, payment=${paidConfirmedBooking.paymentStatus}`);
    console.log(`   Partial payment: status=${partialPaymentBooking.status}, payment=${partialPaymentBooking.paymentStatus}`);
    console.log(`   Completed: status=${completedBooking.status}, payment=${completedBooking.paymentStatus}`);
    console.log(`   Future: status=${futureBooking.status}, payment=${futureBooking.paymentStatus}\n`);

    // Run the cancellation function
    console.log('2. Running automatic cancellation...');
    const result = await cancelExpiredBookings();
    console.log(`✅ Cancellation result: ${result.cancelledCount} bookings cancelled\n`);

    // Verify final states
    console.log('3. Verifying final booking states:');

    const updatedUnpaidPending = await BookingModel.findById(unpaidPendingBooking._id);
    const updatedPaidConfirmed = await BookingModel.findById(paidConfirmedBooking._id);
    const updatedPartialPayment = await BookingModel.findById(partialPaymentBooking._id);
    const updatedCompleted = await BookingModel.findById(completedBooking._id);
    const updatedFuture = await BookingModel.findById(futureBooking._id);

    console.log(`   Unpaid pending: status=${updatedUnpaidPending.status} (expected: cancelled)`);
    console.log(`   Paid confirmed: status=${updatedPaidConfirmed.status} (expected: confirmed)`);
    console.log(`   Partial payment: status=${updatedPartialPayment.status} (expected: confirmed)`);
    console.log(`   Completed: status=${updatedCompleted.status} (expected: completed)`);
    console.log(`   Future: status=${updatedFuture.status} (expected: pending)\n`);

    // Test results
    const tests = [
      {
        name: 'Unpaid pending booking gets cancelled',
        condition: updatedUnpaidPending.status === 'cancelled',
        expected: 'cancelled',
        actual: updatedUnpaidPending.status
      },
      {
        name: 'Paid confirmed booking is protected',
        condition: updatedPaidConfirmed.status !== 'cancelled',
        expected: 'not cancelled',
        actual: updatedPaidConfirmed.status
      },
      {
        name: 'Partial payment booking is protected',
        condition: updatedPartialPayment.status !== 'cancelled',
        expected: 'not cancelled',
        actual: updatedPartialPayment.status
      },
      {
        name: 'Completed booking is protected',
        condition: updatedCompleted.status !== 'cancelled',
        expected: 'not cancelled',
        actual: updatedCompleted.status
      },
      {
        name: 'Future booking is not affected (not expired)',
        condition: updatedFuture.status === 'pending',
        expected: 'pending',
        actual: updatedFuture.status
      },
      {
        name: 'Exactly 1 booking was cancelled',
        condition: result.cancelledCount === 1,
        expected: 1,
        actual: result.cancelledCount
      }
    ];

    console.log('4. Test Results:');
    let passedTests = 0;
    tests.forEach(test => {
      const status = test.condition ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status}: ${test.name} (expected: ${test.expected}, actual: ${test.actual})`);
      if (test.condition) passedTests++;
    });

    console.log(`\n=== TEST SUMMARY: ${passedTests}/${tests.length} tests passed ===`);

    if (passedTests === tests.length) {
      console.log('🎉 All tests passed! The fix is working correctly.');
      console.log('✅ Unpaid/pending bookings are being cancelled automatically when expired');
      console.log('✅ Paid bookings are protected from automatic cancellation when expired');
      console.log('✅ Completed bookings are protected from automatic cancellation when expired');
    } else {
      console.log('❌ Some tests failed. Please review the implementation.');
    }

    // Cleanup
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
    console.log('\n✅ Test data cleaned up successfully.');

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

// Run the test
runTest();