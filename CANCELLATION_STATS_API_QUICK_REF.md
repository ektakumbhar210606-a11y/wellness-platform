# Business Therapist Cancellation Stats API - Quick Reference

## Endpoint
```
GET /api/business/therapist-cancellation-stats
```

## Authentication
```
Authorization: Bearer <business_jwt_token>
```

## Response Example
```json
[
  {
    "therapistName": "Rahul Kumar",
    "completedBookings": 32,
    "monthlyCancelCount": 2,
    "totalCancelCount": 10,
    "cancelWarnings": 0,
    "bonusPenaltyPercentage": 0
  },
  {
    "therapistName": "Meera Sharma",
    "completedBookings": 25,
    "monthlyCancelCount": 5,
    "totalCancelCount": 15,
    "cancelWarnings": 1,
    "bonusPenaltyPercentage": 10
  }
]
```

## Penalty Levels

| Monthly Cancels | Bonus Penalty | Status |
|----------------|---------------|--------|
| 0-2 | 0% | ✅ Normal |
| 3-4 | 0% | ⚠️ Warning |
| 5 | 10% | 🟠 Light Penalty |
| 6 | 25% | 🟠 Medium Penalty |
| 7+ | 100% | 🔴 Maximum Penalty |

## Testing
```bash
node test-business-cancellation-stats.js
```

## Key Features
✅ Only shows approved therapists  
✅ Counts completed bookings per therapist  
✅ Displays cancellation tracking data  
✅ Shows bonus penalty percentages  
✅ No impact on existing booking APIs  

---
**Status**: Ready for use
