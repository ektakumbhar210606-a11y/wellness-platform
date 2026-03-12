# Therapist Cancellation Data Display Fix

## Problem
The Cancellation Performance card on the therapist dashboard was showing **0 monthly cancellations** even when therapists had cancelled bookings (e.g., Sunny had 1-2 cancellations but the dashboard showed 0).

## Root Cause
Two issues were identified:

### Issue 1: API Missing Cancellation Fields
The `/api/therapist/me` API endpoint was **not returning cancellation tracking fields** in its response. 

The `TherapistCancellationCard` component fetches data from this endpoint:
```typescript
const response = await fetch('/api/therapist/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

However, the API response was missing these critical fields:
- `monthlyCancelCount`
- `totalCancelCount`
- `cancelWarnings`
- `bonusPenaltyPercentage`

### Issue 2: Business Cancellations Not Tracked to Therapist
When a business cancelled a booking that had a `therapistCancelReason`, the therapist's cancellation counters were **not being incremented**. This meant cancellations initiated by therapists (but formally processed by the business) weren't reflected in the therapist's stats.

## Solution
Two fixes were applied:

### Fix 1: Add Cancellation Fields to API Response
**File Modified:** `wellness-app/app/api/therapist/me/route.ts`

**Changes Made:**
```typescript
const therapistData = {
  id: therapist._id.toString(),
  userId: therapist.user.toString(),
  // ... other existing fields ...
  updatedAt: therapist.updatedAt,
  
  // ✅ ADDED: Cancellation tracking fields
  monthlyCancelCount: therapist.monthlyCancelCount || 0,
  totalCancelCount: therapist.totalCancelCount || 0,
  cancelWarnings: therapist.cancelWarnings || 0,
  bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0
};
```

### Fix 2: Track Therapist Cancellations When Business Cancels
**File Modified:** `wellness-app/app/api/business/assigned-bookings/cancel/[bookingId]/route.ts`

**Changes Made:**
Added logic to check if a booking has a `therapistCancelReason` when the business cancels. If it does, the therapist's cancellation counters are incremented:

```typescript
// Check if this should count as a therapist cancellation
if (booking.therapistCancelReason && booking.therapist) {
  const cancellingTherapist = await TherapistModel.findOne({ 
    user: (booking.therapist as any).user 
  });
  
  if (cancellingTherapist) {
    // Increase therapist cancellation counters
    cancellingTherapist.monthlyCancelCount += 1;
    cancellingTherapist.totalCancelCount += 1;
    
    // Apply penalty rules based on monthly count
    // ...
  }
}
```

## How Cancellation Tracking Works

### When a Therapist Cancels a Booking
1. Therapist calls `/api/therapist/bookings/:bookingId/cancel`
2. Backend updates the therapist's cancellation counters:
   ```typescript
   cancellingTherapist.monthlyCancelCount += 1;
   cancellingTherapist.totalCancelCount += 1;
   ```
3. Penalty rules are applied based on monthly count:
   - **3-4 cancellations**: Warning issued
   - **5 cancellations**: 10% bonus penalty
   - **6 cancellations**: 25% bonus penalty
   - **7+ cancellations**: 100% bonus penalty

### Data Flow
```
Database (Therapist Model)
  ↓
API: /api/therapist/me
  ↓
Frontend: TherapistCancellationCard Component
  ↓
UI Display (Dashboard)
```

## Testing

### Option 1: Run Test Script
```bash
node test-therapist-me-api.js
```

This will:
1. Connect to MongoDB
2. Find a therapist (prefers "Sunny" if exists)
3. Check cancellation data in database
4. Verify API response includes cancellation fields
5. Provide next steps for manual testing

### Option 2: Manual Testing
1. **Restart the Next.js development server:**
   ```bash
   cd wellness-app
   npm run dev
   ```

2. **Login as a therapist who has cancelled bookings:**
   - Example: Sunny (sunny2@gmail.com / therapist123)

3. **Navigate to Dashboard Overview**

4. **Check the "Cancellation Performance" card:**
   - Monthly Cancellations should now show the correct count
   - Total Cancellations should match database
   - Warning Status should display if applicable
   - Bonus Penalty percentage should be accurate

### Expected Results
For a therapist with cancellations:
- ✅ **Monthly Cancellations**: Shows actual count (not 0)
- ✅ **Total Cancellations**: Shows lifetime count
- ✅ **Warning Status**: Displays "Active" if 3+ monthly cancellations
- ✅ **Bonus Penalty**: Shows correct penalty percentage

## Verification Checklist
- [x] API endpoint updated to include cancellation fields
- [x] Fields default to 0 if not set in database
- [x] Test script created for validation
- [ ] Development server restarted
- [ ] Manual testing completed with therapist account
- [ ] UI displays correct cancellation counts

## Related Files
- **Frontend Component**: `wellness-app/app/components/therapist/TherapistCancellationCard.tsx`
- **API Endpoint (Fix 1)**: `wellness-app/app/api/therapist/me/route.ts`
- **API Endpoint (Fix 2)**: `wellness-app/app/api/business/assigned-bookings/cancel/[bookingId]/route.ts`
- **Therapist Model**: `wellness-app/models/Therapist.ts`
- **Cancel API (Therapist)**: `wellness-app/app/api/therapist/bookings/[bookingId]/cancel/route.ts`

## Impact
- ✅ **Therapist Dashboard**: Now displays accurate cancellation statistics
- ✅ **Performance Tracking**: Therapists can see their cancellation metrics
- ✅ **Bonus Penalties**: Correctly displayed when penalties are applied
- ✅ **Transparency**: Improves visibility into cancellation performance

## Notes
- Monthly cancellation counters are reset on the 1st of every month via scheduled job
- The cancellation tracking system was already working correctly in the database for therapist-initiated cancellations
- **Fix 1** ensures the frontend receives all necessary cancellation data from the API
- **Fix 2** ensures business cancellations with therapist reasons are properly tracked
- Both fixes together ensure accurate display of cancellation statistics

---

**Status**: ✅ Fixed - Ready for Testing  
**Date**: March 12, 2026  
**Severity**: Medium (Display Issue)
