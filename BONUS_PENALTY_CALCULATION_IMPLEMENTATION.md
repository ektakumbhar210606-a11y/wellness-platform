# Therapist Bonus Penalty Calculation - Implementation

## Overview
Updated the therapist bonus calculation logic to apply cancellation penalties based on the therapist's monthly cancellation performance.

## Location
```
wellness-app/app/api/bonus/calculate/route.ts
```

## Changes Made

### Before (Old Logic)
```javascript
// Calculate bonus amount
const bonusAmount = 3000;
```

**Issues:**
- Fixed bonus amount regardless of performance
- No penalty applied for cancellations
- Doesn't incentivize good attendance

### After (New Logic)
```javascript
// Calculate bonus amount
const baseBonus = 3000;

// Get therapist's cancellation penalty percentage
const penalty = therapistProfile.bonusPenaltyPercentage || 0;

// Apply cancellation penalty to calculate final bonus
// Formula: finalBonus = baseBonus - (baseBonus * penalty / 100)
const finalBonus = baseBonus - (baseBonus * penalty / 100);

// Ensure bonus doesn't go below 0
const bonusAmount = Math.max(0, finalBonus);
```

**Improvements:**
- ✅ Reads therapist's `bonusPenaltyPercentage` from profile
- ✅ Applies progressive penalty based on cancellations
- ✅ Ensures bonus never goes negative
- ✅ Maintains base bonus calculation unchanged

## Calculation Formula

### Formula
```
penalty = therapist.bonusPenaltyPercentage
finalBonus = baseBonus - (baseBonus * penalty / 100)
bonusAmount = max(0, finalBonus)
```

### Examples

#### Example 1: No Penalty (Excellent Performance)
```
baseBonus = 3000
penalty = 0%

finalBonus = 3000 - (3000 * 0 / 100)
           = 3000 - 0
           = 3000

bonusAmount = ₹3000
```

#### Example 2: Light Penalty (5 Monthly Cancellations)
```
baseBonus = 3000
penalty = 10%

finalBonus = 3000 - (3000 * 10 / 100)
           = 3000 - 300
           = 2700

bonusAmount = ₹2700
```

#### Example 3: Medium Penalty (6 Monthly Cancellations)
```
baseBonus = 3000
penalty = 25%

finalBonus = 3000 - (3000 * 25 / 100)
           = 3000 - 750
           = 2250

bonusAmount = ₹2250
```

#### Example 4: Maximum Penalty (7+ Monthly Cancellations)
```
baseBonus = 3000
penalty = 100%

finalBonus = 3000 - (3000 * 100 / 100)
           = 3000 - 3000
           = 0

bonusAmount = ₹0
```

## Penalty Reference Table

| Monthly Cancels | Penalty % | Base Bonus | Final Bonus | Reduction |
|----------------|-----------|------------|-------------|-----------|
| 0-2 | 0% | ₹3000 | ₹3000 | ₹0 |
| 3-4 | 0% | ₹3000 | ₹3000 | ₹0 |
| 5 | 10% | ₹3000 | ₹2700 | ₹300 |
| 6 | 25% | ₹3000 | ₹2250 | ₹750 |
| 7+ | 100% | ₹3000 | ₹0 | ₹3000 |

## Implementation Details

### Step-by-Step Flow

1. **Verify Eligibility**
   - Check average rating ≥ 4.0
   - Check total reviews ≥ 2
   - If not eligible, return early (no bonus)

2. **Get Base Bonus**
   ```javascript
   const baseBonus = 3000;
   ```

3. **Fetch Therapist Penalty**
   ```javascript
   const penalty = therapistProfile.bonusPenaltyPercentage || 0;
   ```

4. **Calculate Penalty Deduction**
   ```javascript
   const finalBonus = baseBonus - (baseBonus * penalty / 100);
   ```

5. **Ensure Non-Negative Bonus**
   ```javascript
   const bonusAmount = Math.max(0, finalBonus);
   ```

6. **Save Bonus Record**
   ```javascript
   const newBonus = new TherapistBonus({
     // ... other fields
     bonusAmount: bonusAmount,
     status: 'pending'
   });
   ```

## Data Source

### Therapist Profile Fields
The penalty percentage comes from the Therapist model:

```typescript
// From wellness-app/models/Therapist.ts
bonusPenaltyPercentage: {
  type: Number,
  default: 0,
  min: [0, 'Bonus penalty percentage cannot be negative'],
  max: [100, 'Bonus penalty percentage cannot exceed 100']
}
```

### How Penalty is Determined
The penalty is automatically calculated when therapists cancel bookings:

```javascript
// From therapist booking cancellation API
if (monthlyCount >= 7) {
  therapist.bonusPenaltyPercentage = 100;
} else if (monthlyCount >= 6) {
  therapist.bonusPenaltyPercentage = 25;
} else if (monthlyCount >= 5) {
  therapist.bonusPenaltyPercentage = 10;
}
```

## API Endpoint

### Request
```http
POST /api/bonus/calculate
Authorization: Bearer <business_token>
Content-Type: application/json

{
  "therapistId": "therapist_profile_id",
  "month": 3,
  "year": 2026
}
```

### Response (Success with 10% Penalty)
```json
{
  "success": true,
  "bonus": {
    "id": "bonus_id",
    "therapist": "therapist_user_id",
    "business": "business_user_id",
    "month": 3,
    "year": 2026,
    "averageRating": 4.8,
    "totalReviews": 5,
    "bonusAmount": 2700,
    "status": "pending",
    "createdAt": "2026-03-12T10:30:00.000Z"
  }
}
```

### Response (Not Eligible)
```json
{
  "success": false,
  "message": "Not eligible",
  "averageRating": 3.5,
  "totalReviews": 1
}
```

## Business Logic Integration

### Cancellation Tracking System
This change completes the therapist cancellation control system:

1. **Track Cancellations** → Therapist schema fields
2. **Apply Penalties** → Automatic during cancellation
3. **Calculate Bonus** → Uses penalty at bonus time ✅

### Full Workflow
```
Therapist cancels booking
    ↓
monthlyCancelCount increments
    ↓
bonusPenaltyPercentage updated
    ↓
Business calculates monthly bonus
    ↓
Penalty applied to final bonus
    ↓
Reduced bonus saved to database
```

## Testing Scenarios

### Test Case 1: Excellent Performance
```
Input:
  - baseBonus: 3000
  - monthlyCancellations: 1
  - penalty: 0%

Expected:
  - bonusAmount: 3000
```

### Test Case 2: Moderate Issues
```
Input:
  - baseBonus: 3000
  - monthlyCancellations: 5
  - penalty: 10%

Expected:
  - bonusAmount: 2700
```

### Test Case 3: Critical Status
```
Input:
  - baseBonus: 3000
  - monthlyCancellations: 8
  - penalty: 100%

Expected:
  - bonusAmount: 0
```

## Edge Cases Handled

### 1. Null/Undefined Penalty
```javascript
const penalty = therapistProfile.bonusPenaltyPercentage || 0;
// Defaults to 0 if not set
```

### 2. Negative Bonus Prevention
```javascript
const bonusAmount = Math.max(0, finalBonus);
// Ensures bonus is never negative
```

### 3. Floating Point Precision
```javascript
// JavaScript handles decimal calculations correctly
// e.g., 3000 * 10 / 100 = 300 (exact)
```

## Database Impact

### TherapistBonus Records
Each bonus record now stores the **net amount** after penalty:

```javascript
{
  _id: ObjectId("..."),
  therapist: ObjectId("..."),
  business: ObjectId("..."),
  month: 3,
  year: 2026,
  averageRating: 4.8,
  totalReviews: 5,
  bonusAmount: 2700,  // ← Net amount after penalty
  status: "pending",
  createdAt: ISODate("2026-03-12T10:30:00.000Z")
}
```

## Compatibility

### Backward Compatibility
✅ **Existing bonuses unaffected** - Only new calculations use penalty  
✅ **Base bonus unchanged** - Still ₹3000 before penalty  
✅ **Eligibility criteria same** - Rating ≥ 4.0, Reviews ≥ 2  

### Forward Compatibility
✅ **Scalable** - Easy to adjust base bonus amounts  
✅ **Flexible** - Can add more penalty factors  
✅ **Extensible** - Can store penalty details in bonus record  

## Code Quality

### Best Practices Followed
- ✅ Clear variable naming (`baseBonus`, `penalty`, `finalBonus`)
- ✅ Inline comments explain formula
- ✅ Defensive programming with `Math.max()`
- ✅ Single responsibility (only applies penalty)
- ✅ No breaking changes to existing logic

### Maintainability
- Formula clearly documented
- Easy to adjust base bonus
- Penalty logic centralized
- Well-tested edge cases

---

**Implementation Date**: March 12, 2026  
**Status**: ✅ Complete and Production Ready  
**Version**: 1.0
