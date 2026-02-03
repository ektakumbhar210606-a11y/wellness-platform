/**
 * Test script for the automatic expired booking cancellation system
 * Run this to verify the system is working correctly
 */

import { connectToDatabase } from '../lib/db';
import BookingModel, { BookingStatus } from '../models/Booking';
import { cancelExpiredBookings, isBookingExpired } from '../utils/cancelExpiredBookings';

async function runTests() {
  try {
    console.log('=== TESTING EXPIRED BOOKING CANCELLATION SYSTEM ===\n');
    
    await connectToDatabase();
    console.log('✓ Database connected successfully\n');

    // Test 1: Check the isBookingExpired helper function
    console.log('1. Testing isBookingExpired helper function:');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Test cases
    const testCases = [
      {
        name: 'Yesterday booking (should be expired)',
        booking: { date: yesterday, time: '10:00' },
        expected: true
      },
      {
        name: 'Tomorrow booking (should not be expired)',
        booking: { date: tomorrow, time: '10:00' },
        expected: false
      },
      {
        name: 'Today past time booking (should be expired)',
        booking: { date: now, time: '00:00' },
        expected: true
      },
      {
        name: 'Today future time booking (should not be expired)',
        booking: { date: now, time: '23:59' },
        expected: false
      }
    ];
    
    testCases.forEach((testCase, index) => {
      const result = isBookingExpired(testCase.booking as any, now);
      const passed = result === testCase.expected;
      console.log(`   ${index + 1}. ${testCase.name}: ${passed ? '✓ PASS' : '✗ FAIL'} (Expected: ${testCase.expected}, Got: ${result})`);
    });
    
    console.log('\n2. Testing actual cancellation process:');
    
    // Create test bookings
    console.log('   Creating test bookings...');
    
    // Clean up any existing test bookings
    await BookingModel.deleteMany({ 
      customer: 'test-customer-id',
      therapist: 'test-therapist-id',
      service: 'test-service-id'
    });
    
    // Create test bookings that should be cancelled
    const testBookings = [
      {
        customer: 'test-customer-id',
        therapist: 'test-therapist-id',
        service: 'test-service-id',
        date: yesterday,
        time: '10:00',
        status: BookingStatus.Pending,
        notes: 'Test booking - should be cancelled (past date)'
      },
      {
        customer: 'test-customer-id',
        therapist: 'test-therapist-id', 
        service: 'test-service-id',
        date: now,
        time: '00:00', // Past time
        status: BookingStatus.Confirmed,
        notes: 'Test booking - should be cancelled (past time today)'
      }
    ];
    
    const createdBookings = await BookingModel.create(testBookings);
    console.log(`   ✓ Created ${createdBookings.length} test bookings`);
    
    // Test the cancellation
    console.log('   Running cancellation process...');
    const result = await cancelExpiredBookings();
    
    console.log(`   Results: Cancelled ${result.cancelledCount} bookings`);
    
    if (result.cancelledBookings.length > 0) {
      console.log('   Cancelled bookings:');
      result.cancelledBookings.forEach((booking, index) => {
        console.log(`     ${index + 1}. ID: ${booking._id}`);
        console.log(`        Date: ${booking.date.toDateString()}`);
        console.log(`        Time: ${booking.time}`);
        console.log(`        Previous Status: ${booking.status}`);
        console.log(`        Notes: ${booking.notes}`);
      });
    }
    
    // Verify the cancellations
    console.log('\n3. Verifying cancellations:');
    const updatedBookings = await BookingModel.find({
      _id: { $in: createdBookings.map((b: any) => b._id) }
    });
    
    let allCancelled = true;
    updatedBookings.forEach(booking => {
      const isCancelled = booking.status === BookingStatus.Cancelled;
      console.log(`   Booking ${booking._id}: ${isCancelled ? '✓ Cancelled' : '✗ Not Cancelled'}`);
      if (!isCancelled) allCancelled = false;
    });
    
    // Clean up test data
    console.log('\n4. Cleaning up test data...');
    await BookingModel.deleteMany({ 
      customer: 'test-customer-id',
      therapist: 'test-therapist-id',
      service: 'test-service-id'
    });
    console.log('   ✓ Test data cleaned up');
    
    console.log('\n=== TEST SUMMARY ===');
    if (allCancelled && result.cancelledCount >= 2) {
      console.log('✓ All tests PASSED - Automatic cancellation system is working correctly');
    } else {
      console.log('✗ Some tests FAILED - Please check the implementation');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  });
}

export { runTests };