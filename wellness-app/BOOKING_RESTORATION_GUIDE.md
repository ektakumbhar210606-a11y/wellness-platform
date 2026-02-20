# Booking Restoration System

## Overview

This system provides functionality to restore cancelled bookings back to their appropriate previous status. The restoration process intelligently analyzes each cancelled booking and determines the most logical previous status based on the booking's properties and history.

## How It Works

The restoration system uses a priority-based approach to determine the appropriate previous status:

### Status Determination Logic (in priority order):

1. **Completed Bookings** → `completed`
   - If `completedAt` exists or status was previously `completed`

2. **Fully Paid Bookings** → `paid` 
   - If `paymentStatus` is `completed`

3. **Partially Paid Bookings** → `confirmed`
   - If `paymentStatus` is `partial`

4. **Confirmed Bookings** → `confirmed`
   - If `confirmedAt` or `confirmedBy` exists

5. **Admin-Assigned Therapist-Responded** → `therapist_confirmed`
   - If `assignedByAdmin` is true AND `therapistResponded` is true

6. **Admin-Assigned No Response** → `pending`
   - If `assignedByAdmin` is true but no therapist response

7. **Default** → `pending`
   - For all other cases (safest option)

## Usage

### Preview Mode (Recommended First Step)
```bash
node restore-cancelled-bookings.js --preview
```
This shows what changes would be made without actually modifying any data.

### Restore Mode
```bash
node restore-cancelled-bookings.js --restore
```
This actually performs the restoration of all cancelled bookings.

## Safety Features

- **Preview Functionality**: Always preview before restoring
- **Intelligent Status Detection**: Uses multiple data points to determine correct status
- **Error Handling**: Comprehensive error handling and logging
- **Transaction Safety**: Each booking is processed individually with proper error handling

## What Gets Restored

For each cancelled booking, the system:
1. Determines the appropriate previous status
2. Updates the `status` field to the determined status
3. Clears `cancelledBy` and `cancelledAt` fields
4. Preserves all other booking data (customer, therapist, service, payment info, etc.)

## Status Mapping Examples

| Current State | Restored To | Reason |
|---------------|-------------|---------|
| Cancelled booking with `completedAt` | `completed` | Was previously completed |
| Cancelled booking with `paymentStatus: 'completed'` | `paid` | Customer fully paid |
| Cancelled booking with `paymentStatus: 'partial'` | `confirmed` | Partial payment made |
| Cancelled booking with `confirmedAt` | `confirmed` | Was previously confirmed |
| Cancelled admin-assigned booking with therapist response | `therapist_confirmed` | Therapist had responded |
| Cancelled admin-assigned booking without response | `pending` | Awaiting therapist response |
| Other cancelled bookings | `pending` | Default safe state |

## Files Created

- `restore-cancelled-bookings.js` - Main restoration script
- `BOOKING_RESTORATION_GUIDE.md` - This documentation

## Testing

Before running on production data:
1. Test on a development/staging database first
2. Run with `--preview` flag to verify the logic
3. Check the proposed status changes make sense
4. Backup your database before restoration

## Example Output

**Preview Mode:**
```
=== BOOKING RESTORATION PREVIEW ===

Found 3 cancelled bookings

Preview of restoration actions:
================================

1. Booking ID: 507f1f77bcf86cd799439011
   Current Status: cancelled
   Would Restore To: paid
   Payment Status: completed
   Assigned by Admin: false
   Therapist Responded: true
   Completed At: 2024-01-15T10:30:00.000Z

2. Booking ID: 507f1f77bcf86cd799439012
   Current Status: cancelled
   Would Restore To: confirmed
   Payment Status: partial
   Assigned by Admin: true
   Therapist Responded: true
   Confirmed At: 2024-01-10T14:20:00.000Z

Summary of proposed status changes:
  paid: 1 bookings
  confirmed: 2 bookings
```

**Restore Mode:**
```
=== BOOKING RESTORATION PROCESS STARTED ===

✅ Connected to database

Found 3 cancelled bookings to restore

Processing each cancelled booking...

Processing booking ID: 507f1f77bcf86cd799439011
  Current status: cancelled
  Payment status: completed
  Created at: 2024-01-01T09:00:00.000Z
  Completed at: 2024-01-15T10:30:00.000Z
  Determined previous status: paid
  ✅ Successfully restored to paid

=== RESTORATION SUMMARY ===
Restored 3 bookings out of 3 cancelled bookings
```

## Important Notes

- The system does NOT modify payment information
- The system does NOT modify therapist assignments
- The system does NOT modify service information
- Only the `status`, `cancelledBy`, and `cancelledAt` fields are modified
- All timestamps and audit trails are preserved where possible

## Rollback Plan

If you need to revert the changes:
1. The system doesn't automatically backup data
2. You should backup your database before running restoration
3. You can manually revert by changing statuses back to `cancelled` if needed
4. Consider creating a backup script before restoration

## Support

For issues with the restoration process:
1. Check the console output for error messages
2. Verify database connectivity
3. Ensure you have proper permissions
4. Test with `--preview` first to identify potential issues