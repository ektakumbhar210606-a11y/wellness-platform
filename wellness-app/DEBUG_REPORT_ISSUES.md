# Debugging Guide - Customer Names & Monthly Revenue

## Current Issues Being Investigated

### Issue 1: Customer Names Showing as "N/A" ❌
Even after fixing the population logic, customer names still display as "N/A".

**Possible Causes:**
1. Customer data not being populated correctly
2. Customer model schema different from expected
3. Population query not matching actual field names
4. Database connection/population timing issue

---

### Issue 2: Monthly Revenue Showing ₹0.00 ❌
Monthly revenue trend table shows zero revenue even for completed bookings.

**Possible Causes:**
1. No completed bookings exist
2. Price fields (finalPrice/originalPrice) are all null/zero
3. Date validation skipping all bookings
4. Calculation error in revenue formula

---

## Debug Logging Added

### What to Look For in Console

When you generate a report, check the server console for these debug messages:

#### 1. Initial Data Check
```
=== THERAPIST REPORT DEBUG ===
Total bookings found: X
Sample booking: {
  _id: "...",
  customer: { firstName: "John", lastName: "Doe" } OR null,
  finalPrice: 100 OR undefined,
  originalPrice: undefined,
  service: "Swedish Massage" OR "No service",
  status: "completed",
  createdAt: "2026-03-10T10:30:00Z"
}
===========================
```

**What This Tells Us:**
- ✅ If `customer` has `firstName` and `lastName` → Population working
- ❌ If `customer` is `null` or `{}` → Population failing
- ✅ If `finalPrice` or `originalPrice` has value → Price data exists
- ❌ If both prices are `undefined` → Price data missing

---

#### 2. Monthly Revenue Processing
```
Processing booking 697b38cf5f78da5ab3671ae0: {
  month: "2026-03",
  finalPrice: 100,
  originalPrice: undefined,
  bookingPrice: 100,
  revenue: 70
}
Monthly Revenue: Processed 5 bookings, Skipped 0 bookings
Monthly revenue data: { '2026-03': 350 }
```

**What This Tells Us:**
- ✅ If bookings are processing → Revenue should appear
- ❌ If `bookingPrice: 0` → No price data in database
- ❌ If `skipped: X` bookings → Date validation failing
- ❌ If `monthly revenue data: {}` → No completed bookings

---

## Step-by-Step Testing

### Test 1: Generate Any Report with Customer Names

1. **Open your browser DevTools** (F12)
2. **Go to Therapist Dashboard → Reports**
3. **Select "Total Bookings"**
4. **Click "Generate Report"**
5. **Check TWO places:**

   **A. Browser Console (F12):**
   ```
   Look for customer names in the table
   ```
   
   **B. Server Console (Terminal):**
   ```
   Look for the debug output:
   === THERAPIST REPORT DEBUG ===
   Sample booking: { customer: {...} }
   ```

---

### Test 2: Generate Monthly Revenue Report

1. **Open Terminal/Server Console**
2. **Go to Reports page**
3. **Select "Monthly Revenue"**
4. **Click "Generate Report"**
5. **Check Server Console for:**

   ```
   Processing booking ...: {
     month: "2026-03",
     finalPrice: ???,
     bookingPrice: ???,
     revenue: ???
   }
   Monthly Revenue: Processed X bookings, Skipped Y bookings
   Monthly revenue data: { ... }
   ```

---

## Expected vs Actual Results

### Scenario A: Everything Working ✅

**Console Output:**
```
=== THERAPIST REPORT DEBUG ===
Total bookings found: 10
Sample booking: {
  customer: { firstName: "John", lastName: "Doe" },
  finalPrice: 100,
  service: "Swedish Massage"
}

Processing booking ...: {
  month: "2026-03",
  finalPrice: 100,
  bookingPrice: 100,
  revenue: 70
}
Monthly Revenue: Processed 5 bookings
Monthly revenue data: { '2026-03': 350 }
```

**Frontend Display:**
- ✅ Customer names: "John Doe"
- ✅ Monthly Revenue: Shows amounts
- ✅ All tables populated correctly

**Conclusion:** System working perfectly!

---

### Scenario B: Customer Names Still N/A ❌

**Console Output:**
```
=== THERAPIST REPORT DEBUG ===
Total bookings found: 10
Sample booking: {
  customer: null,  // ← PROBLEM!
  finalPrice: 100,
  service: "Swedish Massage"
}
```

**OR**

```
Sample booking: {
  customer: {},  // ← Empty object!
  finalPrice: 100
}
```

**Frontend Display:**
- ❌ Customer names: "N/A"
- ✅ Other data works fine

**Diagnosis:** Customer population failing

**Next Steps:**
1. Check if User model has correct schema
2. Verify customer references in Booking model
3. Check database for actual customer data

---

### Scenario C: Monthly Revenue Still Zero ❌

**Console Output Option 1 - No Price Data:**
```
Processing booking ...: {
  month: "2026-03",
  finalPrice: undefined,
  originalPrice: undefined,
  bookingPrice: 0,  // ← PROBLEM!
  revenue: 0
}
Monthly Revenue: Processed 5 bookings
Monthly revenue data: { '2026-03': 0 }
```

**Diagnosis:** Bookings don't have price information

**Solution:** Need to update old bookings or fix booking creation logic

---

**Console Output Option 2 - All Skipped:**
```
Warning: Invalid createdAt date for booking: ...
Warning: Invalid createdAt date for booking: ...
Monthly Revenue: Processed 0 bookings, Skipped 5 bookings
Monthly revenue data: {}
```

**Diagnosis:** All bookings have invalid dates

**Solution:** Fix createdAt dates in database

---

**Console Output Option 3 - No Completed Bookings:**
```
Monthly Revenue: Processed 0 bookings, Skipped 0 bookings
Monthly revenue data: {}
```

**Diagnosis:** No completed bookings exist in database

**Solution:** Create some test bookings with status "completed"

---

## Database Investigation Queries

### Check Customer Population

Run these in MongoDB Compass or shell:

```javascript
// Check if bookings have customer references
db.bookings.findOne({ therapist: ObjectId("YOUR_THERAPIST_ID") })

// Should show something like:
{
  _id: ObjectId("..."),
  customer: ObjectId("697b38cf5f78da5ab3671ae1"),  // ← Should exist
  therapist: ObjectId("..."),
  service: ObjectId("..."),
  status: "completed",
  finalPrice: 100
}
```

**If `customer` field is missing or null:**
```javascript
// Find bookings without customers
db.bookings.find({ 
  therapist: ObjectId("YOUR_THERAPIST_ID"),
  customer: { $exists: false } 
}).toArray();
```

---

### Check Price Fields

```javascript
// Check what price fields exist
db.bookings.find({ 
  therapist: ObjectId("YOUR_THERAPIST_ID") 
}).project({ 
  finalPrice: 1, 
  originalPrice: 1,
  service: 1 
}).limit(5);
```

**Expected Results:**
```javascript
[
  {
    _id: ...,
    finalPrice: 100,      // ← Should have value
    originalPrice: 120,   // ← Optional
    service: ObjectId(...)
  },
  {
    _id: ...,
    finalPrice: null,     // ← Old bookings might be null
    originalPrice: 100,   // ← Should have at least one
    service: ObjectId(...)
  }
]
```

**If ALL price fields are null:**
```javascript
// Check if service has price
const booking = db.bookings.findOne({ _id: ObjectId("...") });
const service = db.services.findOne({ _id: booking.service });
printjson(service.price);  // Should have value
```

---

### Check Completed Bookings

```javascript
// Count completed bookings
db.bookings.countDocuments({
  therapist: ObjectId("YOUR_THERAPIST_ID"),
  status: "completed"
});
```

**If count is 0:**
```javascript
// Check what statuses exist
db.bookings.aggregate([
  { $match: { therapist: ObjectId("YOUR_THERAPIST_ID") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

---

## Quick Fixes to Try

### Fix 1: Update Old Bookings with Prices

If bookings are missing price data:

```javascript
// Update bookings without finalPrice to use service price
db.bookings.updateMany(
  { 
    finalPrice: { $exists: false },
    service: { $exists: true }
  },
  [{ $set: { 
    finalPrice: "$service.price",
    originalPrice: "$service.price"
  }}]
);
```

**Note:** This requires service to be populated. Might need application-level fix instead.

---

### Fix 2: Add Missing Customer References

If bookings are missing customer references:

```javascript
// Find a default customer or create one
const defaultCustomer = db.users.findOne({ role: "customer" });

// Update bookings without customers
db.bookings.updateMany(
  { 
    customer: { $exists: false }
  },
  { 
    $set: { customer: defaultCustomer._id } 
  }
);
```

---

### Fix 3: Fix Invalid Dates

If createdAt dates are invalid:

```javascript
// Use ObjectId timestamp as fallback
db.bookings.find({ 
  createdAt: { $exists: false } 
}).forEach(booking => {
  const inferredDate = new Date(
    parseInt(booking._id.substring(0, 8), 16) * 1000
  );
  db.bookings.updateOne(
    { _id: booking._id },
    { $set: { createdAt: inferredDate } }
  );
});
```

---

## Remove Debug Logs Later

Once issues are fixed, remove these debug statements:

1. Lines after booking population (sample logging)
2. Monthly revenue processing logs
3. Price calculation logs

**Keep:**
- Error warnings for invalid dates
- Essential error handling

**Remove:**
- Detailed booking data logging
- Processing counts
- Revenue calculations logging

---

## Report Your Findings

After testing, please share:

1. **Console Debug Output:**
   ```
   Copy the entire === THERAPIST REPORT DEBUG === section
   ```

2. **Monthly Revenue Logs:**
   ```
   Copy the "Processing booking..." and "Monthly revenue data" lines
   ```

3. **Frontend Display:**
   - Screenshot of the report showing the issues
   - Which specific reports show N/A or ₹0.00

4. **Database State:**
   - Do you have completed bookings? (yes/no)
   - Do bookings have finalPrice? (yes/no)
   - Do bookings have customer references? (yes/no)

This information will help diagnose the exact issue!

---

**Debug Mode Active:** March 19, 2026  
**Status:** 🔍 Investigating customer names and monthly revenue issues
