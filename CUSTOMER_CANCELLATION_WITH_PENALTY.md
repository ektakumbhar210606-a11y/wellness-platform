# Customer Booking Cancellation with 10% Penalty

## Overview
Implemented a customer-initiated booking cancellation feature with:
- **24-hour restriction**: Customers cannot cancel bookings within 24 hours of scheduled time
- **10% cancellation fee**: 10% penalty on the advance payment (50% of total)
- **Refund calculation**: Customer receives 90% of advance payment (45% of total)

## Files Modified/Created

### 1. New API Endpoint
**File:** `wellness-app/app/api/customer/bookings/[bookingId]/cancel/route.ts`

**Features:**
- Customer authentication verification
- Booking ownership validation
- 24-hour cancellation restriction check
- Automatic refund calculation with 10% penalty
- Payment status update to "refunded"
- Therapist availability slot release
- Business notification

**Endpoint Details:**
- **Method:** POST
- **URL:** `/api/customer/bookings/:bookingId/cancel`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "cancelReason": "optional reason" }`

**Refund Calculation Logic:**
```javascript
totalAmount = booking.price
advancePaid = totalAmount * 0.5        // 50% of total
penaltyAmount = advancePaid * 0.1      // 10% of advance
refundAmount = advancePaid - penalty   // 90% of advance = 45% of total
```

**Example:**
- Total Service Price: $100
- Advance Paid (50%): $50
- Cancellation Fee (10% of advance): $5
- **Refund Amount: $45**

### 2. Updated Customer Bookings Page
**File:** `wellness-app/app/dashboard/customer/bookings/page.tsx`

**Changes:**
1. Added `cancellationReason` state for optional reason input
2. Updated `handleCancelBooking()` to call new API endpoint
3. Enhanced cancellation modal with:
   - Cancellation policy notice (visual warning box)
   - Detailed refund breakdown display
   - Optional cancellation reason textarea
   - Currency-formatted amounts

**UI Components:**
- **Policy Notice Box:** Shows cancellation rules and refund calculation
- **Reason Input:** Textarea for optional cancellation reason
- **Refund Display:** Itemized breakdown showing:
  - Original price
  - Advance paid (50%)
  - Cancellation fee (10%)
  - Final refund amount

## User Flow

### Step 1: Customer Initiates Cancellation
1. Customer clicks "Cancel" button on confirmed booking
2. Cancellation confirmation modal appears

### Step 2: Review Cancellation Policy
Modal displays:
- ⚠️ Warning about 24-hour restriction
- 10% cancellation fee explanation
- Complete refund calculation with currency formatting

### Step 3: Provide Reason (Optional)
Customer can optionally provide cancellation reason in textarea

### Step 4: Confirm Cancellation
Customer clicks "Yes, Cancel" button

### Step 5: API Processing
Backend validates:
1. ✅ Customer is authenticated
2. ✅ Booking belongs to customer
3. ✅ Booking status allows cancellation
4. ✅ Booking is NOT within 24 hours
5. ✅ Calculates refund with 10% penalty
6. ✅ Updates booking status to "cancelled"
7. ✅ Updates payment status to "refunded"
8. ✅ Releases therapist's availability slot
9. ✅ Notifies business about cancellation

### Step 6: Success Feedback
- Success message shows refund amount
- Booking removed from customer's booking list
- Refund processed to original payment method (3-7 business days)

## Error Handling

### Scenario 1: Within 24 Hours
**Error:** "Bookings cannot be cancelled within 24 hours of the scheduled time. Please contact the business directly if you need to cancel."

**Action Required:** Customer must contact business directly

### Scenario 2: Invalid Authentication
**Error:** "Authentication token required" or "Invalid or expired token"

**Action Required:** Customer needs to login again

### Scenario 3: Not Booking Owner
**Error:** "Access denied. You can only cancel your own bookings."

**Action Required:** Only the booking owner can cancel

### Scenario 4: Already in Final State
**Error:** "This booking cannot be cancelled as it is already in a final state"

**Action Required:** Booking already completed/cancelled/processed

## Database Changes

### Booking Model Updates
When customer cancels:
```javascript
{
  status: "cancelled",
  therapistResponded: true,
  responseVisibleToBusinessOnly: false,
  cancelledBy: customerId,
  cancelledAt: new Date(),
  customerCancelReason: "reason provided",
  refundAmount: calculatedRefund,
  refundPenaltyPercentage: 10,
  notificationDestination: "business"
}
```

### Payment Model Updates
```javascript
{
  status: "refunded",
  refundAmount: calculatedRefund,
  penaltyAmount: penalty,
  refundedAt: new Date()
}
```

## Testing Scenarios

### Test Case 1: Valid Cancellation (>24 hours)
**Given:** Booking scheduled 48 hours from now
**When:** Customer cancels
**Then:** 
- ✅ Cancellation successful
- ✅ 10% penalty applied
- ✅ 90% of advance refunded
- ✅ Booking status = "cancelled"
- ✅ Payment status = "refunded"

### Test Case 2: Invalid Cancellation (<24 hours)
**Given:** Booking scheduled in 12 hours
**When:** Customer tries to cancel
**Then:**
- ❌ Error shown
- ❌ Cancellation blocked
- ℹ️ Message to contact business directly

### Test Case 3: Refund Calculation
**Given:** Service price = $200
**When:** Customer cancels valid booking
**Then:**
- Advance paid = $100 (50%)
- Penalty = $10 (10% of $100)
- Refund = $90 (90% of $100)

## Business Dashboard Impact

Businesses will see:
- Cancelled bookings in their system
- Customer-provided cancellation reason
- Refund amount and penalty details
- Notification about customer cancellation

## Next Steps (Future Enhancements)

1. **Email Notifications:** Send email confirmation of cancellation and refund
2. **Refund Tracking:** Add refund transaction ID and tracking
3. **Partial Refund Options:** Configurable penalty percentage by business
4. **Cancellation History:** Track all cancellations for analytics
5. **Dispute Resolution:** Allow customers to dispute penalties

## Important Notes

- The 24-hour check uses server time, not client time
- Refund processing time: 3-7 business days
- Cancellation fee is non-negotiable through the system
- Therapist's availability is automatically released
- Business receives notification for record-keeping

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify JWT token validity
- Ensure MongoDB connection is active
- Test with different booking times to verify 24-hour restriction
