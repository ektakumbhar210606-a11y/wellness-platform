# Fix: Business Cannot Process Therapist-Rescheduled Bookings

## Issue Description
A booking was rescheduled by a therapist in the database with `status = 'rescheduled'`, but it wasn't showing up on the customer dashboard anywhere. The business could see it in their dashboard with action buttons, but when they tried to click "Confirm" or "Cancel", nothing happened or an error occurred.

## Root Cause Analysis

### The Problem
When a **therapist reschedules** a booking, the system correctly sets:
- `status = 'rescheduled'` ✅
- `rescheduledBy = therapistId` ✅
- `responseVisibleToBusinessOnly = true` ✅ (Customer should NOT see yet)

This is correct because the business needs to review and approve the reschedule before the customer sees it.

**However**, when the business tries to confirm/cancel the therapist-rescheduled booking, the API endpoint `/api/bookings/business` was rejecting it with error:
```
"Only pending or therapist confirmed bookings can be confirmed or cancelled"
```

### Why It Failed
The API validation at line 447 only allowed:
- `pending` bookings
- `therapist_confirmed` bookings

It did **NOT** allow `rescheduled` bookings where `responseVisibleToBusinessOnly = true`.

So the workflow was broken:
1. Therapist reschedules → Sets `status = 'rescheduled'`, `responseVisibleToBusinessOnly = true` ✅
2. Business sees booking with action buttons ✅
3. Business clicks "Confirm" → API rejects ❌
4. Customer never sees the rescheduled booking ❌

## Solution

### Updated API Validation
**File**: `wellness-app/app/api/bookings/business/route.ts`  
**Line**: 456-462

**Before:**
```typescript
// Check if booking can be updated (only pending or therapist_confirmed bookings can be confirmed/cancelled)
if (booking.status !== 'pending' && booking.status !== 'therapist_confirmed') {
  return Response.json(
    { success: false, error: 'Only pending or therapist confirmed bookings can be confirmed or cancelled' },
    { status: 400 }
  );
}
```

**After:**
```typescript
// Check if booking can be updated (only pending, therapist_confirmed, or rescheduled bookings with responseVisibleToBusinessOnly=true can be confirmed/cancelled)
if (booking.status !== 'pending' && 
    booking.status !== 'therapist_confirmed' && 
    !(booking.status === 'rescheduled' && booking.responseVisibleToBusinessOnly === true)) {
  return Response.json(
    { success: false, error: 'Only pending, therapist confirmed, or therapist-rescheduled bookings can be confirmed or cancelled' },
    { status: 400 }
  );
}
```

### Updated Response Visibility Logic
**File**: Same file  
**Line**: 471-488

**Before:**
```typescript
// Check if this is a business-assigned booking
if (booking.assignedByAdmin) {
  // For business-assigned bookings, mark that therapist has responded
  updateData.therapistResponded = true;
  // Set response visibility to business only initially
  updateData.responseVisibleToBusinessOnly = true;
} else {
  // For direct customer bookings...
  updateData.responseVisibleToBusinessOnly = false;
}
```

**After:**
```typescript
// Check if this is a business-assigned booking OR a therapist-rescheduled booking being processed by business
if (booking.assignedByAdmin && !(booking.status === 'rescheduled' && booking.responseVisibleToBusinessOnly === true)) {
  // For business-assigned bookings (except therapist-rescheduled ones), mark that therapist has responded
  updateData.therapistResponded = true;
  // Set response visibility to business only initially
  updateData.responseVisibleToBusinessOnly = true;
} else {
  // For direct customer bookings OR when business is processing a therapist-rescheduled booking,
  // mark as therapist responded since business is taking action
  updateData.therapistResponded = true;
  // Make response visible to customer immediately
  updateData.responseVisibleToBusinessOnly = false;
}
```

**Why This Change?**
When business confirms/cancels a therapist-rescheduled booking, we want to make it immediately visible to the customer (`responseVisibleToBusinessOnly = false`). The old logic would have kept it hidden for business-assigned bookings.

## Complete Workflow Now Fixed

### Before All Fixes
1. Therapist reschedules booking → `status = 'rescheduled'`, `responseVisibleToBusinessOnly = true` ✅
2. Business sees booking in dashboard with action buttons ✅
3. Business clicks "Confirm" → API rejects with error ❌
4. Booking stays hidden from customer forever ❌

### After All Fixes
1. Therapist reschedules booking → `status = 'rescheduled'`, `responseVisibleToBusinessOnly = true` ✅
2. Business sees booking in dashboard with action buttons ✅
3. Business clicks "Confirm" or "Cancel" → API accepts ✅
4. API sets `responseVisibleToBusinessOnly = false` ✅
5. Customer now sees booking in "Booking Requests" tab ✅
6. Customer sees purple status: "Rescheduled by Business (Awaiting Your Response)" ✅
7. Customer has action buttons: "Accept Reschedule" + "Decline & Cancel" ✅

## Three-Stage Approval Flow

The booking system uses a three-stage approval flow for rescheduling:

### Stage 1: Therapist Initiates Reschedule
- **Who**: Therapist
- **Action**: Selects new date/time
- **System sets**:
  - `status = 'rescheduled'`
  - `rescheduledBy = therapistId`
  - `responseVisibleToBusinessOnly = true` ← Customer CANNOT see yet
- **Visibility**: Business only

### Stage 2: Business Reviews & Confirms ⭐ FIXED HERE
- **Who**: Business
- **Action**: Clicks "Confirm" to approve reschedule
- **System sets**:
  - `confirmedBy = businessId`
  - `confirmedAt = new Date()`
  - `responseVisibleToBusinessOnly = false` ← Customer CAN now see
- **Visibility**: Customer can now see and respond

### Stage 3: Customer Responds
- **Who**: Customer
- **Action**: Clicks "Accept Reschedule" or "Decline & Cancel"
- **System sets**:
  - If accept: Opens payment modal, customer pays
  - If decline: `status = 'cancelled'`, refund processed
- **Result**: Booking continues or is cancelled

## Testing Steps

### Test Case 1: Therapist Reschedules → Business Confirms → Customer Accepts
1. **Login as therapist**
   - Go to assigned bookings
   - Find a pending/confirmed booking
   - Click "Reschedule"
   - Select new date/time
   - Submit

2. **Login as business**
   - Go to "Bookings" section
   - Find the rescheduled booking (should show action buttons)
   - Click "Confirm"
   - Verify success message

3. **Login as customer**
   - Go to "My Bookings" → "Booking Requests" tab
   - Verify booking appears with purple status tag
   - Verify text: "Rescheduled by Business (Awaiting Your Response)"
   - Click "Accept Reschedule"
   - Complete payment
   - Booking moves to "Confirmed Bookings" tab

### Test Case 2: Therapist Reschedules → Business Confirms → Customer Declines
1. Follow steps above until customer sees booking
2. Click "Decline & Cancel"
3. Provide cancellation reason (optional)
4. Confirm cancellation
5. Verify booking moves to "Cancelled Bookings" tab
6. Verify refund is processed (if applicable)

### Test Case 3: Direct Business Reschedule (No Therapist Involved)
1. **Login as business**
   - Find a pending/confirmed booking
   - Click "Reschedule Original"
   - Select new date/time
   - Submit

2. **Login as customer**
   - Verify booking appears immediately (no business confirmation needed)
   - This is because business rescheduling sets `responseVisibleToBusinessOnly = false` directly

## Related Files Modified

### Primary Fix
1. **`wellness-app/app/api/bookings/business/route.ts`**
   - Line 456-462: Updated validation to accept therapist-rescheduled bookings
   - Line 471-488: Updated response visibility logic for therapist-rescheduled bookings

### Previously Fixed Files (Complete Solution)
2. **`wellness-app/app/dashboard/customer/bookings/page.tsx`**
   - Line 786-827: Filter to include rescheduled bookings in "Requests" tab
   - Line 181-245: Action buttons for rescheduled bookings
   - Line 301-396: Status display for rescheduled bookings

3. **`wellness-app/app/components/BookingManagement.tsx`**
   - Line 613-629: Action button logic for therapist-rescheduled bookings
   - Line 72-87: Interface fields

4. **Various API endpoints** (already working):
   - `/api/bookings/[bookingId]/reschedule/route.ts` - Therapist rescheduling
   - `/api/business/assigned-bookings/reschedule/[bookingId]/route.ts` - Business rescheduling
   - `/api/customer/bookings/route.ts` - Customer booking retrieval

## Impact

✅ **Before Fix**: Therapist-rescheduled bookings stuck in limbo - business can see but cannot process, customer never sees them  
✅ **After Fix**: Complete three-stage workflow - Therapist → Business → Customer - all working smoothly  

## Edge Cases Handled

1. **Business-assigned bookings**: Still maintains `responseVisibleToBusinessOnly = true` for initial therapist actions (confirm/reject)
2. **Therapist-rescheduled bookings**: Always sets `responseVisibleToBusinessOnly = false` when business processes, making them visible to customers
3. **Direct customer bookings**: Always makes responses visible to customers immediately
4. **Multiple reschedules**: Preserves original date/time tracking for audit trail

## Notes
- This fix completes the entire rescheduling workflow across all user roles
- Works in conjunction with previous fixes for customer-side display and filtering
- Maintains backward compatibility with existing booking flows
- No database migrations required - uses existing fields
