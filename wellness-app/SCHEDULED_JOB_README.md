# Therapist Monthly Cancellation Counter Reset - Scheduled Job

## Overview

This scheduled job automatically resets therapist monthly cancellation counters on the first day of every month at midnight (UTC).

### Fields Reset

The job resets the following fields to 0:
- `monthlyCancelCount` = 0
- `cancelWarnings` = 0
- `bonusPenaltyPercentage` = 0

### Fields NOT Reset

The job does NOT reset:
- `totalCancelCount` (lifetime statistic)

## Cron Schedule

**Schedule:** `0 0 1 * *`

This means:
- **Minute:** 0 (at minute 0)
- **Hour:** 0 (at hour 0 - midnight)
- **Day of Month:** 1 (on the 1st day)
- **Month:** * (every month)
- **Day of Week:** * (any day of the week)

**Result:** Runs at midnight UTC on the first day of every month.

## Implementation Components

### 1. Utility Function
**File:** `utils/resetTherapistMonthlyCancellationCounters.ts`

Core function that performs the actual reset operation:
- Connects to database
- Finds all therapists with non-zero counters
- Resets the counters safely
- Logs detailed results
- Disconnects from database

### 2. Scheduled Job
**File:** `utils/scheduledJobs/resetTherapistCancellationCountersJob.ts`

Manages the cron schedule and execution:
- Starts/stops the job
- Handles errors gracefully
- Provides status information
- Ensures job continues running even if individual executions fail

### 3. API Endpoint
**File:** `app/api/background/tasks/reset-therapist-cancellation-counters/route.ts`

HTTP endpoint for external schedulers:
- Can be called by external cron services
- Supports authorization via secret header
- Returns detailed execution results
- Can be tested manually via GET request

### 4. Manual Script
**File:** `scripts/resetTherapistMonthlyCancellationCounters.ts`

Command-line script for manual execution:
- Can be run via `ts-node`
- Useful for testing or manual resets
- Provides detailed console output

## Installation

### Step 1: Install Dependencies

```bash
cd wellness-app
npm install node-cron
```

### Step 2: Update package.json (Already Done)

The `node-cron` dependency has been added to your package.json.

### Step 3: Configure Environment Variables (Optional)

Add to `.env.local`:

```env
# Optional: Secret for authorizing background task API calls
BACKGROUND_TASK_SECRET=your-secure-random-secret-here
```

If you set this variable, API calls must include the header:
```
x-background-task-secret: your-secure-random-secret-here
```

## Usage Options

### Option 1: Integrated node-cron Job (Recommended)

Integrate the scheduled job into your Next.js application:

#### For Next.js App Router (app/ directory):

Create or update `app/layout.tsx`:

```tsx
import { initializeAllScheduledJobs } from '@/utils/scheduledJobs';

// Initialize scheduled jobs when app starts
if (process.env.NODE_ENV === 'production') {
  initializeAllScheduledJobs();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### For Custom Server or API Route:

Create an API route to initialize jobs: `app/api/init-scheduler/route.ts`:

```tsx
import { NextResponse } from 'next/server';
import { initializeAllScheduledJobs } from '@/utils/scheduledJobs';

let initialized = false;

export async function GET() {
  if (!initialized && process.env.NODE_ENV === 'production') {
    initializeAllScheduledJobs();
    initialized = true;
    return NextResponse.json({ success: true, message: 'Scheduled jobs initialized' });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: initialized ? 'Already initialized' : 'Not in production mode' 
  });
}
```

Then call this endpoint once after deployment.

### Option 2: External Cron Service

Use an external cron service to call your API endpoint:

#### Example Services:
- [Cron-job.org](https://cron-job.org)
- [EasyCron](https://easycron.com)
- [GitHub Actions](https://github.com/features/actions)
- AWS EventBridge (CloudWatch Events)
- Google Cloud Scheduler

#### Configuration:

**URL:** `https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters`

**Method:** POST

**Schedule:** `0 0 1 * *` (midnight on 1st of every month)

**Headers:**
```
x-background-task-secret: your-secure-random-secret-here
Content-Type: application/json
```

### Option 3: Manual Execution

Run the script manually from command line:

```bash
# Using ts-node
npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts

# Or using npm script (add to package.json first)
npm run reset-therapist-cancellations
```

To add as npm script in package.json:

```json
{
  "scripts": {
    "reset-therapist-cancellations": "ts-node scripts/resetTherapistMonthlyCancellationCounters.ts"
  }
}
```

### Option 4: Test the API Manually

Test the API endpoint directly:

```bash
# Using curl
curl -X GET https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters

# Or with authorization header
curl -X POST \
  -H "x-background-task-secret: your-secure-random-secret-here" \
  https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters
```

## Testing

### Local Testing

1. **Test the utility function directly:**

```bash
npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts
```

2. **Test the API endpoint:**

Start your dev server:
```bash
npm run dev
```

Call the endpoint:
```bash
curl http://localhost:3000/api/background/tasks/reset-therapist-cancellation-counters
```

3. **Test the scheduled job:**

You can temporarily change the cron schedule for testing:

```typescript
// In utils/scheduledJobs/resetTherapistCancellationCountersJob.ts
const TEST_SCHEDULE = '*/5 * * * * *'; // Every 5 seconds (for testing only!)
```

⚠️ **Warning:** Remember to change it back to `'0 0 1 * *'` for production!

### Production Testing

Before deploying to production:

1. Test thoroughly in development
2. Test in staging environment first
3. Monitor the first automated execution
4. Set up logging and alerting

## Monitoring and Logging

### Console Output

The job logs detailed information:
- Start time
- Number of therapists processed
- Number of resets performed
- Details of each reset (therapist ID, name, previous values)
- Completion status
- Errors (if any)

### Checking Job Status

You can check the status of scheduled jobs programmatically:

```typescript
import { getAllScheduledJobsStatus } from '@/utils/scheduledJobs';

const status = getAllScheduledJobsStatus();
console.log(status.monthlyCancellationReset);
// Output:
// {
//   isRunning: true,
//   schedule: '0 0 1 * *',
//   nextExecution: 2024-04-01T00:00:00.000Z
// }
```

### API Response

The API endpoint returns detailed information:

```json
{
  "success": true,
  "message": "Monthly therapist cancellation counters reset successfully",
  "data": {
    "processedCount": 15,
    "resetCount": 10,
    "resetTherapists": [
      {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "previousMonthlyCancelCount": 3,
        "previousCancelWarnings": 1,
        "previousBonusPenaltyPercentage": 10
      }
    ]
  }
}
```

## Error Handling

The job includes robust error handling:

1. **Database Connection Errors:** Caught and logged, job fails gracefully
2. **Individual Therapist Errors:** If one therapist fails, others continue
3. **Job Execution Errors:** Logged but don't stop future scheduled runs
4. **Authorization Errors:** API returns 401 if secret doesn't match

## Safety Features

1. **Idempotent:** Running multiple times is safe - only resets non-zero counters
2. **Atomic Updates:** Each therapist update is independent
3. **Error Isolation:** One failure doesn't affect others
4. **Transaction Safe:** Uses MongoDB operations safely
5. **No Data Loss:** Only resets specific fields, preserves all other data

## Performance Considerations

- **Batch Processing:** Processes therapists sequentially to avoid memory issues
- **Database Indexing:** Uses indexed fields for efficient queries
- **Connection Management:** Properly connects/disconnects from database
- **Memory Efficient:** Uses lean queries to reduce memory footprint

## Troubleshooting

### Job Not Running

1. Check if `initializeAllScheduledJobs()` was called
2. Verify you're in production mode (`NODE_ENV === 'production'`)
3. Check console logs for initialization errors

### Reset Not Working

1. Verify database connection
2. Check that therapists have the cancellation fields
3. Review console logs for specific errors
4. Ensure MongoDB permissions are correct

### API Returns 401

1. Set `BACKGROUND_TASK_SECRET` in `.env.local`
2. Include the header `x-background-task-secret` in requests
3. Ensure the secrets match exactly

## Best Practices

1. ✅ Always test in development before production
2. ✅ Monitor the first few automated executions
3. ✅ Set up alerts for job failures
4. ✅ Keep logs for auditing purposes
5. ✅ Use a strong random secret for API authorization
6. ✅ Document when the job runs for your team
7. ✅ Have a rollback plan if needed

## Rollback Plan

If you need to restore previous values:

1. Check the logs for previous values
2. Create a reverse script to restore values
3. Test the restoration process in staging first

## Support

For issues or questions:
1. Check the console logs
2. Review this documentation
3. Test using manual execution methods
4. Check database permissions and connectivity

---

**Last Updated:** March 12, 2026
**Version:** 1.0.0
