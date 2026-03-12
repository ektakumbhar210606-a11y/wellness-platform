# Bonus Penalty Calculation - Quick Reference

## Formula
```
finalBonus = baseBonus - (baseBonus × penalty / 100)
bonusAmount = max(0, finalBonus)
```

## Examples

| Base Bonus | Penalty | Calculation | Final Bonus |
|------------|---------|-------------|-------------|
| ₹3000 | 0% | 3000 - (3000×0/100) | **₹3000** |
| ₹3000 | 10% | 3000 - (3000×10/100) | **₹2700** |
| ₹3000 | 25% | 3000 - (3000×25/100) | **₹2250** |
| ₹3000 | 100% | 3000 - (3000×100/100) | **₹0** |

## Penalty Levels

| Monthly Cancels | Penalty | Bonus Received | Lost |
|----------------|---------|----------------|------|
| 0-2 | 0% | ₹3000 | ₹0 |
| 3-4 | 0% | ₹3000 | ₹0 |
| 5 | 10% | ₹2700 | ₹300 |
| 6 | 25% | ₹2250 | ₹750 |
| 7+ | 100% | ₹0 | ₹3000 |

## Code Location
```
wellness-app/app/api/bonus/calculate/route.ts
```

## Key Changes
✅ Reads `bonusPenaltyPercentage` from therapist profile  
✅ Applies penalty after base bonus calculation  
✅ Ensures bonus never goes negative  
✅ Base bonus remains ₹3000  

## API Flow
```
POST /api/bonus/calculate
    ↓
Check eligibility (rating ≥ 4.0, reviews ≥ 2)
    ↓
Get baseBonus = 3000
    ↓
Get penalty from therapistProfile
    ↓
Calculate: finalBonus = baseBonus - (baseBonus × penalty / 100)
    ↓
Ensure: bonusAmount = max(0, finalBonus)
    ↓
Save bonus with net amount
```

## Important Notes
- ⚠️ Only applies to **new** bonus calculations
- ✅ Existing bonuses remain unchanged
- 📊 Penalty comes from therapist's cancellation record
- 🔒 Minimum bonus is ₹0 (never negative)

---
**Status**: Production Ready
