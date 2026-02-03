# Automatic Expired Booking Cancellation System

## Overview
This system automatically cancels bookings that have passed their scheduled date/time without requiring manual intervention. Bookings are cancelled when:
1. The booking date is in the past (before current date)
2. For same-day bookings, when the scheduled time has passed

## Implementation Details

### Files Created

1. **`utils/cancelExpiredBookings.ts`** - Core utility functions
   - `cancelExpiredBookings()` - Main function to find and cancel expired bookings
   - `isBookingExpired()` - Helper to check if a specific booking has expired
   - `isSameDay()` - Helper to compare if two dates are the same day

2. **`app/api/bookings/cancel-expired/route.ts`** - API endpoints for manual control
   - `POST` - Manually trigger cancellation process
   - `GET` - Preview which bookings would be cancelled

3. **`app/api/background/tasks/cancel-expired-bookings/route.ts`** - Background task endpoint
   - Secure endpoint for automated/scheduled execution
   - Requires authentication via `x-background-task-key` header

4. **`scripts/cancelExpiredBookings.js`** - Command-line script
   - Can be run manually or scheduled as cron job
   - Provides detailed console output

5. **Modified `app/api/bookings/business/route.ts`** - Enhanced business dashboard
   - Automatically runs cancellation check on every booking request
   - Ensures businesses always see current booking statuses

## How It Works

### Booking Expiration Logic
A booking is considered expired if:
- **Past Date**: The booking date is before today's date
- **Same Day Expired Time**: The booking is for today but the scheduled time has already passed

### Status Updates
- Only affects bookings with status `pending` or `confirmed`
- Updates status to `cancelled`
- Preserves all other booking data

## Usage Options

### 1. Automatic (Recommended)
The system automatically checks for expired bookings whenever:
- Business dashboard loads bookings
- Any booking-related API is accessed

### 2. Manual API Trigger
Call the API endpoint to manually trigger cancellation:

```bash
# Preview expired bookings
curl -X GET http://localhost:3000/api/bookings/cancel-expired \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Cancel expired bookings
curl -X POST http://localhost:3000/api/bookings/cancel-expired \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Background Task
Set up automated scheduling:

```bash
# Run via command line
node scripts/cancelExpiredBookings.js

# Or call the background API endpoint
curl -X POST http://localhost:3000/api/background/tasks/cancel-expired-bookings \
  -H "x-background-task-key: YOUR_SECRET_KEY"
```

### 4. Cron Job Setup
Add to your system's crontab for regular execution:

```bash
# Run every hour
0 * * * * cd /path/to/wellness-app && node scripts/cancelExpiredBookings.js

# Run every 30 minutes
*/30 * * * * cd /path/to/wellness-app && node scripts/cancelExpiredBookings.js
```

## Security Configuration

### Environment Variables
Add to your `.env.local` file:

```env
# Background task authentication key
BACKGROUND_TASK_KEY=your-secure-background-key-here
JWT_SECRET=your-jwt-secret-here
```

### Authentication
- Manual API calls require valid JWT token with business or admin role
- Background tasks require `x-background-task-key` header
- Business dashboard automatically handles authentication

## Testing

### Test the System
1. Create test bookings with past dates or today's date with past times
2. Call the GET endpoint to preview which bookings would be cancelled
3. Call the POST endpoint to actually cancel them
4. Verify the bookings now show as 'cancelled' in the dashboard

### Example Test Data
```javascript
// Create a booking that should be cancelled (yesterday)
{
  customer: "test-customer-id",
  therapist: "test-therapist-id", 
  service: "test-service-id",
  date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  time: "10:00",
  status: "pending"
}

// Create a same-day booking that should be cancelled (past time)
{
  customer: "test-customer-id",
  therapist: "test-therapist-id",
  service: "test-service-id", 
  date: new Date(), // Today
  time: "08:00", // Past time
  status: "confirmed"
}
```

## Monitoring

### Console Output
The system logs all cancellation activities:
- Number of bookings cancelled
- Booking details (ID, customer, service, date, time)
- Timestamps of operations

### Error Handling
- Failed cancellations are logged but don't stop the process
- System continues processing other bookings even if some fail
- Detailed error messages help with troubleshooting

## Integration with Existing System

The automatic cancellation integrates seamlessly with:
- Business dashboard booking management
- Existing booking status workflows
- Customer and therapist notification systems (can be extended)
- Reporting and analytics

## Best Practices

1. **Run Frequency**: Hourly checks are recommended for most businesses
2. **Monitoring**: Set up logging to track cancellation activity
3. **Backup**: Consider backing up booking data before mass cancellations
4. **Notifications**: Plan to notify customers/therapists about automatic cancellations
5. **Testing**: Always test with a few bookings before full deployment

## Troubleshooting

### Common Issues
- **No bookings cancelled**: Check if there are actually expired bookings in the database
- **Authentication errors**: Verify JWT tokens and background task keys
- **Database connection**: Ensure MongoDB is accessible
- **Time zone issues**: System uses server time - ensure consistency

### Debug Mode
Enable detailed logging by checking console output or adding debug statements to see exactly which bookings are being evaluated.