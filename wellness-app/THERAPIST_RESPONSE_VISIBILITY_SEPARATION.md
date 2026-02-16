# Therapist Response Visibility Separation Implementation

## Overview
This implementation separates therapist responses from customer view by introducing a new field `responseVisibleToBusinessOnly` that controls whether therapist actions (confirm, reschedule, cancel) are visible to customers or restricted to business view only.

## Changes Made

### 1. Database Model Update
**File**: `models/Booking.ts`
- Added new field: `responseVisibleToBusinessOnly: boolean`
- Default value: `false` (responses visible to customers by default)
- Purpose: Controls visibility of therapist responses in customer booking views

### 2. Therapist API Routes
**Files**: 
- `app/api/therapist/bookings/[bookingId]/confirm/route.ts`
- `app/api/therapist/bookings/[bookingId]/cancel/route.ts`  
- `app/api/therapist/bookings/[bookingId]/reschedule/route.ts`

**Changes**:
- Added `responseVisibleToBusinessOnly: true` to all therapist response updates
- When therapists confirm, cancel, or reschedule bookings, the responses are marked as business-only visible

### 3. Customer Dashboard
**File**: `app/dashboard/customer/bookings/page.tsx`

**Changes**:
- Modified status display to show "pending" status when `responseVisibleToBusinessOnly` is true
- Added "(Processing)" indicator to show bookings are being handled by business
- Disabled customer action buttons (Confirm, Cancel, Reschedule) when therapist response is pending business review
- Show "Processing" button instead of action buttons for business-only visible responses

### 4. Business Dashboard API
**File**: `app/api/business/assigned-bookings/route.ts`

**Changes**:
- Added `responseVisibleToBusinessOnly` field to API response
- Business dashboard now receives visibility information for proper display

### 5. Migration Script
**File**: `scripts/update-response-visibility.ts`

**Purpose**:
- Updates existing bookings with default `responseVisibleToBusinessOnly: false`
- Ensures backward compatibility for existing data

## Workflow Behavior

### New Booking Flow:
1. Customer creates booking → `responseVisibleToBusinessOnly: false` (visible to customer)
2. Business assigns to therapist → `responseVisibleToBusinessOnly: false` (visible to customer)
3. Therapist responds (confirm/cancel/reschedule) → `responseVisibleToBusinessOnly: true` (business-only visible)
4. Customer sees booking as "Processing" with disabled actions
5. Business reviews and processes the therapist response
6. Business can confirm/cancel/reschedule the booking, which makes it visible to customer again

### Customer View:
- When `responseVisibleToBusinessOnly: true`:
  - Status shows as "pending (Processing)"
  - Action buttons are disabled
  - Shows "Processing" indicator
- When `responseVisibleToBusinessOnly: false`:
  - Normal status display
  - Full action buttons available
  - Standard booking management

### Business View:
- Can see all therapist responses regardless of visibility setting
- Has dedicated "Booking Responses" section
- Can process therapist responses and make final decisions
- Full booking management capabilities

## Migration Instructions

Run the migration script to update existing bookings:

```bash
cd wellness-app
npx ts-node scripts/update-response-visibility.ts
```

This will:
1. Set `responseVisibleToBusinessOnly: false` for all existing bookings
2. Ensure backward compatibility
3. Prepare the database for the new workflow

## Testing

To test the implementation:
1. Create a new booking as a customer
2. Assign it to a therapist as business admin
3. Have the therapist confirm/cancel/reschedule the booking
4. Verify customer sees "Processing" status with disabled actions
5. Verify business can see the therapist response in the "Booking Responses" section
6. Business can then process the response and make it visible to customer

## Benefits

1. **Clear Separation**: Therapist responses are properly separated from customer view
2. **Business Control**: Businesses maintain control over final booking decisions
3. **Better UX**: Customers understand when bookings are being processed
4. **Workflow Clarity**: Clear distinction between therapist recommendations and business decisions
5. **Backward Compatibility**: Existing bookings continue to work normally