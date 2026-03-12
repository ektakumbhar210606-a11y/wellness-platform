/**
 * Test script for therapist monthly cancellation counter reset
 * This script creates test data and verifies the reset functionality
 */

import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/db';
import TherapistModel from '@/models/Therapist';
import { resetTherapistMonthlyCancellationCounters } from '@/utils/resetTherapistMonthlyCancellationCounters';

async function createTestData() {
  console.log('📝 Creating test data...\n');
  
  try {
    await connectToDatabase();
    
    // Create test therapists with different cancellation counts
    const testTherapists = [
      {
        fullName: 'Test Therapist 1',
        email: `test1-${Date.now()}@example.com`,
        phoneNumber: '1234567890',
        professionalTitle: 'Licensed Massage Therapist',
        experience: 5,
        skills: ['anatomy_physiology'],
        licenseNumber: 'LIC001',
        monthlyCancelCount: 5,
        totalCancelCount: 20,
        cancelWarnings: 2,
        bonusPenaltyPercentage: 15,
      },
      {
        fullName: 'Test Therapist 2',
        email: `test2-${Date.now()}@example.com`,
        phoneNumber: '0987654321',
        professionalTitle: 'Senior Wellness Consultant',
        experience: 8,
        skills: ['manual_massage_techniques'],
        licenseNumber: 'LIC002',
        monthlyCancelCount: 3,
        totalCancelCount: 15,
        cancelWarnings: 1,
        bonusPenaltyPercentage: 10,
      },
      {
        fullName: 'Test Therapist 3',
        email: `test3-${Date.now()}@example.com`,
        phoneNumber: '1122334455',
        professionalTitle: 'Holistic Therapist',
        experience: 3,
        skills: ['mindfulness_coaching'],
        licenseNumber: 'LIC003',
        monthlyCancelCount: 0,
        totalCancelCount: 5,
        cancelWarnings: 0,
        bonusPenaltyPercentage: 0,
      },
    ];
    
    const created = [];
    for (const therapistData of testTherapists) {
      // Create a mock user reference (we'll use a random ObjectId)
      const mockUserId = new mongoose.Types.ObjectId();
      
      const therapist = await TherapistModel.create({
        ...therapistData,
        user: mockUserId,
        availabilityStatus: 'available',
      });
      
      created.push(therapist);
      console.log(`✓ Created: ${therapist.fullName} (ID: ${therapist._id})`);
      console.log(`  - monthlyCancelCount: ${therapist.monthlyCancelCount}`);
      console.log(`  - totalCancelCount: ${therapist.totalCancelCount}`);
      console.log(`  - cancelWarnings: ${therapist.cancelWarnings}`);
      console.log(`  - bonusPenaltyPercentage: ${therapist.bonusPenaltyPercentage}\n`);
    }
    
    console.log(`✅ Created ${created.length} test therapists\n`);
    return created;
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

async function testResetFunctionality() {
  console.log('🔄 Testing reset functionality...\n');
  
  try {
    await connectToDatabase();
    
    // Get initial state
    const beforeReset = await TherapistModel.find({
      fullName: { $regex: '^Test Therapist' }
    }).lean();
    
    console.log('📊 State BEFORE reset:');
    beforeReset.forEach((t, i) => {
      console.log(`${i + 1}. ${t.fullName}:`);
      console.log(`   monthlyCancelCount: ${t.monthlyCancelCount}`);
      console.log(`   totalCancelCount: ${t.totalCancelCount}`);
      console.log(`   cancelWarnings: ${t.cancelWarnings}`);
      console.log(`   bonusPenaltyPercentage: ${t.bonusPenaltyPercentage}\n`);
    });
    
    // Run the reset
    console.log('⚙️ Running reset function...\n');
    const result = await resetTherapistMonthlyCancellationCounters();
    
    console.log('\n📈 Reset Results:');
    console.log(`   Processed: ${result.processedCount}`);
    console.log(`   Reset: ${result.resetCount}`);
    
    if (result.resetTherapists.length > 0) {
      console.log('\n📋 Reset Details:');
      result.resetTherapists.forEach((t, i) => {
        console.log(`${i + 1}. ${t.fullName}:`);
        console.log(`   Previous monthlyCancelCount: ${t.previousData.monthlyCancelCount}`);
        console.log(`   Previous cancelWarnings: ${t.previousData.cancelWarnings}`);
        console.log(`   Previous bonusPenaltyPercentage: ${t.previousData.bonusPenaltyPercentage}\n`);
      });
    }
    
    // Get state after reset
    const afterReset = await TherapistModel.find({
      fullName: { $regex: '^Test Therapist' }
    }).lean();
    
    console.log('\n📊 State AFTER reset:');
    afterReset.forEach((t, i) => {
      console.log(`${i + 1}. ${t.fullName}:`);
      console.log(`   monthlyCancelCount: ${t.monthlyCancelCount}`);
      console.log(`   totalCancelCount: ${t.totalCancelCount}`);
      console.log(`   cancelWarnings: ${t.cancelWarnings}`);
      console.log(`   bonusPenaltyPercentage: ${t.bonusPenaltyPercentage}\n`);
    });
    
    // Verify results
    console.log('🔍 Verifying results...\n');
    
    let allTestsPassed = true;
    
    for (const therapist of afterReset) {
      const hadNonZeroCounters = beforeReset.find(
        t => t._id.toString() === therapist._id.toString() && 
        (t.monthlyCancelCount !== 0 || t.cancelWarnings !== 0 || t.bonusPenaltyPercentage !== 0)
      );
      
      if (hadNonZeroCounters) {
        // This therapist should have been reset
        if (
          therapist.monthlyCancelCount !== 0 ||
          therapist.cancelWarnings !== 0 ||
          therapist.bonusPenaltyPercentage !== 0
        ) {
          console.error(`❌ FAIL: ${therapist.fullName} was not reset properly`);
          allTestsPassed = false;
        } else {
          console.log(`✓ PASS: ${therapist.fullName} - monthly counters reset correctly`);
        }
        
        // Verify totalCancelCount was NOT changed
        const originalTotal = beforeReset.find(
          t => t._id.toString() === therapist._id.toString()
        )?.totalCancelCount || 0;
        
        if (therapist.totalCancelCount !== originalTotal) {
          console.error(`❌ FAIL: ${therapist.fullName} - totalCancelCount was incorrectly modified`);
          allTestsPassed = false;
        } else {
          console.log(`✓ PASS: ${therapist.fullName} - totalCancelCount preserved (${originalTotal})`);
        }
      } else {
        // This therapist already had zero counters, should remain unchanged
        if (
          therapist.monthlyCancelCount !== 0 ||
          therapist.cancelWarnings !== 0 ||
          therapist.bonusPenaltyPercentage !== 0
        ) {
          console.error(`❌ FAIL: ${therapist.fullName} - counters were unexpectedly modified`);
          allTestsPassed = false;
        } else {
          console.log(`✓ PASS: ${therapist.fullName} - already zero counters remained unchanged`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!\n');
    } else {
      console.log('❌ SOME TESTS FAILED!\n');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    return false;
  } finally {
    await disconnectFromDatabase();
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    await connectToDatabase();
    
    const result = await TherapistModel.deleteMany({
      fullName: { $regex: '^Test Therapist' }
    });
    
    console.log(`✓ Deleted ${result.deletedCount} test therapists\n`);
    
  } catch (error) {
    console.error('❌ Error cleaning up:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 THERAPIST CANCELLATION RESET - TEST SUITE');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Step 1: Create test data
    await createTestData();
    
    // Step 2: Test reset functionality
    const testsPassed = await testResetFunctionality();
    
    // Step 3: Cleanup
    await cleanupTestData();
    
    // Final summary
    console.log('='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (testsPassed) {
      console.log('✅ All tests passed successfully!');
      console.log('The monthly cancellation counter reset is working correctly.');
    } else {
      console.log('❌ Some tests failed. Please review the output above.');
    }
    
    console.log('='.repeat(50) + '\n');
    
    process.exit(testsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    await cleanupTestData();
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

export { createTestData, testResetFunctionality, cleanupTestData, runAllTests };
