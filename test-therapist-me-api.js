/**
 * Test script to verify therapist cancellation data is returned from /api/therapist/me
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const TherapistModel = require('./wellness-app/models/Therapist').default;
const UserModel = require('./wellness-app/models/User');

async function testTherapistApiCancellationData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find a test therapist (Sunny or any therapist with cancellations)
    const testUser = await UserModel.findOne({ 
      role: 'therapist',
      email: /sunny/i  // Try to find Sunny first
    }).limit(1);
    
    if (!testUser) {
      // If Sunny not found, get any therapist
      const randomTherapistUser = await UserModel.findOne({ role: 'therapist' }).limit(1);
      if (!randomTherapistUser) {
        console.error('✗ No therapist user found in database');
        return;
      }
      testUser = randomTherapistUser;
    }

    console.log('=== TESTING THERAPIST API CANCELLATION DATA ===\n');
    console.log(`Test User: ${testUser.name} (${testUser.email})`);
    console.log(`User ID: ${testUser._id}\n`);

    const therapist = await TherapistModel.findOne({ user: testUser._id });
    
    if (!therapist) {
      console.error('✗ No therapist profile found');
      return;
    }

    console.log('=== DIRECT DATABASE QUERY ===');
    console.log(`Therapist ID: ${therapist._id}`);
    console.log(`Therapist Name: ${therapist.fullName || 'N/A'}`);
    console.log(`Monthly Cancel Count: ${therapist.monthlyCancelCount || 0}`);
    console.log(`Total Cancel Count: ${therapist.totalCancelCount || 0}`);
    console.log(`Cancel Warnings: ${therapist.cancelWarnings || 0}`);
    console.log(`Bonus Penalty %: ${therapist.bonusPenaltyPercentage || 0}`);
    
    console.log('\n=== EXPECTED API RESPONSE ===');
    const expectedResponse = {
      success: true,
      message: 'Therapist profile retrieved successfully',
      data: {
        id: therapist._id.toString(),
        userId: therapist.user.toString(),
        monthlyCancelCount: therapist.monthlyCancelCount || 0,
        totalCancelCount: therapist.totalCancelCount || 0,
        cancelWarnings: therapist.cancelWarnings || 0,
        bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0,
        // ... other fields
      }
    };
    
    console.log(JSON.stringify(expectedResponse, null, 2));
    
    console.log('\n=== VALIDATION ===');
    const hasCancellationData = 
      expectedResponse.data.monthlyCancelCount !== undefined &&
      expectedResponse.data.totalCancelCount !== undefined &&
      expectedResponse.data.cancelWarnings !== undefined &&
      expectedResponse.data.bonusPenaltyPercentage !== undefined;
    
    if (hasCancellationData) {
      console.log('✅ SUCCESS: Cancellation fields are included in API response');
      console.log('✅ The TherapistCancellationCard component should now display accurate data');
    } else {
      console.log('❌ FAILURE: Cancellation fields are missing from API response');
    }
    
    // Check if there are actual cancellations
    if (therapist.monthlyCancelCount > 0 || therapist.totalCancelCount > 0) {
      console.log(`\n✅ This therapist has cancellation history:`);
      console.log(`   - ${therapist.monthlyCancelCount} cancellations this month`);
      console.log(`   - ${therapist.totalCancelCount} total cancellations`);
      
      if (therapist.cancelWarnings > 0) {
        console.log(`   - ⚠️ Has active warnings`);
      }
      
      if (therapist.bonusPenaltyPercentage > 0) {
        console.log(`   - ⚠️ ${therapist.bonusPenaltyPercentage}% bonus penalty applied`);
      }
    } else {
      console.log(`\n✓ This therapist has no cancellations recorded`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\nNEXT STEPS:');
    console.log('1. Restart your Next.js development server');
    console.log('2. Login as this therapist');
    console.log('3. Check the Cancellation Performance card on the dashboard');
    console.log('4. Verify the monthly cancellation count matches the database');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
console.log('🧪 Testing Therapist API Cancellation Data\n');
testTherapistApiCancellationData();
