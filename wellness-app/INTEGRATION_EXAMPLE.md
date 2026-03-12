/**
 * Example integration of scheduled jobs into Next.js application
 * 
 * This file shows different ways to initialize and manage scheduled jobs
 */

// ============================================
// METHOD 1: Initialize in Root Layout (Recommended for App Router)
// ============================================

// Uncomment and use this code in app/layout.tsx

/*
import { initializeAllScheduledJobs } from '@/utils/scheduledJobs';

// Initialize scheduled jobs when app starts (production only)
if (process.env.NODE_ENV === 'production') {
  initializeAllScheduledJobs();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
*/

// ============================================
// METHOD 2: Initialize via API Route
// ============================================

// Create file: app/api/init-scheduler/route.ts

/*
import { NextResponse } from 'next/server';
import { initializeAllScheduledJobs, getAllScheduledJobsStatus } from '@/utils/scheduledJobs';

let initialized = false;

export async function GET() {
  try {
    if (!initialized && process.env.NODE_ENV === 'production') {
      initializeAllScheduledJobs();
      initialized = true;
      
      const status = getAllScheduledJobsStatus();
      
      return NextResponse.json({
        success: true,
        message: 'Scheduled jobs initialized successfully',
        data: {
          initialized: true,
          jobs: status,
        },
      });
    }
    
    const status = getAllScheduledJobsStatus();
    
    return NextResponse.json({
      success: true,
      message: initialized ? 'Already initialized' : 'Not in production mode',
      data: {
        initialized,
        jobs: status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize scheduled jobs',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}
*/

// ============================================
// METHOD 3: Initialize in Custom Server
// ============================================

// If you're using a custom server (server.js or server.ts):

/*
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeAllScheduledJobs } = require('./utils/scheduledJobs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize all scheduled jobs
  initializeAllScheduledJobs();
  
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Scheduled jobs are running in the background');
  });
});
*/

// ============================================
// METHOD 4: Use External Cron Service Only
// ============================================

// If you prefer to use an external cron service (like cron-job.org, AWS EventBridge, etc.)
// You don't need to initialize anything in your app.
// Just ensure the API endpoint exists and configure your external scheduler.

// Example external service configuration:
// URL: https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters
// Method: POST
// Schedule: 0 0 1 * *
// Headers:
//   x-background-task-secret: your-secret-here
//   Content-Type: application/json

// ============================================
// METHOD 5: Manual Execution Script
// ============================================

// Add to package.json scripts:
/*
{
  "scripts": {
    "reset-therapist-cancellations": "ts-node scripts/resetTherapistMonthlyCancellationCounters.ts"
  }
}
*/

// Then run manually when needed:
// npm run reset-therapist-cancellations

// ============================================
// TESTING CONFIGURATION (For Development Only)
// ============================================

// To test the scheduled job more frequently during development,
// temporarily modify the schedule in:
// utils/scheduledJobs/resetTherapistCancellationCountersJob.ts

// Change from:
// const MONTHLY_RESET_SCHEDULE = '0 0 1 * *';

// To (for testing only!):
// const TEST_SCHEDULE = '*/5 * * * * *'; // Every 5 seconds (requires node-cron with seconds support)
// Or:
// const TEST_SCHEDULE = '*/15 * * * *'; // Every 15 minutes

// ⚠️ IMPORTANT: Remember to change it back to '0 0 1 * *' for production!

// ============================================
// MONITORING AND STATUS CHECKS
// ============================================

// Create an API endpoint to check job status:
// File: app/api/scheduler-status/route.ts

/*
import { NextResponse } from 'next/server';
import { getAllScheduledJobsStatus } from '@/utils/scheduledJobs';

export async function GET() {
  try {
    const status = getAllScheduledJobsStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}
*/

// Call this endpoint to see:
// - Which jobs are running
// - Their schedules
// - Next execution times

// ============================================
// RECOMMENDED APPROACH
// ============================================

/*
For most Next.js applications, we recommend:

1. **Development**: Use manual execution or API endpoint for testing
2. **Production**: Use either:
   - Option A: Integrated node-cron (initialize in layout.tsx)
   - Option B: External cron service calling your API

Choose based on your deployment environment and preferences.

For Vercel/Netlify deployments: Use external cron service (serverless functions don't support long-running processes)
For traditional servers (VPS, EC2, etc.): Use integrated node-cron
For containerized deployments (Docker, Kubernetes): Either approach works
*/
