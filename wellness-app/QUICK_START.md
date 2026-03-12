# Quick Start Guide - Therapist Monthly Cancellation Counter Reset

## ✅ What's Been Implemented

A complete scheduled job system to automatically reset therapist monthly cancellation counters on the 1st of every month at midnight UTC.

### Files Created

1. **Core Utility**
   - `utils/resetTherapistMonthlyCancellationCounters.ts` - Main reset logic

2. **Scheduled Job**
   - `utils/scheduledJobs/resetTherapistCancellationCountersJob.ts` - Cron job manager
   - `utils/scheduledJobs/index.ts` - Central job manager

3. **API Endpoint**
   - `app/api/background/tasks/reset-therapist-cancellation-counters/route.ts` - HTTP endpoint

4. **Manual Script**
   - `scripts/resetTherapistMonthlyCancellationCounters.ts` - CLI script

5. **Documentation**
   - `SCHEDULED_JOB_README.md` - Complete documentation
   - `INTEGRATION_EXAMPLE.md` - Integration examples
   - `QUICK_START.md` - This file

## 🚀 Choose Your Approach

### Option A: Integrated Cron (Best for Traditional Servers)

**For production deployment on VPS, EC2, or dedicated servers:**

1. **Update `app/layout.tsx`:**

```tsx
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
```

2. **Restart your Next.js server**

3. **Done!** The job will run automatically on the 1st of every month.

---

### Option B: External Cron Service (Best for Serverless/Vercel)

**For deployments on Vercel, Netlify, or serverless platforms:**

1. **Choose a cron service:**
   - [Cron-job.org](https://cron-job.org) (Free)
   - [EasyCron](https://easycron.com)
   - [GitHub Actions](https://github.com/features/actions)
   - AWS EventBridge / CloudWatch Events
   - Google Cloud Scheduler

2. **Configure the cron service:**

   **URL:** `https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters`
   
   **Method:** POST
   
   **Schedule:** `0 0 1 * *` (midnight on 1st of every month)
   
   **Headers (optional but recommended):**
   ```
   x-background-task-secret: your-secure-random-secret-here
   Content-Type: application/json
   ```

3. **Add secret to `.env.local`:**
   ```env
   BACKGROUND_TASK_SECRET=your-secure-random-secret-here
   ```

4. **Done!** The external service will call your API on schedule.

---

### Option C: Manual Execution (For Testing)

**Run manually whenever needed:**

```bash
cd wellness-app

# Run the reset script
npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts
```

Or add to `package.json`:

```json
{
  "scripts": {
    "reset-therapist-cancellations": "ts-node scripts/resetTherapistMonthlyCancellationCounters.ts"
  }
}
```

Then run:
```bash
npm run reset-therapist-cancellations
```

---

## 🧪 Testing

### Test Locally (Development)

1. **Test the manual script:**

```bash
cd wellness-app
npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts
```

2. **Test the API endpoint:**

Start dev server:
```bash
npm run dev
```

Call endpoint:
```bash
curl http://localhost:3000/api/background/tasks/reset-therapist-cancellation-counters
```

3. **Expected output:**

```
=== RESET SUMMARY ===
Processed therapists: 5
Reset successful: 3
Reset details:
1. Therapist ID: 12345...
   Name: John Doe
   Email: john@example.com
   Previous monthlyCancelCount: 3
   Previous cancelWarnings: 1
   Previous bonusPenaltyPercentage: 10
   ---
Process completed successfully.
```

---

## 📋 What Gets Reset

### Reset to Zero:
- ✅ `monthlyCancelCount`
- ✅ `cancelWarnings`
- ✅ `bonusPenaltyPercentage`

### NOT Reset (Preserved):
- ❌ `totalCancelCount` (lifetime statistic)
- ❌ All other therapist data

---

## 🔒 Security (For Option B)

If using an external cron service, it's recommended to set up authorization:

1. **Generate a secure secret:**
   ```bash
   # Generate random string
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to `.env.local`:**
   ```env
   BACKGROUND_TASK_SECRET=your-generated-secret-here
   ```

3. **Configure your cron service to send the header:**
   ```
   x-background-task-secret: your-generated-secret-here
   ```

Without this header, anyone could theoretically trigger your API endpoint.

---

## 📊 Monitoring

### Check Logs

The job logs detailed information to console:
- When it starts
- Number of therapists processed
- Details of each reset
- Any errors encountered
- When it completes

### Check Job Status

Create an API route `app/api/scheduler-status/route.ts`:

```tsx
import { NextResponse } from 'next/server';
import { getAllScheduledJobsStatus } from '@/utils/scheduledJobs';

export async function GET() {
  const status = getAllScheduledJobsStatus();
  
  return NextResponse.json({
    success: true,
    data: status,
  });
}
```

Call this endpoint to see:
- Which jobs are running
- Their schedules
- Next execution times

---

## ⚠️ Important Notes

1. **Timezone:** The job runs in UTC timezone
2. **Idempotent:** Safe to run multiple times
3. **Error Handling:** Individual failures don't stop the entire job
4. **Database Safe:** Properly connects/disconnects from database

---

## 🆘 Troubleshooting

### Job Not Running?

1. Verify you're in production mode (`NODE_ENV === 'production'`)
2. Check that `initializeAllScheduledJobs()` is called
3. Look for initialization errors in console

### Reset Not Working?

1. Check database connection
2. Verify MongoDB permissions
3. Review console logs for specific errors
4. Ensure therapists have the cancellation fields

### API Returns 401?

1. Set `BACKGROUND_TASK_SECRET` in `.env.local`
2. Include the header in requests
3. Ensure secrets match exactly

---

## 📖 Full Documentation

For complete details, see:
- `SCHEDULED_JOB_README.md` - Comprehensive documentation
- `INTEGRATION_EXAMPLE.md` - Multiple integration approaches

---

## ✨ Next Steps

1. **Choose your approach** (A, B, or C)
2. **Follow the setup steps** above
3. **Test in development** first
4. **Deploy to production**
5. **Monitor the first automated run**

---

**Questions?** Check the full documentation or test using manual execution first.
