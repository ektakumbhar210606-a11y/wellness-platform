/**
 * Test script for Business Therapist Cancellation Stats API
 * This script tests the new cancellation statistics endpoint
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const BookingModel = require('./wellness-app/models/Booking');
const TherapistModel = require('./wellness-app/models/Therapist');
const BusinessModel = require('./wellness-app/models/Business');
const UserModel = require('./wellness-app/models/User');

async function testCancellationStats() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find a business user
    const businessUser = await UserModel.findOne({ 
      $or: [{ role: 'business' }, { role: 'Provider' }] 
    }).limit(1);
    
    if (!businessUser) {
      console.error('✗ No business user found in database');
      return;
    }

    // Find the business owned by this user
    const business = await BusinessModel.findOne({ owner: businessUser._id });
    
    if (!business) {
      console.error('✗ No business profile found for this user');
      return;
    }

    console.log('=== BUSINESS INFO ===');
    console.log(`Business ID: ${business._id}`);
    console.log(`Business Name: ${business.business_name || business.name}`);
    console.log('');

    // Find all approved therapists associated with this business
    const therapists = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id,
      'associatedBusinesses.status': 'approved'
    }).populate('user', 'firstName lastName');

    if (therapists.length === 0) {
      console.log('ℹ No approved therapists found for this business');
      console.log('Tip: Associate some therapists with your business first');
      return;
    }

    console.log(`=== FOUND ${therapists.length} THERAPIST(S) ===\n`);

    // Build statistics for each therapist (simulating API logic)
    const stats = [];
    
    for (const therapist of therapists) {
      // Count completed bookings
      const completedBookingsCount = await BookingModel.countDocuments({
        therapist: therapist._id,
        status: 'completed'
      });

      // Get therapist name
      const therapistName = therapist.fullName || 
        `${therapist.user?.firstName || ''} ${therapist.user?.lastName || ''}`.trim() ||
        'Unknown Therapist';

      stats.push({
        therapistName,
        completedBookings: completedBookingsCount,
        monthlyCancelCount: therapist.monthlyCancelCount || 0,
        totalCancelCount: therapist.totalCancelCount || 0,
        cancelWarnings: therapist.cancelWarnings || 0,
        bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0
      });
    }

    // Display results
    console.log('=== THERAPIST CANCELLATION STATISTICS ===\n');
    
    stats.forEach((stat, index) => {
      console.log(`--- Therapist ${index + 1} ---`);
      console.log(`Name: ${stat.therapistName}`);
      console.log(`Completed Bookings: ${stat.completedBookings}`);
      console.log(`Monthly Cancel Count: ${stat.monthlyCancelCount}`);
      console.log(`Total Cancel Count: ${stat.totalCancelCount}`);
      console.log(`Cancel Warnings: ${stat.cancelWarnings}`);
      console.log(`Bonus Penalty %: ${stat.bonusPenaltyPercentage}`);
      
      // Display penalty level indicator
      if (stat.monthlyCancelCount >= 7) {
        console.log('⚠️  CRITICAL: 100% bonus penalty (7+ cancellations)');
      } else if (stat.monthlyCancelCount >= 6) {
        console.log('⚠️  HIGH: 25% bonus penalty (6 cancellations)');
      } else if (stat.monthlyCancelCount >= 5) {
        console.log('⚠️  MEDIUM: 10% bonus penalty (5 cancellations)');
      } else if (stat.monthlyCancelCount >= 3) {
        console.log('⚠️  WARNING: Warning issued (3+ cancellations)');
      } else {
        console.log('✓ No penalties applied');
      }
      
      console.log('');
    });

    // Display summary
    console.log('=== SUMMARY ===');
    console.log(`Total Therapists: ${stats.length}`);
    
    const totalCancellations = stats.reduce((sum, stat) => sum + stat.totalCancelCount, 0);
    const therapistsWithPenalties = stats.filter(stat => stat.bonusPenaltyPercentage > 0).length;
    const therapistsWithWarnings = stats.filter(stat => stat.cancelWarnings > 0).length;
    
    console.log(`Total Lifetime Cancellations: ${totalCancellations}`);
    console.log(`Therapists with Penalties: ${therapistsWithPenalties}`);
    console.log(`Therapists with Warnings: ${therapistsWithWarnings}`);

    // Show what the API would return
    console.log('\n=== API RESPONSE FORMAT ===');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n✅ Test completed successfully!');
    console.log('\nTo test the actual API endpoint:');
    console.log(`GET /api/business/therapist-cancellation-stats`);
    console.log('Headers: Authorization: Bearer <business_token>');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
console.log('🧪 Testing Business Therapist Cancellation Stats API\n');
testCancellationStats();
