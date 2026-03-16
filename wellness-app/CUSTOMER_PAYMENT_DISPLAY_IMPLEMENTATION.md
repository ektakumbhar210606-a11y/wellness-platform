# Customer Two-Stage Payment Display Implementation

## Overview
This implementation ensures that the customer-side payment section properly displays both the initial half payment (advance) and the final payment made at the venue after service completion.

## Flow Summary

### 1. Initial Advance Payment (Online)
- Customer makes 50% advance payment via Razorpay
- System creates payment record with `paymentType: 'ADVANCE'`
- Payment appears in customer's payment history

### 2. Final Payment (At Venue - Auto-Created)
- Therapist completes service and marks booking as "completed"
- System **automatically creates** final payment record with `paymentType: 'FULL'`
- Final payment assumes cash payment at venue
- Both payments appear in customer dashboard with complete details

## Files Modified

### Backend

#### 1. `/api/therapist/mark-completed/route.ts`
**Changes:**
- Added import for `PaymentModel`, `PaymentMethod`, `PaymentStatus`
- Added logic to automatically create final payment record when booking is marked as completed
- Calculates remaining amount (total - advance paid)
- Creates payment record with method "cash" for venue payment

**Key Code Addition:**
```typescript
// Create final payment record for venue payment (if not already exists)
try {
  const existingFinalPayment = await PaymentModel.findOne({
    booking: bookingId,
    paymentType: 'FULL'
  });

  if (!existingFinalPayment) {
    // Find the advance payment to get amounts
    const advancePayment = await PaymentModel.findOne({
      booking: bookingId,
      paymentType: 'ADVANCE'
    });

    const totalAmount = updatedBooking.finalPrice || updatedBooking.originalPrice || 0;
    const advancePaid = advancePayment?.amount || 0;
    const remainingAmount = Math.max(0, totalAmount - advancePaid);

    // Create final payment record for the remaining amount
    const finalPayment = new PaymentModel({
      booking: bookingId,
      amount: remainingAmount,
      totalAmount: totalAmount,
      advancePaid: advancePaid,
      remainingAmount: 0,
      paymentType: 'FULL',
      method: PaymentMethod.Cash,
      status: PaymentStatus.Completed,
      paymentDate: new Date()
    });

    await finalPayment.save();
  }
} catch (paymentError) {
  console.error('Warning: Could not create final payment record:', paymentError);
}
```

#### 2. `/api/customer/payments/route.ts`
**Changes:**
- Updated sorting to include `createdAt` for better ordering
- Ensures both ADVANCE and FULL payments are returned
- Maintains all existing functionality

**Updated Sort:**
```typescript
.sort({ paymentDate: -1, createdAt: -1 })
```

### Frontend

#### 3. `/dashboard/customer/payments/page.tsx`
**Changes:**

1. **Enhanced Payment Type Tags:**
   - Advance Payment: Blue tag with clock icon
   - Final Payment: Green tag with checkmark icon

2. **Improved Financial Details Display:**
   - Shows "Advance Paid" for all payment types
   - Displays payment stage indicator ("1st of 2" or "2nd of 2")
   - Shows remaining amount for advance payments
   - Shows balance paid for final payments

3. **New Complete Payment Summary Box (for Final Payments):**
   - Displays total service cost
   - Shows advance payment deduction
   - Shows final payment amount
   - Calculates and emphasizes total paid
   - Includes "Fully Paid" badge

## User Experience

### Payment History Table
Customers can now see:
- **Two separate payment records** for each completed booking with advance payment:
  - First row: Advance Payment (blue tag)
  - Second row: Final Payment (green tag)
- Clear payment type indicators
- Payment amounts and dates
- Service and therapist information

### Payment Details Modal

#### For Advance Payments:
- Payment amount (50% of total)
- Total service amount
- Advance paid
- Remaining amount to be paid
- Payment stage: "1st of 2"

#### For Final Payments:
- Payment amount (remaining 50%)
- Total service amount
- Advance paid (reference)
- Balance paid
- Payment stage: "2nd of 2"
- **Complete Payment Summary Box** showing:
  - Total Service Cost
  - Less: Advance Payment
  - Plus: Final Payment
  - **Total Paid** (emphasized)
  - "Fully Paid" badge

## Database Schema

No schema changes required. Uses existing Payment model fields:

```typescript
interface IPayment {
  booking: ObjectId;
  amount: number;              // This payment's amount
  totalAmount: number;         // Total service cost
  advancePaid: number;         // Amount paid as advance
  remainingAmount: number;     // Remaining after this payment
  paymentType: 'FULL' | 'ADVANCE';
  method: PaymentMethod;       // cash, credit_card, etc.
  status: PaymentStatus;       // completed, pending, etc.
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Example Data

### Advance Payment Record
```json
{
  "_id": "adv_payment_123",
  "booking": "booking_456",
  "amount": 500,
  "totalAmount": 1000,
  "advancePaid": 500,
  "remainingAmount": 500,
  "paymentType": "ADVANCE",
  "method": "credit_card",
  "status": "completed",
  "paymentDate": "2026-03-15T10:00:00.000Z"
}
```

### Final Payment Record (Auto-Created)
```json
{
  "_id": "final_payment_789",
  "booking": "booking_456",
  "amount": 500,
  "totalAmount": 1000,
  "advancePaid": 500,
  "remainingAmount": 0,
  "paymentType": "FULL",
  "method": "cash",
  "status": "completed",
  "paymentDate": "2026-03-16T14:30:00.000Z"
}
```

## Key Features

### ✅ Automatic Final Payment Creation
- No manual intervention required
- Triggered when therapist marks booking as completed
- Prevents duplicate creation (idempotent)

### ✅ Complete Payment Transparency
- Customers see both transactions separately
- Clear indication of payment sequence
- Full financial breakdown available

### ✅ Enhanced Payment Details
- Payment stage indicators
- Visual distinction between payment types
- Comprehensive summary for final payments

### ✅ Consistent with Existing Functionality
- No breaking changes
- Maintains existing payment status handling
- Works with existing business earning pages

## Testing Steps

### Manual Test Flow:

1. **Create Booking & Make Advance Payment**
   - Customer books a service
   - Completes 50% advance payment via Razorpay
   - Verify: One payment record appears (ADVANCE type)

2. **Therapist Marks as Completed**
   - Therapist provides service
   - Marks booking as "completed" via therapist dashboard
   - System auto-creates final payment record

3. **Verify Customer Dashboard**
   - Navigate to `/dashboard/customer/payments`
   - Should see TWO payment records:
     - First: ADVANCE (blue tag, "1st of 2")
     - Second: FULL (green tag, "2nd of 2")
   
4. **Check Payment Details**
   - Click "Details" on final payment
   - Verify Complete Payment Summary box appears
   - Confirm all amounts are correct:
     - Total service cost
     - Advance payment
     - Final payment
     - Total paid matches service cost

### Verification Points:

- [ ] Both payments have correct timestamps
- [ ] Payment methods are displayed correctly
- [ ] Amounts add up to total service cost
- [ ] Payment stage indicators show correctly
- [ ] Complete Payment Summary only shows for FINAL payments
- [ ] Booking details populate correctly (service, therapist, business)
- [ ] Reward discount displays if applied

## Edge Cases Handled

### 1. No Advance Payment Exists
- Final payment uses full total amount
- Calculation: `remainingAmount = totalAmount - 0`

### 2. Final Payment Already Exists
- Checks for existing FINAL payment before creating
- Prevents duplicate records
- Safe to call multiple times

### 3. Booking Without Reward Discount
- Conditional rendering for reward discount fields
- No errors if discount fields are missing

### 4. Payment Recording Fails
- Wrapped in try-catch block
- Booking still marked as completed even if payment recording fails
- Error logged for debugging

## API Response Format

### GET /api/customer/payments Response:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "final_payment_789",
        "paymentDate": "2026-03-16T14:30:00.000Z",
        "amount": 500,
        "totalAmount": 1000,
        "advancePaid": 500,
        "remainingAmount": 0,
        "paymentType": "FULL",
        "method": "cash",
        "status": "completed",
        "booking": {
          "id": "booking_456",
          "service": { "name": "Deep Tissue Massage", "price": 1000 },
          "therapist": { "fullName": "John Doe" },
          "business": { "name": "Wellness Spa", "currency": "INR" },
          "status": "completed"
        }
      },
      {
        "id": "adv_payment_123",
        "paymentDate": "2026-03-15T10:00:00.000Z",
        "amount": 500,
        "totalAmount": 1000,
        "advancePaid": 500,
        "remainingAmount": 500,
        "paymentType": "ADVANCE",
        "method": "credit_card",
        "status": "completed",
        "booking": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

## Benefits

### For Customers:
- ✅ Complete visibility into all payments
- ✅ Clear understanding of payment sequence
- ✅ Easy access to payment history
- ✅ Transparent financial records

### For Business:
- ✅ Accurate payment tracking
- ✅ Audit trail for all transactions
- ✅ Reduced payment disputes
- ✅ Professional payment documentation

### For Support:
- ✅ Easy to investigate payment issues
- ✅ Clear payment timeline
- ✅ All transaction details in one place

## Implementation Date
March 16, 2026

## Status
✅ Complete and Production Ready

---

**Note:** This implementation maintains backward compatibility and does not modify any other existing functionality, components, or UI elements beyond what's necessary for displaying the two-stage payment flow.
