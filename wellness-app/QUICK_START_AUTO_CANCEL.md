# Quick Setup Guide: Automatic Expired Booking Cancellation

## 🚀 Quick Start

### 1. Environment Configuration
Add this to your `.env.local` file:
```env
BACKGROUND_TASK_KEY=your-secure-background-key-here
```

### 2. Test the System
Run the test script to verify everything works:
```bash
cd wellness-app
node scripts/testCancelExpiredBookings.js
```

### 3. Manual Testing
Try the API endpoints:

**Preview expired bookings:**
```bash
curl -X GET http://localhost:3000/api/bookings/cancel-expired \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Cancel expired bookings:**
```bash
curl -X POST http://localhost:3000/api/bookings/cancel-expired \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Automatic Usage
The system now automatically cancels expired bookings whenever:
- Business dashboard loads bookings
- Any booking-related API is accessed

### 5. Scheduled Automation (Optional)
Set up a cron job to run regularly:
```bash
# Add to crontab (crontab -e)
0 * * * * cd /path/to/wellness-app && node scripts/cancelExpiredBookings.js
```

## 📋 What Gets Cancelled

Bookings are automatically cancelled when:
- ✅ Date is in the past (before today)
- ✅ Same-day bookings where time has passed
- ✅ Only affects `pending` or `confirmed` bookings
- ✅ Status changes to `cancelled`

## 🔍 Monitoring

Check the console/logs for:
- Number of bookings cancelled
- Booking details (customer, service, date, time)
- Error messages if any issues occur

## 🛠️ Troubleshooting

If you encounter issues:
1. Check that your `.env.local` has the required variables
2. Verify MongoDB connection is working
3. Ensure JWT tokens are valid for business/admin roles
4. Run the test script to verify functionality

The system is now ready to automatically manage your expired bookings!