# Customer Payment History - Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "Failed to fetch payment history" Error

#### Symptoms
- Console shows: `Failed to fetch payment history`
- Page displays error message
- No data appears in the table

#### Possible Causes & Solutions

**Cause 1: Not Logged In**
- **Solution**: Ensure you're logged in as a customer
- **Check**: Open browser console and run:
  ```javascript
  localStorage.getItem('token')
  ```
- If returns `null`, you need to log in first

**Cause 2: Invalid/Expired Token**
- **Solution**: Log out and log back in to get a fresh token
- **Check**: Token should be a valid JWT string

**Cause 3: Wrong User Role**
- **Solution**: The API requires a **customer** role account
- **Check**: Your user account must have `role: 'customer'` (or `'Customer'`)

**Cause 4: No Bookings/Payments Exist**
- **Solution**: This is normal! Create some bookings first
- **Expected Behavior**: Empty state will show "No payment records found"

---

### Issue 2: Authentication Errors

#### Check Browser Console
Open DevTools (F12) and look for logs:
```
Fetching payments with token: present
Query params: page=1&limit=20
Response status: 401
```

#### Interpret Response Codes
- **401 Unauthorized**: Token missing or invalid → Log in again
- **403 Forbidden**: Wrong role → Use customer account
- **404 Not Found**: User doesn't exist → Contact admin
- **500 Internal Server Error**: Server issue → Check server logs

---

### Issue 3: Database Connection Issues

#### Server Logs Show
```
Error fetching customer payments: MongoServerError
```

#### Solutions
1. Check MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Or check connection string in .env.local
   ```

2. Verify `.env.local` has correct MongoDB URI:
   ```
   MONGODB_URI=mongodb://localhost:27017/wellness-platform
   ```

---

## Step-by-Step Testing

### Test 1: Verify Authentication

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Log in as a customer**:
   - Go to login page
   - Use customer credentials
   - Check browser console for successful login

3. **Check token exists**:
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   console.log('Token:', token);
   // Should show a long string, not null
   ```

4. **Navigate to payments page**:
   - Click "Payments" in sidebar
   - Or go to: http://localhost:3000/dashboard/customer/payments

---

### Test 2: Manual API Test

Use browser DevTools Network tab:

1. **Open Network Tab** (F12 → Network)
2. **Refresh payments page**
3. **Find request**: `payments?page=1&limit=20`
4. **Check Request Headers**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. **Check Response**:
   - Status should be `200 OK`
   - Body should contain payment data

Or use curl in terminal:
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -X GET "http://localhost:3000/api/customer/payments?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Test 3: Database Check

Run the test script:
```bash
node test-customer-payments-api.js
```

This will:
- ✅ Connect to MongoDB
- ✅ Find customer users
- ✅ Check for bookings
- ✅ Check for payment records
- ✅ Display all found data

---

## Expected Data Flow

```
User Login → Get JWT Token
     ↓
Navigate to Payments Page
     ↓
Frontend calls /api/customer/payments
     ↓
API authenticates with JWT
     ↓
API finds customer's bookings
     ↓
API finds payments for those bookings
     ↓
API returns payment data
     ↓
Frontend displays in table
```

---

## Sample Successful Response

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "67a8f3c2e1234567890abcde",
        "paymentDate": "2026-03-05T10:30:00.000Z",
        "amount": 500,
        "totalAmount": 1000,
        "advancePaid": 500,
        "remainingAmount": 500,
        "paymentType": "ADVANCE",
        "method": "credit_card",
        "status": "completed",
        "booking": {
          "id": "67a8f3c2e1234567890abcdf",
          "service": {
            "name": "Swedish Massage",
            "price": 1000,
            "duration": 60
          },
          "therapist": {
            "fullName": "Jane Smith",
            "professionalTitle": "Licensed Therapist"
          },
          "business": {
            "name": "Wellness Center",
            "currency": "INR"
          },
          "date": "2026-03-10",
          "time": "14:00",
          "status": "confirmed",
          "finalPrice": 900,
          "originalPrice": 1000,
          "rewardDiscountApplied": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## Quick Fixes

### Fix 1: Clear Cache and Re-login
```javascript
// In browser console
localStorage.clear();
// Then reload page and log in again
```

### Fix 2: Check Server is Running
```bash
# Terminal should show:
✓ Ready in 2.5s
○ Compiling ...
✓ Compiled in 0.5s
```

### Fix 3: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Console Debug Commands

Paste these in browser console to debug:

```javascript
// 1. Check authentication
console.log('Token:', localStorage.getItem('token'));

// 2. Test API manually
fetch('/api/customer/payments?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));

// 3. Check user info
const token = localStorage.getItem('token');
if (token) {
  const decoded = JSON.parse(atob(token.split('.')[1]));
  console.log('User:', decoded);
}
```

---

## Still Having Issues?

### Enable Verbose Logging

**Frontend** (`payments/page.tsx`):
Already enabled! Watch for:
- `Fetching payments with token: present`
- `Query params: page=1&limit=20`
- `Response status: 200`
- `Payment data received: {...}`

**Backend** (`api/customer/payments/route.ts`):
Already enabled! Watch for:
- `=== Customer Payments API ===`
- `Auth result: { authenticated: true, ... }`
- `Authenticated user ID: xxx`

### Check All Console Logs

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for errors in red
4. Share the full error message for help

---

## Success Indicators

✅ **Working Correctly When:**
- No red errors in console
- Table shows payment data (or empty state if no payments)
- Summary cards show counts
- Can click "Details" to see modal
- Pagination works if multiple pages

❌ **Not Working When:**
- Red errors about authentication
- HTTP 401/403 responses
- Blank page or infinite loading
- No network requests in Network tab

---

## Next Steps After Fixing

Once working:
1. ✅ Test with different customer accounts
2. ✅ Test pagination with many payments
3. ✅ Test filtering by status
4. ✅ Test details modal
5. ✅ Test on mobile devices
6. ✅ Test with various payment types (FULL/ADVANCE)

---

**Last Updated**: March 5, 2026  
**Version**: 1.0.1 (with debug logging)
