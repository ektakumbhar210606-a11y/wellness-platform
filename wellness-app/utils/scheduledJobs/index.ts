/**
 * Main scheduler manager for all background jobs
 * This file initializes and manages all scheduled cron jobs in the application
 */

import { 
  startMonthlyCancellationResetJob, 
  stopMonthlyCancellationResetJob,
  getMonthlyCancellationResetJobStatus
} from './resetTherapistCancellationCountersJob';

/**
 * Initialize and start all scheduled jobs
 * Call this function when your application starts
 */
export function initializeAllScheduledJobs() {
  console.log('📅 Initializing all scheduled jobs...\n');
  
  // Start the monthly cancellation counter reset job
  startMonthlyCancellationResetJob();
  
  console.log('\n✅ All scheduled jobs initialized successfully\n');
}

/**
 * Stop all scheduled jobs
 * Call this function when your application is shutting down
 */
export function stopAllScheduledJobs() {
  console.log('🛑 Stopping all scheduled jobs...\n');
  
  // Stop the monthly cancellation counter reset job
  stopMonthlyCancellationResetJob();
  
  console.log('\n✅ All scheduled jobs stopped\n');
}

/**
 * Get the status of all scheduled jobs
 */
export function getAllScheduledJobsStatus() {
  return {
    monthlyCancellationReset: getMonthlyCancellationResetJobStatus(),
  };
}
