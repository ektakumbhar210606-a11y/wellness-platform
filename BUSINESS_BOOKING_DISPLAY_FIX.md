# Business Dashboard Booking Display Fix

## Problem Description

When a therapist responded to a booking request (confirm/cancel/reschedule) and the business processed that response, the original customer booking request would disappear from the **Bookings** section of the business dashboard. This prevented businesses from seeing the complete booking history and responding to customers appropriately based on the therapist's response.

### Flow Before Fix:
1. Customer books a service → Status: `pending` → ✅ Visible in Bookings tab
2. Business assigns to therapist → Status: `pending` → ✅ Visible in Bookings tab
3. Therapist responds (confirm/cancel/reschedule) → Status: `therapist_confirmed` → ✅ Visible in Bookings tab
4. Business processes therapist response → Status: `confirmed`/`cancelled`/`rescheduled` → ❌ **DISAPPEARS** from Bookings tab

## Root Cause

The `/api/bookings/business` endpoint was filtering bookings to only show:
- Status: `pending` or `therapist_confirmed` (default when no status specified)

After a business processed a therapist's response, the booking status changed to:
- `confirmed`, `cancelled`, or `rescheduled`

These statuses were excluded from the default query, causing the booking to disappear from the business dashboard's bookings section.

## Solution Implemented

### 1. Updated Booking Query Logic (`/api/bookings/business/route.ts`)

Modified the GET endpoint to use an `$or` query that includes:

```typescript
query.$or = [
  // Group 1: Awaiting therapist response or action
  { status: { $in: ['pending', 'therapist_confirmed'] } },
  // Group 2: Therapist has responded and business has processed the response
  { 
    status: { $in: ['confirmed', 'cancelled', 'rescheduled'] },
    therapistResponded: true 
  }
];
```

This ensures the bookings section shows:
- **Pending bookings** - awaiting therapist response
- **Therapist confirmed bookings** - therapist has confirmed, awaiting business final action
- **Processed bookings** - where therapist responded AND business took action (confirmed/cancelled/rescheduled)

### 2. Updated Booking Update Logic

Modified the PATCH endpoint to set `therapistResponded: true` for ALL bookings when business confirms/cancels, not just admin-assigned ones:

```typescript
// For direct customer bookings, also mark as therapist responded
// This ensures the booking remains visible in the requests tab for business reference
updateData.therapistResponded = true;
```

Previously, only admin-assigned bookings had `therapistResponded: true`, which meant direct customer bookings would disappear after business action.

## What Changed

### File Modified
- `wellness-app/app/api/bookings/business/route.ts`

### Key Changes
1. **Query Structure** (Lines 136-180): Changed from simple status filter to `$or` query
2. **Type Definition** (Line 136-142): Added `therapistResponded` and `$or` properties to query type
3. **Debug Logging** (Lines 220-240): Updated to track counts for different booking categories
4. **Update Logic** (Lines 465-477): Set `therapistResponded: true` for all booking types when business takes action

## Expected Behavior After Fix

### Complete Flow:
1. Customer books a service → Status: `pending` → ✅ **Visible** in Bookings tab
2. Business assigns to therapist → Status: `pending` → ✅ **Visible** in Bookings tab
3. Therapist responds (confirm) → Status: `therapist_confirmed` → ✅ **Visible** in Bookings tab
4. Business confirms therapist response → Status: `confirmed`, therapistResponded: `true` → ✅ **STAYS VISIBLE** in Bookings tab

### Business Can Now:
- See the complete booking history including original customer requests
- View therapist responses alongside customer information
- Respond to customers appropriately based on therapist decisions
- Track which bookings have been processed after therapist response

## Testing Recommendations

1. **Test Case 1: Direct Customer Booking**
   - Create a booking as a customer
   - Assign to therapist as business
   - Have therapist confirm the booking
   - Business confirms the therapist response
   - ✅ Verify booking still appears in Bookings tab

2. **Test Case 2: Therapist Cancel Request**
   - Create a booking and assign to therapist
   - Therapist requests cancellation
   - Business approves cancellation
   - ✅ Verify booking still appears in Bookings tab with cancelled status

3. **Test Case 3: Therapist Reschedule**
   - Create a booking and assign to therapist
   - Therapist reschedules
   - Business confirms the reschedule
   - ✅ Verify booking still appears in Bookings tab with rescheduled status

4. **Test Case 4: Multiple Statuses**
   - Check that pending bookings still appear
   - Check that therapist_confirmed bookings still appear
   - Check that processed bookings (confirmed/cancelled/rescheduled) now appear
   - ✅ All categories should be visible simultaneously

## Notes

- The fix maintains backward compatibility with existing booking flows
- No database migrations required - uses existing `therapistResponded` field
- The "Booking Responses" tab in the business dashboard continues to work as before
- This fix complements the Booking Responses tab by ensuring bookings are visible in both places
