# Date Parsing Error Fix - RangeError: Invalid time value

## Issue
```
RangeError: Invalid time value
    at Date1.toISOString (<anonymous>)
    at app\api\reports\business\custom\route.ts:216:103
```

## Root Cause
Some bookings in the database have invalid or corrupted date values in `appointmentDate` or `createdAt` fields. When the code tried to call `.toISOString()` on these invalid dates, it threw a `RangeError`.

**Common causes of invalid dates:**
- Manual database edits with incorrect date formats
- Legacy data from old system migrations
- Null/undefined values stored as strings
- Corrupted timestamps

---

## Solution

### Before (Unsafe Code)
```typescript
// ❌ Direct conversion without validation
date: b.appointmentDate 
  ? new Date(b.appointmentDate).toISOString() 
  : new Date(b.createdAt).toISOString();
```

**Problem:** If either date is invalid, `new Date()` creates an "Invalid Date" object, and calling `.toISOString()` on it throws an error.

---

### After (Safe Code with Validation)
```typescript
// ✅ Validate dates before using
let appointmentDate: Date | null = null;
if (b.appointmentDate) {
  appointmentDate = new Date(b.appointmentDate);
  if (isNaN(appointmentDate.getTime())) {
    appointmentDate = null; // Invalid date, will use fallback
  }
}

let createdDate: Date | null = null;
if (b.createdAt) {
  createdDate = new Date(b.createdAt);
  if (isNaN(createdDate.getTime())) {
    createdDate = new Date(); // Fallback to current date
  }
} else {
  createdDate = new Date();
}

// Safe to call .toISOString() now
date: appointmentDate 
  ? appointmentDate.toISOString() 
  : createdDate.toISOString();
```

**How it works:**
1. Parse the date with `new Date()`
2. Check if valid using `isNaN(date.getTime())`
3. If invalid, use fallback (current date or alternative field)
4. Only call `.toISOString()` on validated dates

---

## Files Modified

### `/app/api/reports/business/custom/route.ts`

#### Change 1: Booking Details (Lines ~206-237)
**Location:** Inside `bookings.map()` callback

Added comprehensive date validation:
- Validates `appointmentDate`
- Validates `createdAt`
- Falls back to current date if both are invalid
- Ensures `date` field always has valid ISO string

#### Change 2: Monthly Revenue (Lines ~318-340)
**Location:** Inside `monthlyRevenue` calculation

Added date validation for revenue trend calculation:
- Validates `booking.createdAt` before extracting month
- Uses current date as fallback
- Prevents errors in monthly revenue reports

---

## Testing Checklist

### ✅ Test 1: Reports with Valid Dates
1. Generate any booking-related report
2. **Verify:** No errors, dates display correctly

### ✅ Test 2: Reports with Invalid Dates
1. Find/create a booking with invalid date in database
2. Generate report including that booking
3. **Verify:** 
   - No crash
   - Uses fallback date (current date)
   - Report generates successfully

### ✅ Test 3: Monthly Revenue Report
1. Select "Monthly Revenue" field
2. Click "Generate Report"
3. **Verify:** Shows revenue trend without errors

### ✅ Test 4: All Fields Together
1. Select all 9 report fields
2. Click "Generate Report"
3. **Verify:** Everything generates without date errors

---

## Technical Details

### Date Validation Pattern

```typescript
function safeDate(value: any): Date {
  if (!value) return new Date();
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Date(); // Fallback
  }
  
  return date;
}
```

### Why `isNaN(date.getTime())` Works

- `date.getTime()` returns `NaN` for invalid dates
- `isNaN(NaN)` returns `true`
- `isValidDate = !isNaN(date.getTime())` checks validity

### Alternative Approaches (Not Used)

❌ `instanceof Date` check:
```typescript
// Doesn't work - "Invalid Date" is still instanceof Date
if (value instanceof Date) { /* ... */ }
```

❌ String parsing:
```typescript
// Too strict - rejects some valid formats
if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) { /* ... */ }
```

✅ `getTime()` validation is the most reliable method.

---

## Database Cleanup (Optional)

If you want to fix invalid dates in your database:

### Find Bookings with Invalid Dates
```javascript
// In MongoDB Compass or shell
db.bookings.find({
  $or: [
    { appointmentDate: { $type: "string" } },
    { createdAt: { $type: "string" } }
  ]
})
```

### Fix Invalid Dates
```javascript
// Update bookings with null/invalid dates
db.bookings.updateMany(
  { 
    appointmentDate: { $in: [null, "", "invalid", "N/A"] } 
  },
  { 
    $set: { appointmentDate: new Date() } 
  }
)
```

⚠️ **Warning:** Always backup your database before running update queries!

---

## Related Issues

This fix also prevents similar errors in:
- ✅ PDF generation (uses same booking data)
- ✅ Excel export (uses same booking data)
- ✅ Frontend display (prevents React errors)
- ✅ Monthly revenue calculations

---

## Prevention

To prevent invalid dates in the future:

### 1. Add Mongoose Schema Validation
```typescript
const BookingSchema = new Schema({
  appointmentDate: {
    type: Date,
    validate: {
      validator: function(v: any) {
        return !v || !isNaN(new Date(v).getTime());
      },
      message: 'Invalid date format'
    }
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    validate: {
      validator: function(v: any) {
        return !isNaN(new Date(v).getTime());
      },
      message: 'Invalid date format'
    }
  }
});
```

### 2. Use Mongoose Middleware
```typescript
BookingSchema.pre('save', function(next) {
  if (this.appointmentDate && isNaN(this.appointmentDate.getTime())) {
    this.appointmentDate = new Date();
  }
  next();
});
```

### 3. Add API Input Validation
```typescript
// In your API route
if (body.appointmentDate) {
  const parsedDate = new Date(body.appointmentDate);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
}
```

---

## Quick Reference

| Location | Issue | Fix |
|----------|-------|-----|
| Line ~216 | `appointmentDate` invalid | Added validation with fallback |
| Line ~216 | `createdAt` invalid | Added validation with fallback |
| Line ~324 | Monthly revenue date | Added validation with fallback |

---

## Summary

**Problem:** Invalid dates in database caused `RangeError` when generating reports

**Solution:** Added comprehensive date validation with safe fallbacks

**Result:** Reports now generate successfully even with corrupted date data

**Impact:** 
- ✅ No more crashes from invalid dates
- ✅ Graceful degradation with sensible defaults
- ✅ Better user experience
- ✅ More robust error handling

---

## Related Documentation
- See `MONGODB_CONNECTION_FIX.md` for database connection issues
- See `REPORT_DATA_AND_PDF_FIX_COMPLETE.md` for detailed reporting features
- See `DETAILED_REPORTS_IMPLEMENTATION.md` for feature overview
