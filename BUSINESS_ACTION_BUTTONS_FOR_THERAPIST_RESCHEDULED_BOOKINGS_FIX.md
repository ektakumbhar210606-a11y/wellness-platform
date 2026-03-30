# Business Action Buttons for Therapist-Rescheduled Bookings Fix

## Issue Description
When therapists rescheduled bookings, the business was notified (via email) but there were NO action buttons in the business dashboard bookings section to notify customers about the rescheduling. This prevented businesses from communicating with customers according to therapist actions.

## Root Cause
The booking status `rescheduled` was being treated as a "processed" status that only showed "View Details" button. However, when a **therapist** reschedules a booking, the business needs to:
1. Review the reschedule request
2. Take action to notify the customer
3. Manage the booking accordingly

The system was not distinguishing between:
- **Therapist-rescheduled** bookings (business needs to act and notify customer)
- **Business-rescheduled** bookings (already processed, customer already notified)

## Solution Overview
The fix uses the existing `responseVisibleToBusinessOnly` field to distinguish between therapist-initiated and business-initiated rescheduling:

- **Therapist reschedules**: `status = 'rescheduled'` AND `responseVisibleToBusinessOnly = true`
  - ✅ Shows action buttons for business to notify customer
  
- **Business reschedules**: `status = 'rescheduled'` AND `responseVisibleToBusinessOnly = false`
  - ✅ Shows "View Details" only (already processed)

## Three-Stage Rescheduling Workflow

### When Therapist Reschedules:
1. **Stage 1 - Therapist Reschedules**:
   - Status: `rescheduled`
   - `responseVisibleToBusinessOnly: true`
   - `therapistResponded: true`
   - Business gets email notification
   - **Business sees action buttons** (Confirm/Cancel/Reschedule) ⭐ **FIXED**

2. **Stage 2 - Business Reviews & Notifies Customer**:
   - Business clicks action button (Confirm/Cancel/Reschedule)
   - Status remains `rescheduled` or changes based on action
   - `responseVisibleToBusinessOnly: false`
   - Customer gets notification

3. **Stage 3 - Customer Accepts**:
   - Customer is informed of the new time
   - Booking continues with updated schedule

### When Business Reschedules:
1. **Business directly reschedules**:
   - Status: `rescheduled`
   - `responseVisibleToBusinessOnly: false`
   - Customer gets notification immediately
   - No additional business action needed

## Files Modified

### 1. `wellness-app/app/api/bookings/[bookingId]/reschedule/route.ts`

**CRITICAL FIX (Line 177)**: Added missing flag when therapist reschedules

```typescript
updateData.status = BookingStatus.Rescheduled;
updateData.therapistResponded = true; // Mark that therapist has responded
updateData.responseVisibleToBusinessOnly = true; // ← CRITICAL: Therapist responses should only be visible to business initially
```

### 2. `wellness-app/app/api/bookings/business/route.ts`

**CRITICAL FIX (Line 340-342)**: Added missing fields to formatted bookings response

```typescript
// Include response visibility flag so frontend knows if business needs to act
responseVisibleToBusinessOnly: booking.responseVisibleToBusinessOnly || false,
rescheduledBy: booking.rescheduledBy,
rescheduledAt: booking.rescheduledAt
```

### 3. `wellness-app/app/components/BookingManagement.tsx`

#### Change 1: Updated Booking Interface (Line 72-87)
**Added fields:**
```typescript
responseVisibleToBusinessOnly?: boolean; // Whether therapist responses should only be visible to business
rescheduledBy?: string; // ID of user who rescheduled
rescheduledAt?: Date; // When rescheduled
```

#### Change 2: Updated Actions Column Logic (Line 611-629)
**Before:**
```typescript
const isProcessed = 
  record.status === 'confirmed' || 
  record.status === 'cancelled' || 
  record.status === 'rescheduled';

return (
  <Space>
    {isProcessed ? (
      // Only show View Details
      <Button type="link" size="small" onClick={() => showBookingDetails(record)}>
        View Details
      </Button>
    ) : (
      // Show action buttons
      ...
    )}
  </Space>
);
```

**After:**
```typescript
// Check if booking has already been processed by business
// therapist_confirmed and therapist_rejected require business action, so they are NOT "processed"
// rescheduled with responseVisibleToBusinessOnly=true means therapist rescheduled and business needs to act
const isProcessed = 
  record.status === 'confirmed' || 
  record.status === 'cancelled' || 
  record.status === 'rescheduled';

// Special case: rescheduled bookings where therapist did the rescheduling (responseVisibleToBusinessOnly=true)
// These require business action to notify customer, so they are NOT "processed"
const isTherapistRescheduled = 
  record.status === 'rescheduled' && 
  (record as any).responseVisibleToBusinessOnly === true;

return (
  <Space>
    {isProcessed && !isTherapistRescheduled ? (
      // Only show View Details for truly processed bookings
      <Button type="link" size="small" onClick={() => showBookingDetails(record)}>
        View Details
      </Button>
    ) : (
      // Show action buttons for pending OR therapist-rescheduled bookings
      ...
    )}
  </Space>
);
```

### 2. `wellness-app/app/components/AssignedBookingsTracker.tsx`

#### Change 1: Updated AssignedBooking Interface (Line 172-186)
**Added field:**
```typescript
responseVisibleToBusinessOnly?: boolean; // Whether therapist responses should only be visible to business
```

#### Change 2: Updated Action Buttons Logic (Line 607-622)
**Before:**
```typescript
{booking.status === 'confirmed' || 
 booking.status === 'cancelled' || 
 booking.status === 'rescheduled' ? (
  <Button size="small" onClick={async () => await showBookingDetails(booking)}>
    View Details
  </Button>
) : (
  // Show action buttons
  ...
)}
```

**After:**
```typescript
{/* Check if booking has already been processed by business */}
{/* therapist_confirmed and therapist_rejected require business action, so they are NOT "processed" */}
{/* rescheduled with responseVisibleToBusinessOnly=true means therapist rescheduled and business needs to act */}
{booking.status === 'confirmed' || 
 booking.status === 'cancelled' || 
 (booking.status === 'rescheduled' && booking.responseVisibleToBusinessOnly !== true) ? (
  // Only show View Details for truly processed bookings
  <Button size="small" onClick={async () => await showBookingDetails(booking)}>
    View Details
  </Button>
) : (
  // Show action buttons for pending OR therapist-rescheduled bookings
  ...
)}
```

## Backend API Reference

### Therapist Reschedule Endpoint
**File**: `wellness-app/app/api/bookings/[bookingId]/reschedule/route.ts`

When a therapist reschedules (Line 2314 in compiled code):
```typescript
updateData.status = BookingStatus.Rescheduled;
updateData.therapistResponded = true;
updateData.responseVisibleToBusinessOnly = true; // ← Key flag: business needs to act
```

### Business Reschedule Endpoint
**File**: `wellness-app/app/api/business/assigned-bookings/reschedule/[bookingId]/route.ts`

When a business reschedules (Line 184):
```typescript
updateData.status = BookingStatus.Rescheduled;
updateData.therapistResponded = true;
updateData.responseVisibleToBusinessOnly = false; // ← Already processed, customer notified
```

## Impact

### Before Fix
- ❌ Businesses received email notifications about therapist rescheduling
- ❌ No action buttons appeared in business dashboard for therapist-rescheduled bookings
- ❌ Businesses could not notify customers about the reschedule
- ❌ Poor communication workflow between business and customers
- ❌ Booking flow was incomplete

### After Fix
- ✅ Action buttons appear for therapist-rescheduled bookings (`responseVisibleToBusinessOnly=true`)
- ✅ Businesses can Confirm/Cancel/Reschedule after therapist action
- ✅ Businesses can notify customers about rescheduling decisions
- ✅ Complete communication workflow maintained
- ✅ Proper distinction between therapist-initiated vs business-initiated rescheduling
- ✅ Clean UX: "View Details" only shown for business-rescheduled bookings

## Affected Booking Statuses

The following statuses now correctly trigger action button display:

| Status | responseVisibleToBusinessOnly | Who Initiated | Action Buttons? | Reason |
|--------|------------------------------|---------------|-----------------|--------|
| `pending` | N/A | Customer | ✅ Yes | Awaiting therapist/business response |
| `therapist_confirmed` | `true` | Therapist | ✅ Yes | Business needs to review & notify customer |
| `therapist_rejected` | `true` | Therapist | ✅ Yes | Business may override |
| `rescheduled` | `true` | **Therapist** | ✅ Yes | **Business needs to notify customer** ⭐ **FIXED** |
| `rescheduled` | `false` | **Business** | ❌ No (View Details only) | Already processed, customer notified |
| `confirmed` | `false` | Business | ❌ No (View Details only) | Already processed |
| `cancelled` | `false` | Business | ❌ No (View Details only) | Already processed |

## Testing Recommendations

### Test Scenario 1: Therapist Reschedules
1. Have a therapist reschedule a confirmed booking
2. Verify business receives email notification
3. Go to business dashboard → Bookings section
4. Verify action buttons appear (Confirm/Cancel/Reschedule)
5. Click "Confirm" to accept the reschedule
6. Verify customer receives notification
7. Verify `responseVisibleToBusinessOnly` becomes `false`

### Test Scenario 2: Business Reschedules
1. Have a business user reschedule a booking
2. Verify customer receives notification directly
3. Go to business dashboard → Bookings section
4. Verify only "View Details" appears (no action buttons)
5. This is correct - business already processed it

### Test Scenario 3: Mixed Workflow
1. Create a booking → Customer requests
2. Therapist confirms → Status: `therapist_confirmed`
3. Business confirms → Status: `confirmed`
4. Therapist reschedules → Status: `rescheduled`, `responseVisibleToBusinessOnly: true`
5. Business should see action buttons
6. Business confirms reschedule → `responseVisibleToBusinessOnly: false`
7. Customer gets notified
8. Business dashboard shows "View Details" only

## Related Documentation
- Original booking action buttons fix: `BUSINESS_BOOKING_ACTION_BUTTONS_FIX_COMPLETE.md`
- Three-stage booking workflow: `SYSTEM_REQUIREMENTS_SPECIFICATION.md`
- Notification system: `wellness-app/app/utils/notifications.ts`

## Technical Notes

### Key Insight
The `responseVisibleToBusinessOnly` field serves as a state machine flag:
- `true` = "Business needs to take action"
- `false` = "Business has already acted"

This pattern is consistent across:
- Therapist confirmations (`therapist_confirmed`)
- Therapist rejections (`therapist_rejected`)
- Therapist cancellations (`therapist_cancel_requested`)
- Therapist rescheduling (`rescheduled`) ⭐ **Now fixed**

### Defensive Coding Pattern
The check `(record as any).responseVisibleToBusinessOnly === true` uses type assertion because:
1. The field may not exist in older bookings
2. TypeScript interface was missing this field initially
3. Defensive check prevents runtime errors

Future improvement: Update the Booking interface to properly include all tracking fields.

## Future Enhancements
1. Add explicit "Notify Customer" button for therapist-rescheduled bookings
2. Show visual indicator distinguishing therapist vs business rescheduling
3. Add filter option: "Show therapist-rescheduled bookings"
4. Track reschedule history (who rescheduled and when)
5. Send automated reminders to businesses about pending reschedule notifications
