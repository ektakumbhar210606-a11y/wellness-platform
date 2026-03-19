# Customer Report - Error Handling & Troubleshooting Guide

## ✅ Enhanced Error Handling Implementation

Both frontend and backend now have comprehensive error handling with detailed logging to help diagnose issues.

---

## 🔧 What Was Fixed

### Frontend Error Handling (`CustomerReportPage.tsx`)

**Before:**
```typescript
const errorData = await response.json();
console.error('❌ API Error:', errorData);
message.error(errorData.error || 'Failed to generate report');
```

**After:**
```typescript
// Better error handling for non-OK responses
let errorData;
try {
  errorData = await response.json();
  console.error('❌ API Error:', errorData);
  message.error(errorData.error || `HTTP ${response.status}: Failed to generate report`);
} catch (parseError) {
  // Handle non-JSON responses
  console.error('❌ API Error (non-JSON):', response.status, response.statusText);
  message.error(`HTTP ${response.status}: ${response.statusText || 'Failed to generate report'}`);
}
```

**Benefits:**
- ✅ Handles JSON parse errors gracefully
- ✅ Shows HTTP status codes
- ✅ Provides fallback error messages
- ✅ Better debugging information

---

### Backend Error Handling (`route.ts`)

**Enhanced Logging:**
```typescript
} catch (error: unknown) {
  console.error('❌ Error generating custom customer report:', error);
  console.error('Stack trace:', (error instanceof Error) ? error.stack : 'No stack trace');
  console.error('Error details:', JSON.stringify(error, null, 2));
  
  const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
  console.error('Returning error message:', errorMessage);
  
  return Response.json(
    { 
      success: false, 
      error: errorMessage,
      details: (error instanceof Error) ? error.toString() : 'Unknown error'
    },
    { status: 500 }
  );
}
```

**Benefits:**
- ✅ Detailed stack traces
- ✅ JSON error serialization
- ✅ Clear error messages
- ✅ Multiple log levels for debugging

---

### Request Body Validation

**Added Robust Parsing:**
```typescript
// Parse request body with error handling
let body;
try {
  body = await req.json();
  console.log('📥 Request body received:', body);
} catch (parseError) {
  console.error('❌ Error parsing request body:', parseError);
  return Response.json(
    { success: false, error: 'Invalid JSON in request body' },
    { status: 400 }
  );
}

// Validate selectedFields is an array
if (!Array.isArray(selectedFields)) {
  return Response.json(
    { success: false, error: 'selectedFields must be an array' },
    { status: 400 }
  );
}
```

**Benefits:**
- ✅ Validates JSON parsing
- ✅ Checks array type
- ✅ Prevents runtime errors
- ✅ Clear validation messages

---

## 🐛 Common Errors & Solutions

### Error 1: "Authentication token required" (401)

**Console Output:**
```javascript
❌ API Error: { success: false, error: 'Authentication token required' }
```

**Cause:**
- No token in localStorage
- Token expired
- Not logged in

**Solution:**
1. Check if user is logged in
2. Verify token exists: `localStorage.getItem('token')`
3. Re-login if token is missing/expired

---

### Error 2: "Access denied. Customer role required" (403)

**Console Output:**
```javascript
❌ API Error: { success: false, error: 'Access denied. Customer role required' }
```

**Cause:**
- User has business/admin role instead of customer
- Token decoded role doesn't match 'customer'

**Solution:**
1. Login with a customer account
2. Check user role in database
3. Ensure JWT token has correct role claim

---

### Error 3: "Invalid fields: fieldName" (400)

**Console Output:**
```javascript
❌ API Error: { success: false, error: 'Invalid fields: invalidField' }
```

**Cause:**
- Frontend sending field names not in allowed list
- Typo in field name

**Allowed Fields:**
```typescript
const allowedFields = [
  'totalBookings',
  'completedBookings',
  'cancelledBookings',
  'totalSpent',
  'totalDiscountUsed',
  'mostBookedService',
  'bookings',
  'monthlyBookings',
  'serviceHistory'
];
```

**Solution:**
1. Check frontend is only sending valid field names
2. Compare against allowedFields array
3. Fix any typos

---

### Error 4: "Invalid JSON in request body" (400)

**Console Output:**
```javascript
Backend logs:
❌ Error parsing request body: SyntaxError: Unexpected token X in JSON...
❌ API Error: { success: false, error: 'Invalid JSON in request body' }
```

**Cause:**
- Malformed JSON in request
- Content-Type header not set to 'application/json'
- Empty request body

**Solution:**
1. Verify fetch call has correct headers:
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
   }
   ```
2. Ensure body is properly stringified:
   ```typescript
   body: JSON.stringify({ selectedFields })
   ```

---

### Error 5: "selectedFields must be an array" (400)

**Console Output:**
```javascript
❌ API Error: { success: false, error: 'selectedFields must be an array' }
```

**Cause:**
- selectedFields is object, string, or undefined instead of array

**Solution:**
1. Frontend must send: `{ selectedFields: ['field1', 'field2'] }`
2. NOT: `{ selectedFields: 'field1' }` or `{ field1: true }`
3. Always initialize as empty array if nothing selected: `{ selectedFields: [] }`

---

### Error 6: MongoDB Connection Issues

**Console Output:**
```javascript
Backend logs:
❌ Error generating custom customer report: MongooseError: connection error
```

**Cause:**
- MongoDB not running
- Connection string incorrect
- Network connectivity issue

**Solution:**
1. Check MongoDB is running
2. Verify `.env.local` has correct connection string
3. Restart development server

---

### Error 7: "User not found" (404)

**Console Output:**
```javascript
❌ API Error: { success: false, error: 'User not found' }
```

**Cause:**
- Token valid but user deleted from database
- User ID in token doesn't exist

**Solution:**
1. Re-login to get fresh token
2. Check user exists in database
3. Clear localStorage and login again

---

## 🧪 Testing & Debugging

### Step 1: Check Browser Console

Open DevTools (F12) and look for:
```javascript
🚀 Generating COMPREHENSIVE report with fields: [...]
Originally selected: [...]
Auto-added fields: [...]
```

If you don't see these logs, the request isn't being sent.

### Step 2: Check Network Tab

In DevTools → Network tab:
1. Click "Generate Report"
2. Find request to `/api/reports/customer/custom`
3. Check:
   - **Status**: Should be 200 OK
   - **Request Headers**: Has Authorization header
   - **Request Payload**: Has selectedFields array
   - **Response**: Should have success: true and data object

### Step 3: Check Server Console

Look for backend logs:
```javascript
📥 Request body received: { selectedFields: [...] }
Selected fields from client: [...]
🔍 Processing fields with smart auto-inclusion...
✅ Added totalBookings: 15
➕ Auto-added completedBookings: 12
Final report data keys: [...]
Report generation complete. Success: true
```

### Step 4: Verify Database Data

Check MongoDB has booking data:
```javascript
// In MongoDB Compass or shell
db.bookings.find({ customer: ObjectId("YOUR_CUSTOMER_ID") })
```

Should return booking documents.

---

## 📋 Debugging Checklist

When encountering errors, check these in order:

**Frontend Checks:**
- [ ] User is logged in as customer
- [ ] Token exists in localStorage
- [ ] Token is valid (not expired)
- [ ] selectedFields is an array
- [ ] Field names are valid
- [ ] Fetch headers are correct
- [ ] Console shows request being sent

**Backend Checks:**
- [ ] Server is running
- [ ] MongoDB is connected
- [ ] Request body is parsed successfully
- [ ] Authentication passes
- [ ] Customer has bookings in database
- [ ] No exceptions thrown during processing

**Response Checks:**
- [ ] HTTP status is 200
- [ ] Response has `success: true`
- [ ] Response has `data` object
- [ ] Data object has expected keys

---

## 🎯 Example Successful Flow

**Frontend Console:**
```javascript
🚀 Generating COMPREHENSIVE report with fields: [
  'totalBookings',
  'bookings',
  'completedBookings',
  'cancelledBookings'
]
Originally selected: ['totalBookings']
Auto-added fields: ['bookings', 'completedBookings', 'cancelledBookings']

📋 Auto-adding: All Bookings History (detailed table)
✅ Auto-adding: Completed Bookings (breakdown)
❌ Auto-adding: Cancelled Bookings (breakdown)

✅ Report data received: ['totalBookings', 'completedBookings', 'cancelledBookings', 'bookings']
Rendering report with data: {...}
```

**Backend Console:**
```javascript
📥 Request body received: {
  selectedFields: ['totalBookings', 'bookings', 'completedBookings', 'cancelledBookings']
}
Selected fields from client: ['totalBookings', 'bookings', 'completedBookings', 'cancelledBookings']

🔍 Processing fields with smart auto-inclusion...
📚 Added COMPREHENSIVE bookings array: 15 bookings
✅ Added totalBookings: 15
➕ Auto-added completedBookings: 12
➕ Auto-added cancelledBookings: 3

Final report data keys: ['totalBookings', 'completedBookings', 'cancelledBookings', 'bookings']
Report generation complete. Success: true
```

**Network Tab:**
```
POST /api/reports/customer/custom
Status: 200 OK
Request: {"selectedFields":["totalBookings","bookings","completedBookings","cancelledBookings"]}
Response: {
  "success": true,
  "message": "Custom customer report generated successfully",
  "data": {
    "totalBookings": 15,
    "completedBookings": 12,
    "cancelledBookings": 3,
    "bookings": [...]
  }
}
```

---

## 🛠️ Quick Fixes

### Fix 1: Clear LocalStorage and Re-login
```javascript
// In browser console
localStorage.clear();
// Then login again through the UI
```

### Fix 2: Check Current User Role
```javascript
// In browser console
const token = localStorage.getItem('token');
if (token) {
  const decoded = JSON.parse(atob(token.split('.')[1]));
  console.log('User role:', decoded.role);
  console.log('User ID:', decoded.id);
} else {
  console.log('No token found');
}
```

### Fix 3: Test API Directly
```javascript
// In browser console
fetch('/api/reports/customer/custom', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    selectedFields: ['totalBookings']
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## ✅ Summary

With these enhancements:

✅ **Frontend** handles all error types gracefully
✅ **Backend** provides detailed error information
✅ **Validation** catches issues early
✅ **Logging** helps debug problems
✅ **Error Messages** are clear and actionable
✅ **Fallbacks** prevent crashes

**Now when errors occur, you'll have all the information needed to diagnose and fix them quickly!**
