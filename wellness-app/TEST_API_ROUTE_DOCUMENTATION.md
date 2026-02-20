# Therapist Completion and Business Payout Flow - Test API Route

## Overview

This document describes a temporary test API route that enables testing of the therapist completion and business payout flow. The route allows safely marking bookings as completed for testing purposes without affecting production logic.

## Test API Route

### Route: `/api/test/mark-booking-completed`

#### Purpose
- Temporary test route to simulate therapist completion of bookings
- Enables testing of business earnings and therapist payout workflows
- Safe for testing without breaking existing logic

#### Request Method
- `POST`

#### Authentication
- Requires therapist authentication
- Validates JWT token
- Ensures user has 'therapist' role

#### Request Body
```json
{
  "bookingId": "ObjectIdAsString"
}
```

#### Processing Logic
When a booking is marked as completed via this test route:

1. **Status Update**: `status = "completed"`
2. **Payment Status**: `paymentStatus = "completed"` (indicates full payment)
3. **Payout Status**: `therapistPayoutStatus = "pending"` (ready for business to pay therapist)
4. **Completion Tracking**: `completedAt = current_date`
5. **Confirmation Tracking**: `confirmedBy = therapist_id`, `confirmedAt = current_date`

#### Validations Performed
- Booking must exist in the database
- Prevents double completion (checks if already marked as completed)
- Ensures therapist can only complete their assigned bookings
- Validates ObjectId format

#### Response Format
```json
{
  "success": true,
  "message": "Booking marked as completed successfully (TEST ROUTE)",
  "data": {
    "id": "booking_id",
    "status": "completed",
    "paymentStatus": "completed",
    "therapistPayoutStatus": "pending",
    "completedAt": "timestamp",
    "confirmedBy": "therapist_id",
    "confirmedAt": "timestamp"
  }
}
```

## Business Earnings Integration

### Full Payment Tab Display
The business earning page (`/dashboard/business/earning`) displays bookings in the "Full Payment" tab when:

- `status = "completed"`
- `paymentStatus = "completed"`

Our test API route ensures completed bookings meet these criteria.

### Data Flow
1. Therapist completes service → Test API marks booking as completed
2. Booking appears in business "Full Payment" tab
3. Business sees "Pay to Therapist" button (when `therapistPayoutStatus = "pending"`)
4. Business pays therapist → `therapistPayoutStatus` becomes "paid"

## Safety Features

### Does NOT Modify
- Payment calculation logic
- Business earning logic
- Customer dashboard logic
- Any other business rules

### Does NOT Affect
- Production booking flows
- Real payment processing
- Existing business operations

## MongoDB Update Query

The API performs this update operation:

```javascript
const updatedBooking = await BookingModel.findByIdAndUpdate(
  bookingId,
  { 
    status: BookingStatus.Completed,
    paymentStatus: 'completed',           // Indicate full payment
    therapistPayoutStatus: 'pending',     // Ready for therapist payment
    completedAt: new Date(),             // Track completion time
    confirmedBy: decoded.id,             // Track who confirmed
    confirmedAt: new Date()              // Track confirmation time
  },
  { new: true, runValidators: true }     // Return updated doc with validation
);
```

## Example Usage

### Request
```bash
curl -X POST http://localhost:3000/api/test/mark-booking-completed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_THERAPIST_JWT_TOKEN" \
  -d '{"bookingId": "VALID_OBJECT_ID"}'
```

### Success Response
```json
{
  "success": true,
  "message": "Booking marked as completed successfully (TEST ROUTE)",
  "data": {
    "id": "60f1b2b3c4d5e6f7a8b9c0d1",
    "status": "completed",
    "paymentStatus": "completed",
    "therapistPayoutStatus": "pending",
    "completedAt": "2023-07-15T10:30:00.000Z",
    "confirmedBy": "60f1b2b3c4d5e6f7a8b9c0d2",
    "confirmedAt": "2023-07-15T10:30:00.000Z"
  }
}
```

## Removal Instructions

**Important**: This test route should be removed from production:

1. Delete the file: `app/api/test/mark-booking-completed/route.ts`
2. Remove any references to the test route
3. Ensure no production code depends on this endpoint

## Testing Script

A test script is provided (`test-therapist-completion-flow.js`) that verifies:
- The test API route functions correctly
- Completed bookings appear in the business "Full Payment" tab
- Therapist payout workflow functions properly
- All validations work as expected

Run the test with: `node test-therapist-completion-flow.js`

## Notes

- This is a temporary solution for testing purposes only
- The route is clearly marked with `// TESTING ROUTE - REMOVE IN PRODUCTION`
- All existing business logic remains unaffected
- The route follows the same security patterns as other API routes