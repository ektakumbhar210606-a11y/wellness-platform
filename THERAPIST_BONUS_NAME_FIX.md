# Therapist Bonus Name Display Fix

## Problem Description
Therapist names were displaying as "Unknown Therapist" in the Business Dashboard's Therapist Bonuses component instead of showing actual therapist names.

## Root Cause Analysis

### Data Model Mismatch
The issue was caused by a data model mismatch in how therapist references were stored in the `TherapistBonus` collection:

1. **TherapistBonus Schema Design**: The `therapist` field in `TherapistBonus` schema is designed to reference the **User model** (therapist's user ID), not the Therapist profile model.

2. **Incorrect Data Storage**: In `/api/bonus/calculate/route.ts` (line 183), the code was storing the **Therapist profile ID** (`therapistId`) instead of the **therapist's user ID** (`therapistUserId`).

3. **Population Failure**: When fetching bonuses in `/api/bonus/route.ts`, the code attempted to populate the therapist field using `.populate('therapist', 'name firstName lastName')`, expecting User model data. Since the stored ID pointed to a Therapist profile (not a User), the population failed, resulting in null therapist data and "Unknown Therapist" being displayed.

### Data Flow Issue
```
Therapist Profile Model:
{
  _id: "therapist_profile_id",  // Therapist profile ID
  user: "user_id",              // References User model
  fullName: "John Doe",
  ...
}

TherapistBonus (BEFORE FIX):
{
  therapist: "therapist_profile_id",  // ❌ Wrong! Points to Therapist model
  ...
}

TherapistBonus (AFTER FIX):
{
  therapist: "user_id",  // ✅ Correct! Points to User model
  ...
}
```

## Solution Implemented

### Files Modified

#### 1. `/api/bonus/calculate/route.ts`
**Changes:**
- Line 123: Updated existing bonus check to use `therapistUserId` instead of `therapistId`
- Line 183: Changed bonus creation to store therapist's user ID instead of profile ID
- Line 201: Added `therapistId` field to response for consistency

**Before:**
```typescript
const existingBonus = await TherapistBonus.findOne({
  therapist: therapistId,  // ❌ Wrong - profile ID
  month: month,
  year: year
});

const newBonus = new TherapistBonus({
  therapist: therapistId,  // ❌ Wrong - profile ID
  business: userId,
  ...
});
```

**After:**
```typescript
const existingBonus = await TherapistBonus.findOne({
  therapist: therapistUserId,  // ✅ Correct - user ID
  month: month,
  year: year
});

const newBonus = new TherapistBonus({
  therapist: therapistUserId,  // ✅ Correct - user ID
  business: userId,
  ...
});
```

#### 2. `/api/bonus/route.ts`
**Changes:**
- Enhanced comment to clarify we're populating the User model
- Added explicit `therapistUserId` variable for better code clarity
- Improved therapist ID extraction logic

**Before:**
```typescript
return {
  id: bonus._id.toString(),
  therapistId: therapist?._id?.toString() || bonus.therapist?.toString() || '',
  therapistName: therapistName,
  ...
};
```

**After:**
```typescript
let therapistUserId = '';

if (therapist) {
  therapistName = therapist.name || 
                 `${therapist.firstName || ''} ${therapist.lastName || ''}`.trim() || 
                 'Unknown Therapist';
  therapistUserId = therapist._id?.toString() || '';
}

return {
  id: bonus._id.toString(),
  therapistId: therapistUserId,
  therapistName: therapistName,
  ...
};
```

## Testing Steps

### 1. Test New Bonus Calculation
```bash
# Run the test script
node test-bonus-fix.js
```

### 2. Manual Testing in UI
1. Log in as a Business/Provider user
2. Navigate to Business Dashboard
3. Click on "Therapist Bonuses" section
4. Select a therapist from dropdown
5. Select current month and year
6. Click "Calculate Bonus"
7. Verify therapist name displays correctly in the bonus history table

### 3. Verify Database Records
Check MongoDB directly:
```javascript
// In MongoDB Compass or shell
db.therapistbonuses.find().pretty()

// Should show therapist field containing User _id (not Therapist profile _id)
{
  "_id": ObjectId("..."),
  "therapist": ObjectId("user_id_here"),  // ✅ Should match User collection
  "business": ObjectId("..."),
  "month": 3,
  "year": 2026,
  "averageRating": 4.5,
  "totalReviews": 5,
  "bonusAmount": 3000,
  "status": "pending"
}
```

## Migration for Existing Records

If you have existing bonus records with incorrect therapist references, you may need to migrate them:

```javascript
// ⚠️ WARNING: Backup your database before running this!
// Run this in MongoDB shell or Compass

// Migration script to fix existing records
const bulkOps = [];

// Find all bonus records with invalid therapist references
db.therapistbonuses.find().forEach((bonus) => {
  // Try to find the therapist profile by the incorrectly stored ID
  const therapistProfile = db.therapists.findOne({ _id: bonus.therapist });
  
  if (therapistProfile) {
    // Update to use the correct user ID
    bulkOps.push({
      updateOne: {
        filter: { _id: bonus._id },
        update: { $set: { therapist: therapistProfile.user } }
      }
    });
  }
});

// Execute bulk update if there are records to fix
if (bulkOps.length > 0) {
  db.therapistbonuses.bulkWrite(bulkOps);
  print(`Migrated ${bulkOps.length} records`);
} else {
  print('No records need migration');
}
```

## Verification Checklist

- [x] Code changes implemented in `/api/bonus/calculate/route.ts`
- [x] Code changes implemented in `/api/bonus/route.ts`
- [ ] New bonus calculations work correctly
- [ ] Therapist names display properly in UI
- [ ] Existing bonuses (if any) are migrated or handled
- [ ] Bonus payment functionality still works
- [ ] No breaking changes to other API endpoints

## Related Models

### TherapistBonus Schema
```typescript
{
  therapist: ObjectId;  // References User model (therapist's user ID)
  business: ObjectId;   // References User model (business's user ID)
  month: Number;
  year: Number;
  averageRating?: Number;
  totalReviews?: Number;
  bonusAmount?: Number;
  status: 'pending' | 'paid';
  createdAt: Date;
}
```

### Key Relationships
- `Therapist.user` → `User._id` (therapist's login account)
- `TherapistBonus.therapist` → `User._id` (should reference same as Therapist.user)
- `Review.therapist` → `User._id` (consistent design pattern)

## Impact Assessment

### Affected Components
- ✅ Business Dashboard - Therapist Bonuses section
- ✅ Bonus calculation API
- ✅ Bonus retrieval API
- ✅ Bonus payment status update API

### Backward Compatibility
- ⚠️ Existing bonus records with incorrect therapist IDs will still show "Unknown Therapist"
- ✅ New bonus calculations will work correctly
- 📝 Migration script available for existing records

## Files Changed Summary

1. `wellness-app/app/api/bonus/calculate/route.ts` - Fixed therapist ID storage
2. `wellness-app/app/api/bonus/route.ts` - Enhanced therapist name retrieval

## Next Steps

1. Test the fix thoroughly
2. Run migration script for existing records (if needed)
3. Monitor bonus calculations to ensure proper functioning
4. Consider adding database constraint/index to prevent future mismatches
