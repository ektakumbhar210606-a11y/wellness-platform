# Customer Report Tab - Debugging & Testing Guide

## ✅ Fixes Applied

The following improvements have been made to ensure proper data fetching and display:

### 1. Enhanced Frontend Logging (`CustomerReportPage.tsx`)
- Added console logs when generating report
- Added console logs when receiving data from API
- Added console logs when rendering report content
- Better error logging for debugging

### 2. Enhanced Backend Logging (`route.ts`)
- Added logging for selected fields
- Added logging for each data section added
- Added sample booking data logging
- Added final report data summary

### 3. Improved Conditional Rendering
- Changed from simple existence checks to explicit null/undefined checks
- Added Array.isArray() checks for array data
- Added Object.keys().length check for empty report data
- More robust validation before rendering

---

## 🧪 How to Test the Implementation

### Step 1: Open Browser Console
1. Navigate to `/dashboard/customer/reports`
2. Open browser DevTools (F12 or Ctrl+Shift+I)
3. Go to Console tab

### Step 2: Select Checkboxes
Select one or more report fields, for example:
- [x] 📋 Total Bookings
- [x] 📚 All Bookings History
- [x] 📊 Monthly Booking Trend

### Step 3: Click "Generate Report"
Watch the console for these logs:

#### Frontend Logs (CustomerReportPage.tsx):
```
Generating report with selected fields: ['totalBookings', 'bookings', 'monthlyBookings']
Report data received: {totalBookings: 15, bookings: Array(15), monthlyBookings: Array(3)}
Rendering report with data: {...}
```

#### Backend Logs (route.ts - visible in server console):
```
Selected fields: ['totalBookings', 'bookings', 'monthlyBookings']
Total bookings found: 15
Added totalBookings: 15
Sample booking 0: {_id: '...', serviceName: 'Swedish Massage', ...}
Sample booking 1: {...}
Sample booking 2: {...}
Added bookings array with length: 15
Added monthlyBookings array with length: 3
Final report data keys: ['totalBookings', 'bookings', 'monthlyBookings']
Report generation complete. Success: true
```

### Step 4: Verify Display
After clicking "Generate Report", you should see:

#### ✅ Overview Statistics Section:
- 1 card showing "Total Bookings: 15"

#### ✅ Complete Booking History Section:
- Table with all 15 bookings
- Columns: Service, Therapist, Date & Time, Status, Price, Discount
- Summary row at bottom showing totals

#### ✅ Monthly Booking Trend Section:
- Table with 3 months of data
- Columns: Month, Bookings, Total Spent
- Summary row at bottom

---

## 🔍 Expected Console Output

### Successful Report Generation:
```javascript
// Frontend
Generating report with selected fields: (3) ['totalBookings', 'bookings', 'monthlyBookings']

// Backend (Server Console)
Selected fields: (3) ['totalBookings', 'bookings', 'monthlyBookings']
Total bookings found: 15
Added totalBookings: 15
Sample booking 0: {
  _id: "67d4f8a9b3c2d1e0f5a6b7c8",
  serviceName: "Swedish Massage",
  therapistName: "John Doe",
  date: "2026-01-15T10:00:00.000Z",
  time: "10:00 AM",
  status: "completed",
  finalPrice: 300,
  discountApplied: true
}
Sample booking 1: {...}
Sample booking 2: {...}
Added bookings array with length: 15
Added monthlyBookings array with length: 3
Final report data keys: (3) ['totalBookings', 'bookings', 'monthlyBookings']
Report generation complete. Success: true

// Frontend
Report data received: {
  totalBookings: 15,
  completedBookings: 12,
  cancelledBookings: 3,
  bookings: Array(15),
  monthlyBookings: Array(3)
}
Rendering report with data: {...}
```

---

## ⚠️ Troubleshooting Scenarios

### Scenario 1: No Data Displays

**Symptoms:**
- Click "Generate Report" but nothing appears

**Check Console For:**
```javascript
// If you see this:
Report data received: {}

// Problem: API returned empty object
```

**Solution:**
1. Check if customer has bookings in database
2. Verify JWT token is valid
3. Check server console for backend errors

---

### Scenario 2: Only Statistics Show, No Tables

**Symptoms:**
- Statistics cards appear but tables don't

**Check Console For:**
```javascript
Report data received: {
  totalBookings: 15,
  // ... other stats but NO bookings array
}

// Problem: 'bookings' field not selected or not returned
```

**Solution:**
1. Make sure "All Bookings History" checkbox is selected
2. Check backend logs to see if bookings array was created
3. Verify `Array.isArray(reportData.bookings)` returns true

---

### Scenario 3: Tables Show But No Data

**Symptoms:**
- Table headers appear but no rows

**Check Console For:**
```javascript
Report data received: {
  bookings: []  // Empty array
}

// Problem: Customer has no bookings in database
```

**Solution:**
1. This is correct behavior - customer simply has no bookings
2. Message "No recent bookings found" should display

---

### Scenario 4: Error Messages

**If you see:**
```javascript
API Error: Invalid customer ID

// Problem: JWT token contains invalid user ID
```

**Solution:**
1. Logout and login again
2. Check if user has 'customer' role

**If you see:**
```javascript
API Error: Authentication token required

// Problem: No JWT token found
```

**Solution:**
1. Ensure user is logged in
2. Check localStorage for 'token' item

---

## 📊 Test Cases

### Test Case 1: Single Field Selection
**Selection:**
- [x] 📋 Total Bookings

**Expected:**
- 1 statistic card displays
- No tables
- Console shows only totalBookings added

**Console Output:**
```
Added totalBookings: 15
Final report data keys: ['totalBookings']
```

---

### Test Case 2: All Fields Selection
**Selection:**
- [x] All 9 checkboxes

**Expected:**
- 6 statistic cards
- 3 detailed tables (Bookings, Monthly Trend, Service History)
- Console shows all fields added

**Console Output:**
```
Added totalBookings: 15
Added completedBookings: 12
Added cancelledBookings: 3
Added totalSpent: 4500
Added totalDiscountUsed: 450
Added mostBookedService: Swedish Massage
Added bookings array with length: 15
Added monthlyBookings array with length: 3
Added serviceHistory array with length: 5
Final report data keys: (9) [...]
```

---

### Test Case 3: Detailed Data Only
**Selection:**
- [x] 📚 All Bookings History
- [x] 📊 Monthly Booking Trend
- [x] 🏢 Service History

**Expected:**
- NO statistic cards (because stats not selected)
- 3 detailed tables display
- Console shows only arrays added

**Console Output:**
```
Added bookings array with length: 15
Added monthlyBookings array with length: 3
Added serviceHistory array with length: 5
Final report data keys: (3) ['bookings', 'monthlyBookings', 'serviceHistory']
```

---

## 🎯 Success Criteria

✅ **Working Correctly If:**
1. Console logs show data being fetched
2. Selected statistics appear as cards
3. Selected tables appear with data
4. Summary rows show correct totals
5. No JavaScript errors in console

❌ **Not Working If:**
1. Console shows empty arrays/objects
2. Selected fields don't match displayed data
3. Tables show but have no rows
4. JavaScript errors appear
5. API returns error responses

---

## 🔧 Additional Debugging Tools

### Check API Response Directly
Open browser Network tab:
1. Filter by "Fetch/XHR"
2. Find request to `/api/reports/customer/custom`
3. Click on it
4. Go to "Response" tab
5. You should see:
```json
{
  "success": true,
  "message": "Custom customer report generated successfully",
  "data": {
    "totalBookings": 15,
    "bookings": [...],
    "monthlyBookings": [...],
    "serviceHistory": [...]
  }
}
```

### Check Database Connection
In server console, look for:
```
MongoDB Connected Successfully
```

If not present, check:
- `.env.local` file has `MONGODB_URI`
- MongoDB server is running
- Connection string is correct

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

- [ ] Customer can access reports page
- [ ] Checkboxes render with icons
- [ ] Can select multiple checkboxes
- [ ] Generate Report button is enabled
- [ ] Loading spinner appears during generation
- [ ] Console logs appear (frontend)
- [ ] Server logs appear (backend)
- [ ] Statistics cards display (if selected)
- [ ] Booking history table displays (if selected)
- [ ] Monthly trend table displays (if selected)
- [ ] Service history table displays (if selected)
- [ ] Summary rows show correct totals
- [ ] PDF download button enabled after generation
- [ ] Excel download button enabled after generation
- [ ] Can generate multiple reports with different selections
- [ ] Error handling works (try with invalid token)
- [ ] Responsive design works on mobile

---

## 🎉 Expected Behavior Summary

When everything works correctly:

1. **User selects checkboxes** → Frontend tracks selection
2. **User clicks Generate** → API request sent with selected fields
3. **Backend receives request** → Validates token, queries database
4. **Backend calculates data** → Based on selected fields only
5. **Backend returns response** → JSON with report data
6. **Frontend receives data** → Stores in state
7. **Frontend renders** → Shows ONLY selected sections
8. **User sees report** → Statistics, tables, summaries

Each section should only appear if its corresponding checkbox was selected!

---

## 💡 Pro Tips

1. **Always check both frontend AND backend console** - helps identify where issues occur
2. **Test with customers who have booking history** - empty data is confusing
3. **Start with simple tests** - select 1-2 fields first, then add more
4. **Use Network tab** - see exact API request/response
5. **Verify data types** - arrays should be arrays, numbers should be numbers

---

**Status: Ready for Testing ✅**

All debugging enhancements have been applied. The system now provides comprehensive logging to help identify any issues with data fetching or display.
