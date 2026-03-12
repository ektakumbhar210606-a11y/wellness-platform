# Therapist Cancellation Request Flow - Complete Fix

## Problem Description

When a therapist had issues with a booking (especially after half payment was made), they could click the "Cancel & Refund" button in their dashboard. However, there were several critical issues:

1. **Immediate Cancellation**: The booking was directly cancelled without business approval
2. **No Business Visibility**: The cancelled booking didn't appear in the business dashboard
3. **No Customer Communication**: Business couldn't inform the customer about the cancellation
4. **Refund Processing**: No proper workflow for approving refunds

### Original Flow (Broken):
```
Therapist clicks "Cancel & Refund" 
  → Status becomes "cancelled" 
  → Booking disappears from business dashboard 
  → Business unaware of cancellation 
  → Customer left hanging without explanation
```

## Solution Implemented

Implemented a **three-stage cancellation workflow** with proper business oversight:

### New Flow (Fixed):
```
1. Therapist clicks "Cancel & Refund"
   → Status becomes "therapist_cancel_requested"
   → Appears in Business Dashboard → Bookings → "Cancelled Bookings" tab

2. Business reviews cancellation request
   → Can see original customer request details
   → Can see therapist's cancellation reason
   → Can see refund amount (50% of advance payment)
   → Options: "Approve & Refund" or "Reject"

3a. If Business Approves:
   → Status becomes "cancelled_by_therapist"
   → 50% refund processed to customer
   → Appears in Customer Dashboard → Cancelled Bookings tab
   → Customer notified about cancellation and refund

3b. If Business Rejects:
   → Status reverts to "confirmed"
   → Booking remains active
   → Therapist notified about rejection
```

## Technical Implementation

### 1. Updated Therapist Cancel API
**File:** `wellness-app/app/api/therapist/bookings/[bookingId]/cancel/route.ts`

**Changes:**
- Changed status from `BookingStatus.Cancelled` to `BookingStatus.TherapistCancelRequested`
- Added `businessReviewStatus: 'pending'` field
- Set `responseVisibleToBusinessOnly: true` to keep it private from customer initially
- Tracks cancellation request timestamp

```typescript
{ 
  status: BookingStatus.TherapistCancelRequested,
  therapistResponded: true,
  responseVisibleToBusinessOnly: true,
  therapistCancelReason: 'Therapist initiated cancellation',
  therapistCancelRequestedAt: new Date(),
  businessReviewStatus: 'pending'
}
```

### 2. Added Cancelled Bookings Tab to Business Dashboard
**File:** `wellness-app/app/components/BookingManagement.tsx`

**Changes:**
- Added `cancelledBookings` state
- Created `fetchCancelledBookings()` function that calls `/api/business/therapist-cancel-requests`
- Added `cancelledColumns` for displaying cancellation details
- Added new tab "Cancelled Bookings" with approve/reject actions
- Added handler functions:
  - `handleApproveCancellation()` - Calls approve endpoint
  - `handleRejectCancellation()` - Calls reject endpoint

**UI Features:**
- Shows customer details, service, therapist
- Displays cancellation reason
- Shows refund amount (50% of advance)
- Pending approvals show "Approve & Refund" and "Reject" buttons
- Already processed cancellations show status only

### 3. Enhanced Booking Interface
**File:** `wellness-app/app/components/BookingManagement.tsx`

Added fields to `Booking` interface:
```typescript
status: '... | therapist_cancel_requested';
therapistCancelReason?: string;
therapistCancelRequestedAt?: Date;
businessReviewStatus?: 'pending' | 'approved' | 'rejected';
advancePaid?: number;
```

### 4. Existing Processing API (Already Implemented)
**File:** `wellness-app/app/api/business/therapist-cancel-requests/[bookingId]/process/route.ts`

This endpoint was already correctly implemented:

**Approve Action:**
- Changes status to `BookingStatus.CancelledByTherapist`
- Processes 50% refund via payment gateway
- Updates payment records with refund info
- Sends notifications to customer and therapist
- Releases time slot back to therapist availability

**Reject Action:**
- Changes status back to `BookingStatus.Confirmed`
- Notifies therapist about rejection
- Booking remains active

### 5. Customer Dashboard (Already Supported)
**File:** `wellness-app/app/dashboard/customer/bookings/page.tsx`

The customer dashboard already handles these statuses correctly:
- `therapist_cancel_requested` → Shows as "Pending Approval"
- `cancelled_by_therapist` → Shows as "Cancelled by Therapist" with refund info

**Cancelled Bookings Tab displays:**
- Cancel reason (highlighted if from therapist)
- Refund status and amount
- Who cancelled (Therapist/Customer/Business)
- Proper color-coded status tags

## Complete User Journey

### Scenario: Therapist needs to cancel after receiving 50% advance

#### Stage 1: Therapist Initiates Cancellation
```
Therapist Dashboard → Schedule → Booking Details
  ↓
Clicks "Cancel & Refund" button
  ↓
API sets status: therapist_cancel_requested
  ↓
Booking appears in: Business Dashboard → Bookings → Cancelled Bookings tab
```

#### Stage 2: Business Reviews Cancellation
```
Business Dashboard → Bookings → Cancelled Bookings tab
  ↓
Sees:
  - Customer: John Doe
  - Service: Deep Tissue Massage
  - Therapist: Jane Smith
  - Date: March 15, 2026 at 2:00 PM
  - Cancel Reason: "Therapist has emergency"
  - Refund Amount: $50 (50% of $100 advance)
  - Status: Pending Approval
  ↓
Options:
  [Approve & Refund] [Reject] [View Details]
```

#### Stage 3a: Business Approves
```
Business clicks "Approve & Refund"
  ↓
API processes:
  - Status → cancelled_by_therapist
  - Payment → 50% refund initiated
  - Notifications sent to customer & therapist
  - Slot released back to therapist availability
  ↓
Customer sees in their dashboard:
  - Status: Cancelled by Therapist
  - Refund Status: Refund Processing
  - Refund Amount: $50
  - Expected: 3-7 business days
```

#### Stage 3b: Business Rejects
```
Business clicks "Reject"
  ↓
API processes:
  - Status → confirmed (reverted)
  - Notification sent to therapist
  - Booking remains active
  ↓
Therapist must fulfill the booking or escalate issue
```

## Testing Checklist

- [ ] **Therapist can initiate cancellation**
  - Navigate to therapist dashboard schedule
  - Click "Cancel & Refund" on a confirmed booking
  - Verify status changes to `therapist_cancel_requested`

- [ ] **Business sees cancellation request**
  - Login to business dashboard
  - Navigate to Bookings → Cancelled Bookings tab
  - Verify booking appears with all details
  - Verify "Approve & Refund" and "Reject" buttons visible

- [ ] **Business can approve cancellation**
  - Click "Approve & Refund"
  - Verify success message about refund
  - Verify status changes to `cancelled_by_therapist`
  - Verify booking moves out of pending cancellations

- [ ] **Business can reject cancellation**
  - Create new cancellation request
  - Click "Reject"
  - Verify booking status reverts to `confirmed`
  - Verify therapist is notified

- [ ] **Customer sees approved cancellation**
  - After business approves, login as customer
  - Navigate to My Bookings → Cancelled Bookings
  - Verify booking shows with "Cancelled by Therapist" status
  - Verify refund amount and status displayed correctly

- [ ] **Refund processing works**
  - Verify payment records updated
  - Verify 50% refund calculated correctly
  - Verify refund notification sent to customer

## Files Modified

1. ✅ `wellness-app/app/api/therapist/bookings/[bookingId]/cancel/route.ts`
2. ✅ `wellness-app/app/components/BookingManagement.tsx`
3. ✅ `wellness-app/models/Booking.ts` (enum already had required statuses)

## API Endpoints Used

### Therapist Initiation
```
PATCH /api/therapist/bookings/:bookingId/cancel
Headers: Authorization: Bearer <therapist_token>
Response: { success: true, data: { ...booking } }
```

### Business Fetch Cancellations
```
GET /api/business/therapist-cancel-requests
Headers: Authorization: Bearer <business_token>
Response: { 
  success: true, 
  data: [...cancellation_requests],
  counts: { total, pending, approved, rejected }
}
```

### Business Process Cancellation
```
PATCH /api/business/therapist-cancel-requests/:bookingId/process
Headers: Authorization: Bearer <business_token>
Body: { action: 'approve' | 'reject' }
Response: { 
  success: true, 
  message: '...',
  data: { id, status, refundAmount }
}
```

## Benefits of This Implementation

1. **Business Oversight**: Business maintains control over cancellations
2. **Customer Communication**: Business can properly inform customers
3. **Refund Transparency**: Clear refund amounts and processing status
4. **Audit Trail**: Complete history of who requested what and when
5. **Flexibility**: Business can reject inappropriate cancellations
6. **Automated Notifications**: All parties notified at each stage
7. **Payment Integration**: Automatic refund processing through payment gateway

## Notes

- The existing API endpoint `/api/business/therapist-cancel-requests/[bookingId]/process` was already correctly implemented and just needed the UI integration
- Customer dashboard already supported the cancellation statuses, just needed the flow to work end-to-end
- No database migrations required - uses existing fields in Booking model
- Maintains backward compatibility with existing bookings
