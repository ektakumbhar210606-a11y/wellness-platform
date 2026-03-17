/**
 * Scheduled job to reset therapist monthly cancellation counters
 * This job runs once per month at midnight on the first day of every month
 * 
 * Cron schedule: 0 0 1 * *
 * - Minute: 0 (at minute 0)
 * - Hour: 0 (at hour 0 - midnight)
 * - Day of Month: 1 (on the 1st day)
 * - Month: * (every month)
 * - Day of Week: * (any day of the week)
 */

import cron from 'node-cron';
import { resetTherapistMonthlyCancellationCounters } from '../../utils/resetTherapistMonthlyCancellationCounters';

// Cron schedule: "0 0 1 * *" = Midnight on the 1st of every month
const MONTHLY_RESET_SCHEDULE = '0 0 1 * *';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Initialize and start the monthly cancellation counter reset job
 */
export function startMonthlyCancellationResetJob() {
  if (scheduledTask) {
    console.log('Monthly cancellation reset job is already running');
    return scheduledTask;
  }

  console.log(`Starting monthly cancellation reset job with schedule: ${MONTHLY_RESET_SCHEDULE}`);
  
  scheduledTask = cron.schedule(MONTHLY_RESET_SCHEDULE, async () => {
    try {
      console.log('\n=== SCHEDULED JOB TRIGGERED ===');
      console.log('Running monthly therapist cancellation counter reset...');
      console.log('Execution time:', new Date().toISOString());
      
      const result = await resetTherapistMonthlyCancellationCounters();
      
      console.log('\n=== SCHEDULED JOB COMPLETED ===');
      console.log(`Processed therapists: ${result.processedCount}`);
      console.log(`Reset successful: ${result.resetCount}`);
      
      if (result.resetTherapists.length > 0) {
        console.log('Reset details:');
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
      
    } catch (error: any) {
      console.error('❌ Error in scheduled monthly reset job:', error);
      // Don't rethrow - we want the scheduler to continue running even if one execution fails
    }
  }, {
    scheduled: true, // Start the task immediately
    timezone: 'UTC' // Use UTC timezone for consistent scheduling
  });

  console.log('✅ Monthly cancellation reset job scheduled successfully');
  console.log('Next execution will be at midnight on the 1st of next month\n');
  
  return scheduledTask;
}

/**
 * Stop the monthly cancellation counter reset job
 */
export function stopMonthlyCancellationResetJob() {
  if (scheduledTask) {
    console.log('Stopping monthly cancellation reset job...');
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Monthly cancellation reset job stopped');
  }
}

/**
 * Get the current status of the scheduled job
 */
export function getMonthlyCancellationResetJobStatus(): {
  isRunning: boolean;
  schedule: string;
  nextExecution?: Date;
} {
  return {
    isRunning: !!scheduledTask,
    schedule: MONTHLY_RESET_SCHEDULE,
    nextExecution: undefined, // node-cron doesn't provide next execution date in this API
  };
}
