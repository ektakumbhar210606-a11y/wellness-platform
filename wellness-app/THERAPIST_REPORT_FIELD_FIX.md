# Therapist Report Fix - Field Name Correction

## Issue
Total Therapists report was not generating detailed therapist data.

## Root Cause
**Wrong field name in MongoDB query!**

The code was using `businessAssociations` but the actual field name in the Therapist model is `associatedBusinesses`.

### Therapist Model Structure (Correct)
```typescript
// From models/Therapist.ts line 150-171
associatedBusinesses: [{
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  requestedAt: { type: Date, default: Date.now },
  approvedAt?: { type: Date }
}]
```

### Wrong Query (Before)
```typescript
// ❌ WRONG FIELD NAME
await TherapistModel.find({
  businessAssociations: { $elemMatch: { businessId: business._id } }
})
```

### Correct Query (After)
```typescript
// ✅ CORRECT FIELD NAME
await TherapistModel.find({
  associatedBusinesses: { $elemMatch: { businessId: business._id } }
})
```

---

## Changes Made

### File: `/app/api/reports/business/custom/route.ts`

#### Change 1: Fixed Count Query (Line ~170)
```typescript
// Before
const therapistCount = await TherapistModel.countDocuments({ 
  businessAssociations: { $elemMatch: { businessId: business._id } }
});

// After
const therapistCount = await TherapistModel.countDocuments({ 
  associatedBusinesses: { $elemMatch: { businessId: business._id } }
});
```

#### Change 2: Fixed Find Query (Line ~176-178)
```typescript
// Before
const allBusinessTherapists = await TherapistModel.find({
  businessAssociations: { $elemMatch: { businessId: business._id } }
}).select('fullName specialization');

// After
const allBusinessTherapists = await TherapistModel.find({
  associatedBusinesses: { $elemMatch: { businessId: business._id } }
}).select('fullName specialization areaOfExpertise');
```

#### Change 3: Enhanced Specialization Display (Line ~192)
```typescript
// Before
specialization: t.specialization || 'Not specified'

// After
specialization: t.areaOfExpertise?.join(', ') || t.specialization || 'Not specified'
```

**Why:** 
- Added `areaOfExpertise` field to the select query
- Try to use `areaOfExpertise` first (more detailed)
- Fall back to `specialization` if no expertise areas
- Fall back to "Not specified" if neither exists

Also added fallback for name:
```typescript
name: t.fullName || 'Unknown'
```

---

## How It Works Now

### Step-by-Step Flow

1. **Query All Bookings** for the business's services
   ```typescript
   const bookings = await BookingModel.find({ 
     service: { $in: serviceIds }
   })
     .populate('therapist', 'fullName')
     .populate('customer', 'name')
     .populate('service', 'name price duration description')
   ```

2. **Count Unique Therapists** from bookings
   ```typescript
   const uniqueTherapists = new Set(
     bookings.map(b => b.therapist?._id?.toString()).filter(Boolean)
   );
   ```

3. **Count Associated Therapists** from therapist model
   ```typescript
   const therapistCount = await TherapistModel.countDocuments({ 
     associatedBusinesses: { $elemMatch: { businessId: business._id } }
   });
   ```

4. **Get Higher Count** (therapists from bookings OR associated)
   ```typescript
   reportData.totalTherapists = Math.max(uniqueTherapists.size, therapistCount);
   ```

5. **Fetch All Associated Therapists** with full details
   ```typescript
   const allBusinessTherapists = await TherapistModel.find({
     associatedBusinesses: { $elemMatch: { businessId: business._id } }
   }).select('fullName specialization areaOfExpertise');
   ```

6. **Count Bookings Per Therapist**
   ```typescript
   const therapistBookings: Record<string, number> = {};
   bookings.forEach(booking => {
     const therapistId = booking.therapist?._id?.toString();
     if (therapistId) {
       therapistBookings[therapistId] = (therapistBookings[therapistId] || 0) + 1;
     }
   });
   ```

7. **Map to Final Format**
   ```typescript
   reportData.therapists = allBusinessTherapists.map(t => ({
     _id: t._id.toString(),
     name: t.fullName || 'Unknown',
     specialization: t.areaOfExpertise?.join(', ') || t.specialization || 'Not specified',
     totalBookings: therapistBookings[t._id.toString()] || 0,
   }));
   ```

---

## What Gets Displayed Now

### Example Output

**Total Therapists: 5**

| Therapist Name | Specialization | Total Bookings |
|----------------|----------------|----------------|
| Sarah Johnson | swedish_massage, deep_tissue_massage | 15 |
| Mike Chen | aromatherapy_massage, hot_stone_massage | 12 |
| Emily Davis | thai_massage, reflexology | 8 |
| Lisa Wong | stress_management, meditation_mindfulness | 5 |
| David Kumar | Not specified | 0 |

**Summary Row:**
- Total: (blank) | (blank) | **40 bookings**

---

## Specialization Priority

The code now tries multiple fields in order:

1. **`areaOfExpertise`** (joined as comma-separated list)
   - Example: `"swedish_massage, deep_tissue_massage"`
   
2. **`specialization`** (single value or array)
   - Example: `"massage_therapy"`
   
3. **"Not specified"** (fallback)
   - When neither field has data

---

## Testing Checklist

### ✅ Test 1: Basic Therapist Report
1. Select "Total Therapists"
2. Click "Generate Report"
3. **Verify:**
   - [ ] Table shows all therapists associated with business
   - [ ] Names display correctly (or "Unknown" if missing)
   - [ ] Specializations show expertise areas or "Not specified"
   - [ ] Booking counts are accurate
   - [ ] Summary row shows total bookings

### ✅ Test 2: Therapist with No Bookings
1. Have a therapist associated with business but no bookings
2. Generate report
3. **Verify:**
   - [ ] Therapist still appears in table
   - [ ] Shows "0" in Total Bookings column
   - [ ] Specialization displays correctly

### ✅ Test 3: Multiple Expertise Areas
1. Have therapist with multiple expertise areas
2. Generate report
3. **Verify:**
   - [ ] Shows all expertise areas comma-separated
   - [ ] Example: "swedish_massage, deep_tissue_massage"

### ✅ Test 4: Combined Reports
1. Select "Total Therapists" + other fields
2. Generate report
3. **Verify:**
   - [ ] Therapists table appears
   - [ ] Other selected reports also appear
   - [ ] No errors or conflicts

---

## Common Issues & Solutions

### Issue: Still No Therapists Showing

**Possible Causes:**

1. **No therapists associated with business**
   ```javascript
   // Check in MongoDB
   db.therapists.find({
     associatedBusinesses: { $elemMatch: { businessId: YOUR_BUSINESS_ID } }
   })
   ```

2. **Business ID mismatch**
   - Verify business._id is correct
   - Check if you're querying the right business

3. **Association status is "pending"**
   - Current query includes ALL statuses (pending, approved, rejected)
   - If you want only approved:
     ```typescript
     associatedBusinesses: { 
       $elemMatch: { 
         businessId: business._id,
         status: 'approved'
       } 
     }
     ```

### Issue: Specialization Shows "Not specified"

**Solutions:**

1. **Add expertise areas to therapist profile**
   ```typescript
   // Update therapist
   db.therapists.updateOne(
     { _id: THERAPIST_ID },
     { $set: { areaOfExpertise: ['swedish_massage', 'deep_tissue_massage'] } }
   )
   ```

2. **Or add specialization field**
   ```typescript
   db.therapists.updateOne(
     { _id: THERAPIST_ID },
     { $set: { specialization: 'Massage Therapy' } }
   )
   ```

---

## Related Documentation

- See `DETAILED_REPORTS_IMPLEMENTATION.md` for overall feature design
- See `DATE_PARSING_ERROR_FIX.md` for date validation fixes
- See `MONGODB_CONNECTION_FIX.md` for database connection issues

---

## Quick Reference

| Field Name | Status | Usage |
|------------|--------|-------|
| `associatedBusinesses` | ✅ Correct | Use this! |
| `businessAssociations` | ❌ Wrong | Don't use! |

| Data Source | Provides |
|-------------|----------|
| `areaOfExpertise` | Array of expertise IDs (preferred) |
| `specialization` | Single skill or legacy field |
| `skills` | Array of skill IDs (not used for display) |

---

## Summary

**Problem:** Therapists report showed no data due to wrong field name

**Root Cause:** Used `businessAssociations` instead of `associatedBusinesses`

**Solution:** Fixed query to use correct field name + enhanced specialization display

**Result:** Detailed therapists report now generates correctly with:
- ✅ All associated therapists listed
- ✅ Proper specialization display (expertise areas)
- ✅ Accurate booking counts per therapist
- ✅ Summary totals
