# Deployment Checklist - Therapist Monthly Cancellation Reset

## Pre-Deployment Checklist

### 1. Code Review
- [ ] All files created successfully
- [ ] Dependencies installed (`node-cron`)
- [ ] No TypeScript errors
- [ ] Code follows project standards

### 2. Testing in Development
- [ ] Run manual script test: `npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts`
- [ ] Test API endpoint locally: `curl http://localhost:3000/api/background/tasks/reset-therapist-cancellation-counters`
- [ ] Run comprehensive test suite: `npx ts-node scripts/test-resetTherapistCancellation.ts`
- [ ] Verify all tests pass
- [ ] Check console output is clear and helpful

### 3. Database Verification
- [ ] MongoDB connection works
- [ ] Therapist collection accessible
- [ ] Required fields exist in schema
- [ ] Database permissions correct
- [ ] Indexes exist for performance

### 4. Environment Configuration
- [ ] `.env.local` file updated (if using authorization)
- [ ] `BACKGROUND_TASK_SECRET` generated and set (optional)
- [ ] MongoDB URI configured correctly
- [ ] Node environment variables documented

---

## Deployment Steps

### Step 1: Choose Deployment Approach

**Select ONE based on your infrastructure:**

#### Option A: Traditional Server (VPS, EC2, Docker)
- [ ] Integrated cron approach selected
- [ ] Server has persistent process capability
- [ ] Next.js app runs continuously

#### Option B: Serverless (Vercel, Netlify)
- [ ] External cron service approach selected
- [ ] Cron service account created
- [ ] API endpoint will be publicly accessible

#### Option C: Manual Only
- [ ] Manual execution approach selected
- [ ] Team trained on manual process
- [ ] Calendar reminders set for monthly execution

---

### Step 2: Code Deployment

#### For All Approaches:
- [ ] Push code to repository
- [ ] Deploy to production environment
- [ ] Verify deployment successful
- [ ] Check application logs for errors

#### Option A Specific (Integrated Cron):
- [ ] Update `app/layout.tsx` with initialization code:
  ```tsx
  import { initializeAllScheduledJobs } from '@/utils/scheduledJobs';
  
  if (process.env.NODE_ENV === 'production') {
    initializeAllScheduledJobs();
  }
  ```
- [ ] Restart Next.js application
- [ ] Verify job initialization in logs
- [ ] Check job status via monitoring endpoint

#### Option B Specific (External Cron):
- [ ] Note production API URL
- [ ] Configure external cron service:
  - URL: `https://your-domain.com/api/background/tasks/reset-therapist-cancellation-counters`
  - Method: POST
  - Schedule: `0 0 1 * *`
  - Headers: Include `x-background-task-secret` if configured
- [ ] Test cron service connection
- [ ] Verify cron service can reach API

---

### Step 3: Security Configuration (If Using)

- [ ] Generate secure secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Add secret to production environment variables
- [ ] Configure cron service to send secret in header
- [ ] Test authorization works correctly
- [ ] Verify unauthorized requests are rejected

---

### Step 4: Monitoring Setup

#### Basic Monitoring:
- [ ] Console logging enabled
- [ ] Application logs accessible
- [ ] Log retention configured
- [ ] Error notifications set up

#### Advanced Monitoring (Optional):
- [ ] Create status check endpoint: `app/api/scheduler-status/route.ts`
- [ ] Set up log aggregation (e.g., Logstash, Splunk)
- [ ] Create monitoring dashboard
- [ ] Configure alerts for job failures
- [ ] Set up uptime monitoring

---

### Step 5: Documentation & Training

- [ ] Team notified of new scheduled job
- [ ] Operations team trained on monitoring
- [ ] Runbook created for troubleshooting
- [ ] Contact person identified for issues
- [ ] Documentation shared with stakeholders

---

## Post-Deployment Checklist

### Immediate Verification (Day 1)

- [ ] Application starts without errors
- [ ] Job initialization logged (Option A)
- [ ] API endpoint accessible (Option B)
- [ ] No immediate errors in logs
- [ ] Database connection successful

### First Week Monitoring

- [ ] Check logs daily for any errors
- [ ] Verify job is still running (Option A)
- [ ] Test manual execution still works
- [ ] Monitor database performance
- [ ] Address any issues promptly

### Before First Automated Run

- [ ] Confirm next scheduled run date
- [ ] Verify timezone is correct (UTC)
- [ ] Double-check cron schedule: `0 0 1 * *`
- [ ] Ensure team aware of upcoming automation
- [ ] Prepare to monitor first execution

---

## First Execution Day Checklist

### Before Execution (Day Of)

- [ ] System health check passed
- [ ] Database backup completed
- [ ] Monitoring active and working
- [ ] Team available to observe
- [ ] Rollback plan ready if needed

### During Execution

- [ ] Job started at expected time (midnight UTC)
- [ ] No errors during execution
- [ ] Processing completes successfully
- [ ] Logs show expected output
- [ ] Database operations successful

### After Execution

- [ ] Verify results in database:
  - [ ] `monthlyCancelCount` = 0 for affected therapists
  - [ ] `cancelWarnings` = 0 for affected therapists
  - [ ] `bonusPenaltyPercentage` = 0 for affected therapists
  - [ ] `totalCancelCount` unchanged
- [ ] Review execution summary in logs
- [ ] Count matches expectations
- [ ] No unexpected side effects
- [ ] Performance acceptable

---

## Ongoing Maintenance

### Monthly Tasks

- [ ] Verify job ran on 1st of month
- [ ] Review execution logs
- [ ] Check reset counts are reasonable
- [ ] Monitor for any anomalies
- [ ] Document any issues

### Quarterly Review

- [ ] Review overall effectiveness
- [ ] Check if schedule needs adjustment
- [ ] Evaluate performance impact
- [ ] Update documentation if needed
- [ ] Retrain team if necessary

### Annual Review

- [ ] Full system audit
- [ ] Review business requirements
- [ ] Consider optimizations
- [ ] Update dependencies
- [ ] Plan improvements

---

## Troubleshooting Readiness

### Common Issues & Solutions

#### Issue: Job Not Running
- [ ] Check initialization code executed
- [ ] Verify NODE_ENV is 'production'
- [ ] Review application startup logs
- [ ] Test manual execution

#### Issue: Reset Not Working
- [ ] Check database connectivity
- [ ] Verify MongoDB permissions
- [ ] Review error logs
- [ ] Test with small dataset

#### Issue: API Returns Errors
- [ ] Check authorization configuration
- [ ] Verify environment variables
- [ ] Test endpoint manually
- [ ] Review network/firewall rules

### Emergency Contacts

- [ ] Primary contact identified
- [ ] Backup contact identified
- [ ] Escalation path defined
- [ ] Support contacts available
- [ ] Vendor support info (if using external services)

---

## Rollback Plan

### If Something Goes Wrong

#### Immediate Actions:
- [ ] Stop the job (if running)
- [ ] Assess the damage
- [ ] Restore from backup if needed
- [ ] Notify stakeholders
- [ ] Document what happened

#### Recovery Steps:
- [ ] Identify root cause
- [ ] Fix the issue
- [ ] Test fix thoroughly
- [ ] Redeploy when ready
- [ ] Monitor closely after redeployment

#### Data Restoration (If Needed):
- [ ] Restore from database backup
- [ ] Manually update affected records
- [ ] Verify data integrity
- [ ] Document changes made

---

## Success Criteria

### Technical Success
- [ ] Job runs automatically on schedule
- [ ] Resets complete successfully
- [ ] No data loss or corruption
- [ ] Performance acceptable
- [ ] Errors handled gracefully

### Business Success
- [ ] Therapist cancellations tracked correctly
- [ ] Bonus/penalty calculations accurate
- [ ] Monthly resets happen reliably
- [ ] No manual intervention needed
- [ ] Stakeholders satisfied

### Operational Success
- [ ] Easy to monitor and maintain
- [ ] Clear logging and debugging
- [ ] Simple to troubleshoot
- [ ] Well documented
- [ ] Team comfortable with system

---

## Sign-Off

### Deployment Approval

- [ ] Developer sign-off
- [ ] Code review completed
- [ ] Testing completed
- [ ] Documentation reviewed
- [ ] Stakeholders notified

### Production Acceptance

- [ ] First execution observed
- [ ] Results verified
- [ ] No critical issues found
- [ ] Monitoring confirmed working
- [ ] System handed over to operations

---

## Notes Section

### Custom Checklist Items
(Add organization-specific items here)

- [ ] 
- [ ] 
- [ ] 

### Lessons Learned
(Update after each deployment/execution)

**Date:** __________  
**What went well:**  
_________________________________

**What could be improved:**  
_________________________________

**Action items:**  
_________________________________

---

## Quick Reference

### Key Commands

```bash
# Install dependencies
npm install

# Test manually
npx ts-node scripts/resetTherapistMonthlyCancellationCounters.ts

# Run test suite
npx ts-node scripts/test-resetTherapistCancellation.ts

# Test API endpoint
curl http://localhost:3000/api/background/tasks/reset-therapist-cancellation-counters

# Check job status (if monitoring endpoint created)
curl https://your-domain.com/api/scheduler-status
```

### Important Files

- **Core Logic:** `utils/resetTherapistMonthlyCancellationCounters.ts`
- **Job Manager:** `utils/scheduledJobs/index.ts`
- **API Endpoint:** `app/api/background/tasks/reset-therapist-cancellation-counters/route.ts`
- **Manual Script:** `scripts/resetTherapistMonthlyCancellationCounters.ts`
- **Test Suite:** `scripts/test-resetTherapistCancellation.ts`

### Key URLs

- **API Endpoint:** `/api/background/tasks/reset-therapist-cancellation-counters`
- **Status Check:** `/api/scheduler-status` (if created)
- **Application:** `https://your-domain.com`

---

**Last Updated:** March 12, 2026  
**Version:** 1.0.0  
**Status:** Ready for Deployment ✅
