# Therapist Cancellation Rules - Quick Reference

## Penalty Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Monthly Cancellations  →  Warning  →  Bonus Penalty        │
├─────────────────────────────────────────────────────────────┤
│  0-2 cancellations      →  None     →  0% (No penalty)     │
│  3-4 cancellations      →  YES      →  0% (Warning only)   │
│  5 cancellations        →  YES      →  10% bonus penalty   │
│  6 cancellations        →  YES      →  25% bonus penalty   │
│  7+ cancellations       →  YES      →  100% bonus penalty  │
└─────────────────────────────────────────────────────────────┘
```

## Counter Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `monthlyCancelCount` | Number | 0 | Resets monthly (manual or cron) |
| `totalCancelCount` | Number | 0 | Lifetime tracking |
| `cancelWarnings` | Number | 0 | Warning flag (0 or 1) |
| `bonusPenaltyPercentage` | Number | 0 | Applied to therapist bonuses |

## When Counters Increment

✅ **Counters INCREMENT when:**
- `cancelledBy === "therapist"` (therapist user ID)
- Therapist directly cancels the booking

❌ **Counters DO NOT increment when:**
- Customer cancels
- Business cancels
- System auto-cancels (expired bookings)
- Booking is rescheduled

## Code Logic Flow

```javascript
// 1. Update booking
booking.status = "cancelled"
booking.cancelledBy = therapistUserId
booking.cancelledAt = new Date()

// 2. Find therapist
therapist = TherapistModel.findOne({ user: therapistUserId })

// 3. Increment counters
therapist.monthlyCancelCount += 1
therapist.totalCancelCount += 1

// 4. Apply penalties
if (monthlyCount >= 7) {
  warning = 1
  penalty = 100
} else if (monthlyCount >= 6) {
  warning = 1
  penalty = 25
} else if (monthlyCount >= 5) {
  warning = 1
  penalty = 10
} else if (monthlyCount >= 3) {
  warning = 1
}

// 5. Save
therapist.save()
```

## Example Scenarios

### Scenario A: First Cancellation
```
Before: monthlyCancelCount = 0
After:  monthlyCancelCount = 1
Result: No penalty, no warning
```

### Scenario B: Third Cancellation
```
Before: monthlyCancelCount = 2
After:  monthlyCancelCount = 3
Result: Warning issued (cancelWarnings = 1), no bonus penalty
```

### Scenario C: Fifth Cancellation
```
Before: monthlyCancelCount = 4, bonusPenaltyPercentage = 0
After:  monthlyCancelCount = 5, bonusPenaltyPercentage = 10
Result: Warning issued, 10% bonus penalty applied
```

### Scenario D: Seventh Cancellation
```
Before: monthlyCancelCount = 6, bonusPenaltyPercentage = 25
After:  monthlyCancelCount = 7, bonusPenaltyPercentage = 100
Result: Warning issued, 100% bonus penalty (all bonus forfeited)
```

## API Endpoint Details

**Endpoint:** `PATCH /api/therapist/bookings/:bookingId/cancel`

**Headers:**
```
Authorization: Bearer <therapist_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancelReason": "Personal emergency"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "...",
    "status": "cancelled",
    "customer": { ... },
    "service": { ... }
  }
}
```

## Database Queries

### Find therapists with warnings
```javascript
db.therapists.find({ 
  cancelWarnings: { $gte: 1 } 
}).select('user monthlyCancelCount cancelWarnings bonusPenaltyPercentage')
```

### Find therapists with maximum penalty
```javascript
db.therapists.find({ 
  bonusPenaltyPercentage: 100 
}).select('user monthlyCancelCount totalCancelCount')
```

### Reset monthly counters (manual)
```javascript
db.therapists.updateMany(
  {},
  { $set: { monthlyCancelCount: 0 } }
)
```

---

**Last Updated**: March 12, 2026  
**Implementation Status**: ✅ Active
