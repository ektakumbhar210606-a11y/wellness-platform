# Troubleshooting: "Booking cannot be cancelled" Error

## Error Message
```
This booking cannot be cancelled as it is already in a final state
```

Or the new detailed error:
```
This booking cannot be cancelled as it has status 'XXX'. Only bookings with status 'pending', 'confirmed', 'paid', or 'rescheduled' can be cancelled.
```

## Root Cause
The booking you're trying to cancel has a status that doesn't allow customer-initiated cancellation.

## Allowed Statuses for Customer Cancellation

Customers can ONLY cancel bookings with these statuses:
1. ✅ **`pending`** - Booking awaiting therapist confirmation
2. ✅ **`therapist_confirmed`** - Therapist confirmed, waiting for business
3. ✅ **`confirmed`** - Business confirmed, awaiting/complete payment
4. ✅ **`paid`** - Payment completed
5. ✅ **`rescheduled`** - Booking was rescheduled

## Blocked Statuses (Cannot Cancel)

These statuses CANNOT be cancelled by customers:
- ❌ **`cancelled`** - Already cancelled
- ❌ **`cancelled_by_therapist`** - Cancelled by therapist
- ❌ **`therapist_cancel_requested`** - Therapist requested cancellation (pending business approval)
- ❌ **`completed`** - Service already completed
- ❌ **`no-show`** - Customer didn't show up
- ❌ **`therapist_rejected`** - Therapist rejected the booking

## How to Check Booking Status

### Method 1: Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for the log message when clicking Cancel:
   ```
   Attempting to cancel booking: {
     id: "b8",
     status: "confirmed",
     paymentStatus: "partial"
   }
   ```

### Method 2: MongoDB Query
```javascript
// Find specific booking
db.bookings.findOne({ _id: ObjectId("YOUR_BOOKING_ID") })

// Check status field
{
  _id: ObjectId("..."),
  status: "confirmed",  // <-- This is what matters
  paymentStatus: "partial",
  ...
}
```

### Method 3: API Response
When cancellation fails, check the detailed error in Network tab:
1. Open DevTools → Network tab
2. Click Cancel button
3. Find the failed POST request to `/api/customer/bookings/:id/cancel`
4. Check Response body:
   ```json
   {
     "success": false,
     "error": "This booking cannot be cancelled as it has status 'completed'..."
   }
   ```

## Common Scenarios

### Scenario 1: Already Cancelled Booking
**Problem:** Trying to cancel a booking that's already cancelled
**Status:** `cancelled`
**Solution:** Cannot cancel again. Check cancelled bookings tab.

### Scenario 2: Therapist Already Cancelled
**Problem:** Therapist cancelled and business approved
**Status:** `cancelled_by_therapist`
**Solution:** Refund will be processed automatically. No action needed.

### Scenario 3: Therapist Requested Cancellation (Pending)
**Problem:** Therapist requested cancellation, waiting for business approval
**Status:** `therapist_cancel_requested`
**Solution:** Wait for business to approve/reject. If approved, full refund issued.

### Scenario 4: Service Already Completed
**Problem:** Trying to cancel after service was completed
**Status:** `completed`
**Solution:** Cannot cancel completed services. Contact business for issues.

### Scenario 5: Within 24 Hours
**Problem:** Booking is within 24 hours of scheduled time
**Error:** "Bookings cannot be cancelled within 24 hours of the scheduled time"
**Solution:** Contact business directly to cancel.

## Debugging Steps

### Step 1: Check Console Logs
Open browser console and look for:
```javascript
Attempting to cancel booking: {
  id: "b8",
  status: "xxx",  // <-- Check this value
  paymentStatus: "xxx"
}
```

### Step 2: Check API Logs
Server console will show:
```javascript
Checking cancellation eligibility: {
  bookingId: "...",
  currentStatus: "xxx",  // <-- Check this value
  allowedStatuses: ["pending", "therapist_confirmed", "confirmed", "paid", "rescheduled"],
  isAllowed: false  // <-- Will be false if blocked
}
```

### Step 3: Verify in Database
Connect to MongoDB and run:
```javascript
// Replace with actual booking ID
db.bookings.findOne({ 
  displayId: "b8" 
}, {
  status: 1,
  paymentStatus: 1,
  customerCancelReason: 1,
  refundAmount: 1
})
```

## Solutions

### If Status is `therapist_confirmed`
This should now work! I've updated the API to allow this status.
**Action:** Try cancelling again.

### If Status is `therapist_cancel_requested`
This means therapist already requested cancellation.
**Action:** Wait for business response. Full refund will be issued if approved.

### If Status is `cancelled` or `cancelled_by_therapist`
Booking is already cancelled.
**Action:** Check refund status in cancelled bookings tab.

### If Status is `completed`
Service was already completed.
**Action:** Cannot cancel. Contact business for any issues.

### If Status is `no-show`
Customer didn't show up for appointment.
**Action:** Cannot cancel. Contact business for resolution.

## Expected Behavior After Fix

### Valid Cancellation (>24 hours before):
1. Click "Cancel" button
2. Modal shows refund calculation (45% refund)
3. Enter optional reason
4. Click "Yes, Cancel"
5. Success message: "Booking cancelled successfully. Refund of ₹XXX will be processed"
6. Booking moves to "Cancelled Bookings" tab
7. Shows: 👤 [reason], ⚠️ 10% cancellation fee applied

### Invalid Cancellation (<24 hours before):
1. Click "Cancel" button
2. Error immediately: "Bookings cannot be cancelled within 24 hours..."
3. Must contact business directly

### Blocked Cancellation (wrong status):
1. Click "Cancel" button
2. Error: "This booking cannot be cancelled as it has status 'xxx'"
3. Check status and follow appropriate action

## Quick Reference Table

| Status | Can Customer Cancel? | Reason | Action |
|--------|---------------------|---------|---------|
| pending | ✅ Yes | Normal cancellation | Proceed with 10% penalty |
| therapist_confirmed | ✅ Yes | Awaiting business processing | Proceed with 10% penalty |
| confirmed | ✅ Yes | Ready for payment or paid | Proceed with 10% penalty |
| paid | ✅ Yes | Payment completed | Proceed with 10% penalty |
| rescheduled | ✅ Yes | Was rescheduled | Proceed with 10% penalty |
| cancelled | ❌ No | Already cancelled | Check refund status |
| cancelled_by_therapist | ❌ No | Therapist cancelled | Full refund processing |
| therapist_cancel_requested | ❌ No | Pending business approval | Wait for decision |
| completed | ❌ No | Service done | Contact business |
| no-show | ❌ No | Didn't attend | Contact business |
| therapist_rejected | ❌ No | Therapist rejected | Alternative booking needed |

## Related Files

### Backend
- `app/api/customer/bookings/[bookingId]/cancel/route.ts` - Cancellation API with status checks
- `models/Booking.ts` - Booking status enum definition

### Frontend
- `app/dashboard/customer/bookings/page.tsx` - Customer bookings page with cancellation logic

## Still Having Issues?

If you're still seeing the error:

1. **Check the exact status** from console logs
2. **Verify the booking ID** matches what you expect
3. **Check if someone else already cancelled** (business/therapist)
4. **Look for other cancellation requests** in progress
5. **Review server logs** for detailed error messages

## Example Debug Output

```javascript
// Browser Console
Attempting to cancel booking: {
  id: "b8",
  status: "confirmed",      // ✅ This is allowed
  paymentStatus: "partial"
}

// Server Console
Checking cancellation eligibility: {
  bookingId: "67...",
  currentStatus: "confirmed",  // ✅ Matches allowed status
  allowedStatuses: ["pending", "therapist_confirmed", "confirmed", "paid", "rescheduled"],
  isAllowed: true  // ✅ Will proceed
}

// Result: Success! Modal proceeds to confirmation.
```

## Memory Aid

**Remember:** Customers can cancel bookings that are:
- **P**ending
- **T**herapist confirmed  
- **C**onfirmed
- **P**aid
- **R**escheduled

**Mnemonic:** "**PTCPR**" = "**P**lease **T**ell **C**ustomer **P**ayment **R**eceived" (all good to cancel!)
