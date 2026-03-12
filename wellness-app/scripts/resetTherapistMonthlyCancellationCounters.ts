/**
 * Script to manually trigger the monthly reset of therapist cancellation counters
 * This can be run via command line or scheduled as a cron job
 */

import { resetTherapistMonthlyCancellationCounters } from '../utils/resetTherapistMonthlyCancellationCounters';

async function runManualReset() {
  try {
    console.log('Starting manual monthly therapist cancellation counter reset process...');
    console.log('Current time:', new Date().toISOString());
    
    const result = await resetTherapistMonthlyCancellationCounters();
    
    console.log('\n=== RESET SUMMARY ===');
    console.log(`Processed therapists: ${result.processedCount}`);
    console.log(`Reset successful: ${result.resetCount}`);
    console.log('Reset details:');
    
    if (result.resetTherapists.length > 0) {
      result.resetTherapists.forEach((therapist, index) => {
        console.log(`${index + 1}. Therapist ID: ${therapist._id}`);
        console.log(`   Name: ${therapist.fullName || 'Unknown'}`);
        console.log(`   Email: ${therapist.email || 'Unknown'}`);
        console.log(`   Previous monthlyCancelCount: ${therapist.previousData.monthlyCancelCount}`);
        console.log(`   Previous cancelWarnings: ${therapist.previousData.cancelWarnings}`);
        console.log(`   Previous bonusPenaltyPercentage: ${therapist.previousData.bonusPenaltyPercentage}`);
        console.log('   ---');
      });
    } else {
      console.log('No therapists required counter reset.');
    }
    
    console.log('Process completed successfully.');
    
  } catch (error) {
    console.error('Error during manual reset:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  runManualReset();
}

export { runManualReset };
