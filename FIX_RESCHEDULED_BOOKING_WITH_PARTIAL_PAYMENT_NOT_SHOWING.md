# Fix: Rescheduled Bookings with Partial Payment Not Showing in Customer Dashboard

## Issue Description
A booking in the database had the following characteristics:
- `status: "rescheduled"`
- `responseVisibleToBusinessOnly: false` (should be visible to customer)
- `paymentStatus: "partial"` (customer has made partial payment)
- `rescheduledBy: "69798f3fbb46cf97b854e4ba"` (business rescheduled)
- `originalDate` and `originalTime` exist (tracking original schedule)

**Problem**: This booking was NOT appearing anywhere in the customer dashboard, even though it should be visible.

## Root Cause

The customer bookings page has TWO filters that were excluding this booking:

### Filter 1: "Booking Requests" Tab (Line 787-827)
This filter was checking:
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  booking.status === 'rescheduled' && 
  booking.rescheduledBy && 
  booking.paymentStatus === 'pending'; // ❌ REQUIRED 'pending' - excluded 'partial'
```

**Issue**: The filter required `paymentStatus === 'pending'`, but the booking had `paymentStatus = 'partial'`.

### Filter 2: "Confirmed Bookings" Tab (Line 830-834)
This filter checks:
```typescript
const confirmedBookings = bookings.filter(booking => {
  return (booking.status === 'confirmed' || booking.status === 'paid') && 
         (booking.paymentStatus === 'partial' || booking.paymentStatus === 'completed');
});
```

**Issue**: This filter only includes bookings with `status = 'confirmed'` or `'paid'`, but the booking has `status = 'rescheduled'`.

### Result
The booking fell through both filters:
- ❌ Not in "Requests" tab because payment status was 'partial' (not 'pending')
- ❌ Not in "Confirmed" tab because status was 'rescheduled' (not 'confirmed')
- ❌ Customer couldn't see it anywhere!

## Solution

### Updated Filter Logic for Rescheduled Bookings
**File**: `wellness-app/app/dashboard/customer/bookings/page.tsx`  
**Line**: 806-826

**Before:**
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  booking.status === 'rescheduled' && 
  booking.rescheduledBy && 
  booking.paymentStatus === 'pending'; // Only pending payments
```

**After:**
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  (booking.status === 'rescheduled' || booking.originalDate || booking.originalTime) && 
  booking.rescheduledBy && 
  !booking.confirmedBy; // If not confirmed by customer, show in requests
```

**Changes Made:**
1. **Check for rescheduling**: Either `status = 'rescheduled'` OR has `originalDate/originalTime`
2. **Check who rescheduled**: `rescheduledBy` field exists
3. **Check if customer accepted**: `!confirmedBy` - customer hasn't confirmed acceptance yet
4. **Removed payment status requirement**: Works for any payment status (pending/partial/completed)

### Updated Exclusion Logic
**File**: Same file  
**Line**: 794-805

**Before:**
```typescript
// IMMEDIATELY exclude bookings with partial or completed payment
// These should appear in the Confirmed Bookings tab
if (booking.status === 'confirmed' && 
    (booking.paymentStatus === 'partial' || booking.paymentStatus === 'completed')) {
  return false;
}
```

**After:**
```typescript
// Exclude confirmed bookings with partial/completed payment UNLESS they are rescheduled
// Rescheduled bookings should appear in requests tab regardless of payment status
if (booking.status === 'confirmed' && 
    (booking.paymentStatus === 'partial' || booking.paymentStatus === 'completed')) {
  return false;
}

// Don't exclude rescheduled bookings based on payment status - they need customer response first
```

**Why**: Rescheduled bookings should always appear in the Requests tab until the customer responds, regardless of payment status.

## Complete Workflow

### Scenario 1: Business Reschedules → Customer Has Paid Partially
1. **Initial State**: Booking is `confirmed` with `paymentStatus = 'partial'`
2. **Business Reschedules**: 
   - Sets `status = 'rescheduled'`
   - Sets `rescheduledBy = businessId`
   - Sets `originalDate` and `originalTime` (preserves old schedule)
   - Keeps `paymentStatus = 'partial'` (doesn't change payment)
3. **Customer Views Dashboard**:
   - ✅ Booking appears in "Booking Requests" tab
   - ✅ Status shows: "Rescheduled by Business (Awaiting Your Response)" in purple
   - ✅ Action buttons: "Accept Reschedule" + "Decline & Cancel"
4. **Customer Actions**:
   - **Accept**: Opens payment modal to complete remaining payment
   - **Decline**: Cancels booking, processes refund

### Scenario 2: Therapist Reschedules → Business Confirms → Customer Has Paid Partially
1. **Therapist Reschedules**:
   - Sets `status = 'rescheduled'`
   - Sets `responseVisibleToBusinessOnly = true` (customer can't see yet)
2. **Business Confirms**:
   - Sets `responseVisibleToBusinessOnly = false` (now customer can see)
   - Sets `confirmedBy = businessId` (business confirmed the reschedule)
3. **Customer Views Dashboard**:
   - ✅ Booking appears in "Booking Requests" tab (our fix!)
   - ✅ Even with `paymentStatus = 'partial'`
   - ✅ Can accept or decline the reschedule

## Testing Steps

### Test Case: Rescheduled Booking with Partial Payment
1. **Setup**: Create a booking with:
   - `status = 'rescheduled'`
   - `paymentStatus = 'partial'`
   - `rescheduledBy = <userId>`
   - `originalDate` and `originalTime` set
   - `responseVisibleToBusinessOnly = false`

2. **Login as Customer**:
   - Go to "My Bookings" → "Booking Requests" tab
   - Verify booking appears
   - Verify purple status tag: "Rescheduled by Business (Awaiting Your Response)"
   - Verify action buttons: "Accept Reschedule" + "Decline & Cancel"

3. **Customer Accepts**:
   - Click "Accept Reschedule"
   - Payment modal should open showing remaining balance
   - Complete payment
   - Booking moves to "Confirmed Bookings" tab

4. **Customer Declines**:
   - Click "Decline & Cancel"
   - Cancellation modal opens
   - Confirm cancellation
   - Booking moves to "Cancelled Bookings" tab
   - Refund processed

## Edge Cases Handled

### 1. Multiple Reschedules
- Booking has been rescheduled multiple times
- Still shows in requests tab as long as `!confirmedBy`
- Customer can still accept/decline the latest reschedule

### 2. Customer Confirmed the Reschedule
- When customer clicks "Accept Reschedule" and pays
- System sets `confirmedBy = customerId`
- Booking moves to "Confirmed Bookings" tab
- No longer shows in requests tab

### 3. Business Confirmed Without Customer Input
- Rare case: Business might manually confirm a reschedule
- System sets `confirmedBy = businessId`
- Booking would move to "Confirmed Bookings" tab
- Customer sees it as already accepted

## Related Files Modified

**Primary Fix**:
1. **`wellness-app/app/dashboard/customer/bookings/page.tsx`**
   - Line 806-826: Updated rescheduled booking filter logic
   - Line 794-805: Updated exclusion logic to allow rescheduled bookings with any payment status

**Previously Fixed** (for complete workflow):
2. **`wellness-app/app/api/bookings/business/route.ts`**
   - Line 459-466: Allow business to process therapist-rescheduled bookings
   - Line 471-488: Set visibility when processing rescheduled bookings

## Impact

✅ **Before Fix**: Rescheduled bookings with partial payment invisible to customers  
✅ **After Fix**: All rescheduled bookings appear in "Requests" tab until customer responds  

### Why This Matters
- Customers can respond to ALL rescheduling, regardless of payment status
- Prevents bookings from getting "stuck" where no one can see them
- Maintains proper three-stage workflow: Therapist → Business → Customer
- Ensures partial payments don't bypass the reschedule acceptance flow

## Database Example

Your booking now works correctly:
```javascript
{
  "_id": "69c650bf752060d30f09b325",
  "status": "rescheduled",
  "paymentStatus": "partial",        // ✅ Now shows in Requests tab
  "responseVisibleToBusinessOnly": false,  // ✅ Visible to customer
  "rescheduledBy": "69798f3fbb46cf97b854e4ba",
  "originalDate": "2026-03-30T00:00:00.000Z",  // ✅ Was rescheduled
  "originalTime": "10:00",
  "confirmedBy": undefined  // ✅ Customer hasn't confirmed yet
}
```

**Result**: ✅ Appears in "Booking Requests" tab with action buttons!

## Notes
- This fix works alongside previous fixes for the complete rescheduling workflow
- Payment status no longer blocks rescheduled bookings from appearing in requests tab
- Customer confirmation (`confirmedBy`) is now the key factor, not payment status
- Maintains backward compatibility with existing booking flows
