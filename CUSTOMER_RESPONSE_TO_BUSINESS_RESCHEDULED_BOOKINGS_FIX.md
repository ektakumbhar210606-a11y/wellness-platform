# Customer Response to Business-Rescheduled Bookings Fix

## Issue Description
When a business rescheduled a booking using the "Reschedule Original" button, the customer could not see this response or take any action. The booking appeared as "Rescheduled" but there were no action buttons for the customer to accept or decline the rescheduling.

## Root Cause
The customer-side bookings page (`/dashboard/customer/bookings`) was treating all business responses (confirm, cancel, reschedule) the same way - just showing "Confirm Payment" button. It didn't distinguish between:
1. **Business confirmed** → Customer should pay
2. **Business rescheduled** → Customer should accept/decline the new time
3. **Business cancelled** → Booking is cancelled

## Solution Overview
Updated the customer bookings page to detect when a business has rescheduled and show appropriate action buttons:
- **"Accept Reschedule"** - Customer accepts the new time and proceeds to payment
- **"Decline & Cancel"** - Customer declines the reschedule and cancels the booking

## Files Modified

### 1. `wellness-app/app/dashboard/customer/bookings/page.tsx`

#### Change 1: Updated Actions Column (Line 181-245)
**Before:**
```typescript
{record.paymentStatus === 'pending' && (record.confirmedBy || record.cancelledBy || record.rescheduledBy || record.responseVisibleToBusinessOnly) ? (
  // Business response awaiting payment
  <>
    <Button size="small" type="primary" onClick={() => { ... }}>
      Confirm Payment
    </Button>
    <Button size="small" type="default" onClick={() => router.push(`/bookings/${record.id}/details`)}>
      View Details
    </Button>
    {!shouldRestrictReschedule(...) && (
      <Button size="small" onClick={() => router.push(`/bookings/${record.id}/reschedule`)}>
        Reschedule
      </Button>
    )}
  </>
) : (...)}
```

**After:**
```typescript
{record.paymentStatus === 'pending' && (record.confirmedBy || record.cancelledBy || record.rescheduledBy || record.responseVisibleToBusinessOnly) ? (
  // Business response awaiting payment
  <>
    {record.rescheduledBy ? (
      // Business has rescheduled - show accept/decline actions
      <>
        <Button
          size="small"
          type="primary"
          onClick={() => {
            setBookingToConfirm(record);
            setConfirmModalVisible(true);
          }}
        >
          Accept Reschedule
        </Button>
        <Button
          size="small"
          danger
          onClick={() => {
            setBookingToCancel(record);
            setCancelModalVisible(true);
          }}
        >
          Decline & Cancel
        </Button>
      </>
    ) : (
      // Regular confirmation - just pay
      <>
        <Button size="small" type="primary" onClick={() => { ... }}>
          Confirm Payment
        </Button>
      </>
    )}
    <Button size="small" type="default" onClick={() => router.push(`/bookings/${record.id}/details`)}>
      View Details
    </Button>
    {!shouldRestrictReschedule(...) && (
      <Button size="small" onClick={() => router.push(`/bookings/${record.id}/reschedule`)}>
        Reschedule
      </Button>
    )}
  </>
) : (...)}
```

#### Change 2: Updated Status Column (Line 301-396)
**Added special handling for business-rescheduled bookings:**

```typescript
// Special case: Business has rescheduled - awaiting customer response
else if (record.status === 'rescheduled' && record.rescheduledBy && record.paymentStatus === 'pending') {
  displayStatus = 'Rescheduled by Business';
  color = 'purple';
}
```

**Added status indicator:**
```typescript
{record.status === 'rescheduled' && record.rescheduledBy && record.paymentStatus === 'pending' && (
  <span style={{ marginLeft: 8, fontSize: '10px', opacity: 0.7 }}>
    (Awaiting Your Response)
  </span>
)}
```

## Complete Workflow

### When Business Reschedules:

1. **Business Action**:
   - Business clicks "Reschedule Original" in business dashboard
   - Selects new date/time
   - System sets:
     - `status = 'rescheduled'`
     - `rescheduledBy = businessUserId`
     - `responseVisibleToBusinessOnly = false` (immediately visible to customer)

2. **Customer Sees Booking**:
   - Status shows: **"Rescheduled by Business (Awaiting Your Response)"** in purple
   - Two action buttons appear:
     - ✅ **"Accept Reschedule"** - Primary action
     - ❌ **"Decline & Cancel"** - Danger action

3. **Customer Actions**:

   **Option A: Accept Reschedule**
   - Customer clicks "Accept Reschedule"
   - Opens payment confirmation modal
   - Customer confirms and pays
   - Booking continues with new schedule
   
   **Option B: Decline & Cancel**
   - Customer clicks "Decline & Cancel"
   - Opens cancellation modal
   - Customer provides reason (optional)
   - Booking is cancelled
   - Refund processed if applicable

## User Experience

### Before Fix
- ❌ Customer sees "Rescheduled" status with no context
- ❌ Only "Confirm Payment" button shown (unclear what they're confirming)
- ❌ No way to decline the reschedule
- ❌ Confusing UX - customer doesn't know they need to respond

### After Fix
- ✅ Clear status: "Rescheduled by Business (Awaiting Your Response)" in purple
- ✅ Two distinct actions: Accept or Decline
- ✅ Customer understands business changed the time
- ✅ Customer can either accept new time or cancel
- ✅ Proper workflow communication between business and customer

## Visual Design

### Status Colors
- **Purple** (`#722ed1`) - "Rescheduled by Business" (new, distinct color)
- **Gold** - Regular "Rescheduled" (customer-initiated)
- **Green** - "Confirmed" / "Paid"
- **Red** - "Cancelled"
- **Orange** - "Pending"

### Button Hierarchy
- **Primary (Blue)** - "Accept Reschedule" (positive action)
- **Danger (Red)** - "Decline & Cancel" (negative action)
- **Default (Gray)** - "View Details" (neutral action)

## Testing Steps

### Test Scenario 1: Customer Accepts Reschedule
1. Business reschedules a booking to new time
2. Customer logs in and goes to My Bookings
3. Verify status shows "Rescheduled by Business (Awaiting Your Response)" in purple
4. Verify two buttons: "Accept Reschedule" and "Decline & Cancel"
5. Customer clicks "Accept Reschedule"
6. Payment modal opens
7. Customer confirms payment
8. Booking status changes to confirmed/paid
9. New time is locked in

### Test Scenario 2: Customer Declines Reschedule
1. Business reschedules a booking to new time
2. Customer views the booking
3. Customer clicks "Decline & Cancel"
4. Cancellation modal opens
5. Customer provides reason (optional)
6. Customer confirms cancellation
7. Booking status changes to "cancelled"
8. Refund processed if payment was made
9. Business receives cancellation notification

### Test Scenario 3: Existing Confirmed Bookings Still Work
1. Business confirms a booking (not reschedule)
2. Customer views the booking
3. Verify status shows "Ready for Payment" in gold
4. Verify only "Confirm Payment" button appears (no "Decline" button)
5. Customer can pay normally

## API Considerations

### Backend Already Works
The backend already sets the correct flags when business reschedules:
- `status = 'rescheduled'` (line 182 in business reschedule route)
- `rescheduledBy = decoded.id` (line 178)
- `responseVisibleToBusinessOnly = false` (line 184)

No backend changes needed - the frontend now properly reads these flags!

### Customer Bookings API
The `/api/customer/bookings` endpoint already returns:
- `rescheduledBy` field
- `responseVisibleToBusinessOnly` field
- All necessary booking data

The frontend just wasn't using this information correctly until now.

## Related Documentation
- Business action buttons for therapist-rescheduled: `BUSINESS_ACTION_BUTTONS_FOR_THERAPIST_RESCHEDULED_BOOKINGS_FIX.md`
- Business action buttons for therapist-confirmed: `BUSINESS_BOOKING_ACTION_BUTTONS_FIX_COMPLETE.md`
- Three-stage booking workflow: `SYSTEM_REQUIREMENTS_SPECIFICATION.md`

## Future Enhancements
1. Show original vs new time comparison in the booking card
2. Add countdown timer: "Respond within X hours or booking will be auto-cancelled"
3. Send push notification/email when business reschedules
4. Allow customer to propose alternative time instead of just accept/decline
5. Track reschedule history (who rescheduled and when)

## Notes
- This fix completes the full circle of rescheduling workflows
- Business can now reschedule → Customer can respond
- Therapist can reschedule → Business can notify customer → Customer can respond
- All three roles (customer, business, therapist) now have proper communication flows
