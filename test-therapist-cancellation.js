/**
 * Test script for therapist booking cancellation with tracking
 * This script tests the new cancellation tracking functionality
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const BookingModel = require('./wellness-app/models/Booking');
const TherapistModel = require('./wellness-app/models/Therapist');
const UserModel = require('./wellness-app/models/User');

async function testTherapistCancellation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find a test therapist
    const testUser = await UserModel.findOne({ role: 'therapist' }).limit(1);
    
    if (!testUser) {
      console.error('✗ No therapist user found in database');
      return;
    }

    const therapist = await TherapistModel.findOne({ user: testUser._id });
    
    if (!therapist) {
      console.error('✗ No therapist profile found');
      return;
    }

    console.log('\n=== BEFORE CANCELLATION ===');
    console.log(`Therapist ID: ${therapist._id}`);
    console.log(`Monthly Cancel Count: ${therapist.monthlyCancelCount || 0}`);
    console.log(`Total Cancel Count: ${therapist.totalCancelCount || 0}`);
    console.log(`Cancel Warnings: ${therapist.cancelWarnings || 0}`);
    console.log(`Bonus Penalty %: ${therapist.bonusPenaltyPercentage || 0}`);

    // Find a confirmed or pending booking assigned to this therapist
    const booking = await BookingModel.findOne({
      therapist: therapist._id,
      assignedByAdmin: true,
      status: { $in: ['pending', 'confirmed', 'rescheduled'] }
    }).populate('customer service');

    if (!booking) {
      console.error('\n✗ No suitable booking found for cancellation test');
      console.log('Tip: Create a booking and assign it to a therapist first');
      return;
    }

    console.log('\n=== BOOKING TO CANCEL ===');
    console.log(`Booking ID: ${booking._id}`);
    console.log(`Status: ${booking.status}`);
    console.log(`Customer: ${(booking.customer as any)?.name || 'N/A'}`);
    console.log(`Service: ${(booking.service as any)?.name || 'N/A'}`);

    // Simulate the cancellation logic (this is what the API does)
    console.log('\n=== SIMULATING CANCELLATION ===');
    
    // Update booking
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      booking._id,
      { 
        status: 'cancelled',
        cancelledBy: testUser._id,
        cancelledAt: new Date(),
        cancelReason: 'Test cancellation - automated test',
        therapistCancelReason: 'Test cancellation - automated test',
        therapistResponded: true,
        responseVisibleToBusinessOnly: true
      },
      { new: true }
    );

    console.log('✓ Booking updated to cancelled status');

    // Update therapist counters
    const cancellingTherapist = await TherapistModel.findOne({ user: testUser._id });
    
    if (cancellingTherapist) {
      // Increment counters
      cancellingTherapist.monthlyCancelCount = (cancellingTherapist.monthlyCancelCount || 0) + 1;
      cancellingTherapist.totalCancelCount = (cancellingTherapist.totalCancelCount || 0) + 1;
      
      // Apply penalty rules
      const monthlyCount = cancellingTherapist.monthlyCancelCount;
      
      if (monthlyCount >= 7) {
        cancellingTherapist.cancelWarnings = 1;
        cancellingTherapist.bonusPenaltyPercentage = 100;
      } else if (monthlyCount >= 6) {
        cancellingTherapist.cancelWarnings = 1;
        cancellingTherapist.bonusPenaltyPercentage = 25;
      } else if (monthlyCount >= 5) {
        cancellingTherapist.cancelWarnings = 1;
        cancellingTherapist.bonusPenaltyPercentage = 10;
      } else if (monthlyCount >= 3) {
        cancellingTherapist.cancelWarnings = 1;
      }
      
      await cancellingTherapist.save();
      console.log('✓ Therapist cancellation counters updated');
    }

    console.log('\n=== AFTER CANCELLATION ===');
    const updatedTherapist = await TherapistModel.findById(therapist._id);
    console.log(`Therapist ID: ${updatedTherapist._id}`);
    console.log(`Monthly Cancel Count: ${updatedTherapist.monthlyCancelCount}`);
    console.log(`Total Cancel Count: ${updatedTherapist.totalCancelCount}`);
    console.log(`Cancel Warnings: ${updatedTherapist.cancelWarnings}`);
    console.log(`Bonus Penalty %: ${updatedTherapist.bonusPenaltyPercentage}`);

    // Display penalty level
    console.log('\n=== PENALTY ANALYSIS ===');
    if (updatedTherapist.monthlyCancelCount >= 7) {
      console.log('⚠️  CRITICAL: 100% bonus penalty applied (7+ cancellations)');
    } else if (updatedTherapist.monthlyCancelCount >= 6) {
      console.log('⚠️  HIGH: 25% bonus penalty applied (6 cancellations)');
    } else if (updatedTherapist.monthlyCancelCount >= 5) {
      console.log('⚠️  MEDIUM: 10% bonus penalty applied (5 cancellations)');
    } else if (updatedTherapist.monthlyCancelCount >= 3) {
      console.log('⚠️  WARNING: Warning issued (3+ cancellations)');
    } else {
      console.log('✓ No penalties applied yet');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
console.log('🧪 Testing Therapist Cancellation Tracking System\n');
testTherapistCancellation();
