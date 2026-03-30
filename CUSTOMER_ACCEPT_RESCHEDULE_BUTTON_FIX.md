# Fix: Add Accept/Decline Buttons for Business-Rescheduled Bookings with Partial Payment

## Issue
After fixing the display issue, business-rescheduled bookings were now appearing in the customer's "Booking Requests" tab, but the **action buttons ("Accept Reschedule" and "Decline & Cancel") were not showing** for bookings with `paymentStatus: "partial"`.

### Example Scenario
```json
{
  "status": "rescheduled",
  "paymentStatus": "partial",
  "rescheduledBy": "business_id",
  "confirmedBy": "business_id"
}
```

The booking was visible, but no action buttons appeared because the condition only checked for `paymentStatus === 'pending'`.

## Root Cause

The action button rendering logic at **line 193** in `page.tsx` was:

```typescript
{record.paymentStatus === 'pending' && (record.confirmedBy || ...) ? (
  // Show action buttons
)}
```

This meant:
- ✅ Bookings with `paymentStatus: 'pending'` showed buttons
- ❌ Bookings with `paymentStatus: 'partial'` did NOT show buttons

Since your rescheduled booking had `paymentStatus: "partial"` (customer had made an advance payment), the action buttons were not rendered.

## Solution

### Fix 1: Updated Action Button Condition
**File**: `wellness-app/app/dashboard/customer/bookings/page.tsx`  
**Line**: 193

**Changed from:**
```typescript
{record.paymentStatus === 'pending' && (record.confirmedBy || record.cancelledBy || record.rescheduledBy || record.responseVisibleToBusinessOnly) ? (
  // Business response awaiting payment
```

**Changed to:**
```typescript
{(record.paymentStatus === 'pending' || record.paymentStatus === 'partial') && 
 (record.confirmedBy || record.cancelledBy || record.rescheduledBy || record.responseVisibleToBusinessOnly) ? (
  // Business response awaiting payment or acceptance
```

**Key Change**: Added `|| record.paymentStatus === 'partial'` to the condition.

**Result**: Now both `pending` AND `partial` payment statuses will show the action buttons.

### Fix 2: Enhanced Status Display
**File**: Same file  
**Line**: 169-173

**Added:**
```typescript
else if (status === 'rescheduled' && record.rescheduledBy) {
  displayStatus = 'Rescheduled by Business (Awaiting Your Response)';
  color = 'purple';
}
```

**Result**: 
- Clear status message: "Rescheduled by Business (Awaiting Your Response)"
- Distinctive purple color tag for easy identification
- Customer immediately understands they need to take action

## How It Works Now

### Complete User Flow

#### Step 1: Business Reschedules
- Business user clicks "Reschedule Original" on a booking
- System updates booking:
  - `status = 'rescheduled'`
  - `originalDate` and `originalTime` set to old values
  - `date` and `time` set to new values
  - `rescheduledBy = businessId`
  - `confirmedBy = businessId` (business confirmed their own reschedule)
  - `paymentStatus` remains unchanged (could be 'pending' or 'partial')

#### Step 2: Customer Views Booking
- Customer logs in and navigates to "My Bookings"
- Booking appears in **"Booking Requests"** tab
- Status shows: **"Rescheduled by Business (Awaiting Your Response)"** in purple
- Two action buttons appear:
  - ✅ **"Accept Reschedule"** (primary blue button)
  - ❌ **"Decline & Cancel"** (danger red button)

#### Step 3: Customer Takes Action

**Option A: Accept Reschedule**
1. Customer clicks "Accept Reschedule"
2. Payment confirmation modal opens
3. Customer confirms payment (completes advance payment or full payment)
4. Booking continues with new date/time
5. `paymentStatus` updates based on payment amount

**Option B: Decline & Cancel**
1. Customer clicks "Decline & Cancel"
2. Cancellation confirmation modal opens
3. Customer provides cancellation reason (optional)
4. Booking is cancelled
5. Refund is processed according to cancellation policy

## Payment Status Scenarios

### Scenario 1: Pending Payment (No Payment Yet)
- **Initial State**: `paymentStatus = 'pending'`
- **Customer Action**: Clicks "Accept Reschedule" → Makes full or partial payment
- **Result**: `paymentStatus = 'completed'` or `'partial'`

### Scenario 2: Partial Payment Already Made
- **Initial State**: `paymentStatus = 'partial'` (customer paid 50% advance)
- **Customer Action**: Clicks "Accept Reschedule" → Confirms remaining payment
- **Result**: `paymentStatus = 'completed'` (full payment done)

Both scenarios now correctly show the action buttons!

## Visual Design

### Status Tag Colors
| Status | Color | Display Text |
|--------|-------|--------------|
| `therapist_confirmed` + `responseVisibleToBusinessOnly = true` | Blue | "Therapist Confirmed" |
| `confirmed` + `pending payment` | Gold | "Ready for Payment (Awaiting Payment)" |
| `rescheduled` + `rescheduledBy exists` | **Purple** | **"Rescheduled by Business (Awaiting Your Response)"** |
| `rescheduled` (no rescheduledBy) | Gold | "Rescheduled" |
| `cancelled` | Red | "Cancelled" |
| `pending` | Orange | "Pending" |

### Button Hierarchy
- **Primary (Blue)**: "Accept Reschedule" - Main positive action
- **Danger (Red)**: "Decline & Cancel" - Destructive action
- **Default (Gray)**: "View Details" - Neutral information action
- **Default (Gray)**: "Reschedule" - Secondary action (if time allows)

## Testing Instructions

### Test Case 1: Rescheduled Booking with No Payment
1. Create a booking as customer → `paymentStatus = 'pending'`
2. Business reschedules the booking
3. Customer logs in → Goes to "My Bookings" → "Booking Requests"
4. **Verify**: 
   - Status shows "Rescheduled by Business (Awaiting Your Response)" in purple ✅
   - "Accept Reschedule" button appears ✅
   - "Decline & Cancel" button appears ✅

### Test Case 2: Rescheduled Booking with Partial Payment ⭐
1. Create a booking as customer → Customer pays 50% advance → `paymentStatus = 'partial'`
2. Business reschedules the booking
3. Customer logs in → Goes to "My Bookings" → "Booking Requests"
4. **Verify**: 
   - Status shows "Rescheduled by Business (Awaiting Your Response)" in purple ✅
   - "Accept Reschedule" button appears ✅
   - "Decline & Cancel" button appears ✅
5. Click "Accept Reschedule" → Complete remaining payment
6. **Verify**: Booking moves to "Confirmed Bookings" tab ✅

### Test Case 3: Customer Declines Reschedule
1. Business reschedules a booking (any payment status)
2. Customer clicks "Decline & Cancel"
3. Enter cancellation reason
4. Confirm cancellation
5. **Verify**: Booking moves to "Cancelled Bookings" tab ✅
6. **Verify**: Refund is processed (if partial payment was made) ✅

## Browser Console Debug Output

When viewing a rescheduled booking, you should see debug logs like:

```
DEBUG - Checking rescheduled booking: {
  id: "69c650bf752060d30f09b325",
  status: "rescheduled",
  paymentStatus: "partial",
  responseVisibleToBusinessOnly: false,
  rescheduledBy: "69798f3fbb46cf97b854e4ba",
  confirmedBy: "69798f3fbb46cf97b854e4ba"
}

DEBUG - Individual conditions: {
  hasRescheduledStatus: true,
  hasOriginalDate: true,
  hasOriginalTime: true,
  hasRescheduledBy: true,
  rescheduledByValue: "69798f3fbb46cf97b854e4ba",
  confirmedBy: "69798f3fbb46cf97b854e4ba",
  customerId: "6979b377edaeb45b34691bc9",
  confirmedByMatchesCustomer: false,
  finalResult: true
}

DEBUG - Filter result: {
  id: "69c650bf752060d30f09b325",
  isTherapistConfirmedWaitingForBusiness: false,
  isBusinessConfirmedWaitingForCustomerPayment: false,
  isBusinessRescheduledAwaitingCustomerResponse: true,
  includedInRequests: true
}
```

## Files Modified

1. **wellness-app/app/dashboard/customer/bookings/page.tsx**
   - Line 193: Updated action button condition to include `partial` payment
   - Line 169-172: Added enhanced status display for rescheduled bookings

## Related Documentation
- See also: `RESCHEDED_BOOKING_CUSTOMER_DISPLAY_FIX.md` - Initial fix for booking display
- See also: `CUSTOMER_RESPONSE_TO_BUSINESS_RESCHEDULED_BOOKINGS_FIX.md` - Original feature implementation
- See also: `FIX_RESCHEDULED_BOOKING_WITH_PARTIAL_PAYMENT_NOT_SHOWING.md` - Previous partial payment fix

## Summary of Changes

✅ **Action buttons now appear** for rescheduled bookings with any payment status  
✅ **Clear status messaging** with purple color for easy identification  
✅ **Customer can accept** the new date/time and proceed to payment  
✅ **Customer can decline** and cancel the booking entirely  
✅ **Complete workflow** for business-initiated rescheduling with customer response  
