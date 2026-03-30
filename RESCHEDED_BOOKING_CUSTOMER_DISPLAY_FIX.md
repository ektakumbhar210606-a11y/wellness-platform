# Fix: Business-Rescheduled Booking Not Displaying for Customer

## Issue
When a business reschedules a booking from the business dashboard, the booking was not appearing anywhere in the customer's dashboard bookings section, even though it existed in the database with `status: "rescheduled"`.

### Example Booking Data
```json
{
  "_id": "69c650bf752060d30f09b325",
  "customer": "6979b377edaeb45b34691bc9",
  "therapist": "697b38cf5f78da5ab3671ae0",
  "service": "69898f29ba7d734b5fe73ef4",
  "date": "2026-03-28T00:00:00.000Z",
  "time": "10:00",
  "status": "rescheduled",
  "paymentStatus": "partial",
  "originalDate": "2026-03-30T00:00:00.000Z",
  "originalTime": "10:00",
  "rescheduledBy": "69798f3fbb46cf97b854e4ba",
  "rescheduledAt": "2026-03-27T10:08:22.897Z",
  "confirmedBy": "69798f3fbb46cf97b854e4ba"
}
```

## Root Cause Analysis

### Problem 1: Frontend Filter Logic
The customer bookings page filter at line 839-842 was checking:
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  (booking.status === 'rescheduled' || booking.originalDate || booking.originalTime) && 
  booking.rescheduledBy && 
  (!booking.confirmedBy || booking.confirmedBy === booking.customer?.id);
```

**Issue**: The condition `(!booking.confirmedBy || booking.confirmedBy === booking.customer?.id)` was excluding the booking because:
- `confirmedBy` was set to the business ID (`69798f3fbb46cf97b854e4ba`)
- This ID does NOT match the customer ID (`6979b377edaeb45b34691bc9`)
- Therefore, the condition evaluated to `false`, excluding the booking from the "Booking Requests" tab

### Problem 2: Missing Customer Field in API Response
The API endpoint `/api/customer/bookings` was not including the `customer` field in the response, making it impossible to compare `confirmedBy` with `customer.id`.

## Solution

### Fix 1: Updated Frontend Filter Logic
**File**: `wellness-app/app/dashboard/customer/bookings/page.tsx`  
**Line**: 839-842

**Changed from:**
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  (booking.status === 'rescheduled' || booking.originalDate || booking.originalTime) && 
  booking.rescheduledBy && 
  (!booking.confirmedBy || booking.confirmedBy === booking.customer?.id);
```

**Changed to:**
```typescript
const isBusinessRescheduledAwaitingCustomerResponse = 
  (booking.status === 'rescheduled' || booking.originalDate || booking.originalTime) && 
  booking.rescheduledBy && 
  (!booking.confirmedBy || booking.confirmedBy !== booking.customer?.id);
```

**Key Change**: Changed `===` to `!==` in the last condition.

**Logic**: Show the booking in the requests tab if:
1. Booking has `rescheduled` status OR has `originalDate`/`originalTime` fields
2. Booking has `rescheduledBy` field (someone rescheduled it)
3. Either `confirmedBy` doesn't exist OR `confirmedBy` does NOT match the customer's ID
   - This means the customer hasn't personally accepted the reschedule yet

### Fix 2: Added Customer Field to API Response
**File**: `wellness-app/app/api/customer/bookings/route.ts`  
**Line**: 213-217

**Added:**
```typescript
customer: {
  id: booking.customer.toString()
},
```

This ensures the frontend can access `booking.customer.id` for comparison logic.

## How It Works Now

### Complete Flow
1. **Business reschedules booking** → Sets `status = 'rescheduled'`, `rescheduledBy = businessId`, `confirmedBy = businessId`
2. **Customer logs in** → Fetches bookings from API
3. **API returns booking** → Includes `customer.id` field ✅
4. **Frontend filter checks conditions**:
   - `status === 'rescheduled'` ✅ TRUE
   - `rescheduledBy exists` ✅ TRUE (business ID)
   - `confirmedBy !== customer.id` ✅ TRUE (business ID ≠ customer ID)
5. **Booking appears in "Booking Requests" tab** ✅
6. **Customer sees action buttons**: "Accept Reschedule" and "Decline & Cancel" ✅

### Three Booking Categories in "Requests" Tab

The "Booking Requests" tab now correctly shows:

#### 1. Therapist Confirmed (Awaiting Business)
- **Status**: `therapist_confirmed` + `responseVisibleToBusinessOnly = true`
- **Display**: "Therapist Confirmed" in blue
- **Customer Actions**: Limited (waiting for business confirmation)

#### 2. Business Confirmed (Awaiting Payment)
- **Status**: `confirmed` + `responseVisibleToBusinessOnly = false` + `paymentStatus = pending`
- **Display**: "Ready for Payment (Awaiting Payment)" in gold
- **Customer Actions**: "Confirm Payment", "Reschedule"

#### 3. Business Rescheduled (Awaiting Customer Response) ⭐
- **Status**: `rescheduled` OR has `originalDate`/`originalTime`
- **Has**: `rescheduledBy` field exists
- **Has**: `confirmedBy !== customer.id` (customer hasn't accepted)
- **Display**: "Rescheduled by Business (Awaiting Your Response)" in purple
- **Customer Actions**: "Accept Reschedule", "Decline & Cancel", "Reschedule"

## Testing Instructions

1. **Create a test booking** as a customer
2. **Have business reschedule** the booking from business dashboard
3. **Check customer dashboard**:
   - Open browser console (F12)
   - Navigate to "My Bookings" → "Booking Requests" tab
   - Look for DEBUG logs showing the rescheduled booking
   - Verify booking appears with purple status tag
   - Verify action buttons appear

4. **Verify console logs** show:
   ```
   DEBUG - Individual conditions: {
     hasRescheduledStatus: true,
     hasOriginalDate: true,
     hasRescheduledBy: true,
     confirmedBy: "business_id_here",
     customerId: "customer_id_here",
     confirmedByMatchesCustomer: false,
     finalResult: true
   }
   ```

## Expected Behavior After Fix

✅ Rescheduled booking appears in "Booking Requests" tab  
✅ Status displays as "Rescheduled by Business (Awaiting Your Response)" in purple  
✅ Action buttons appear: "Accept Reschedule" and "Decline & Cancel"  
✅ Customer can accept the new date/time  
✅ Customer can decline and cancel if they don't like the new time  

## Files Modified

1. `wellness-app/app/dashboard/customer/bookings/page.tsx` (lines 839-842, 845-860)
2. `wellness-app/app/api/customer/bookings/route.ts` (line 213-217)

## Related Documentation
- See also: `FIX_RESCHEDULED_BOOKING_WITH_PARTIAL_PAYMENT_NOT_SHOWING.md`
- See also: `FIX_BUSINESS_RESCHEDULED_NOT_SHOWING_IN_CUSTOMER_DASHBOARD.md`
