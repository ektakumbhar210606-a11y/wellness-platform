# ✅ How to Verify the 10% Reward Discount Flow is Working

## Quick Testing Guide

Follow these steps to verify that the reward discount system is working correctly at every stage.

---

## 🧪 Step-by-Step Verification

### **Prerequisites**
1. Customer account with **exactly 100 reward points** (or more)
2. Service available for booking (e.g., ₹1000 service)
3. Application running on `http://localhost:3000`

---

## **Test Scenario: Customer with 100 Points Books ₹1000 Service**

### **Step 1: Check Initial State**

**Action:** Log in as customer with 100 reward points

**Expected Result:**
```
Dashboard shows:
✓ Reward Points: 100 / 100
✓ Message: "Congratulations! Your 10% discount is unlocked"
✓ Progress bar: Green, 100% filled
```

**Where to Check:**
- Customer Dashboard → Analytics/ Rewards tab
- Or navigate to: `/dashboard/customer/analytics`

---

### **Step 2: Select Service and Initiate Booking**

**Action:** 
1. Go to search page or service listing
2. Select a service priced at ₹1000
3. Choose date and time
4. Click "Book Now" or "Confirm Payment"

**Expected Result:**
```
Booking Confirmation Modal opens
✓ Shows service details
✓ Shows therapist information
✓ Shows payment summary section
```

---

### **Step 3: Verify Green Checkbox Appears**

**What to Look For:**

When modal opens, you should see:

```
┌─────────────────────────────────────────────┐
│ Payment Summary                             │
│                                             │
│ Service Price: ₹1000                        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ☑ Apply 10% Reward Discount             │ │
│ │   (100 pts available)                   │ │ ← GREEN BOX
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Visual Indicators:**
- ✅ Green background box (`#f6ffed`)
- ✅ Green border (`#b7eb8f`)
- ✅ Gift icon 🎁 in green color
- ✅ Text shows "100 pts available"
- ✅ Checkbox is **enabled** (can be checked)

**If you DON'T see the checkbox:**
- ❌ Check console for errors
- ❌ Verify customer has ≥100 points
- ❌ Check if `rewardEligibility.discountUnlocked === true`

---

### **Step 4: Check the Checkbox - Price Should Update**

**Action:** Click/tick the "Apply 10% Reward Discount" checkbox

**Expected Immediate Changes:**

#### **Before Checking:**
```
Service Price:     ₹1000
Total:             ₹1000
Advance (50%):     ₹500
Remaining:         ₹500
```

#### **After Checking:**
```
Service Price:     ₹1000
Reward Discount:   -₹100      ← Red text, strikethrough
Final Price:       ₹900       ← Green text, bold
Advance (50%):     ₹450       ← Updated!
Remaining:         ₹450       ← Updated!
```

**Additional Visual Feedback:**
```
┌─────────────────────────────────────────────┐
│ ℹ️ You have 100 reward points.             │
│   10% discount will be applied and          │
│   points will reset to 0 after booking.     │ ← Success alert
└─────────────────────────────────────────────┘
```

**Console Check:**
Open browser DevTools (F12) → Console tab

You should see:
```javascript
// No errors related to reward eligibility
// fetchRewardEligibility should complete successfully
```

---

### **Step 5: Fill Customer Information & Proceed to Pay**

**Action:**
1. Fill in: Full Name, Email, Phone Number
2. Click "Pay Now" button

**Expected Behavior:**
```
✓ Form validates successfully
✓ Razorpay payment popup opens
✓ Amount shown: ₹450 (NOT ₹500)
✓ Currency: INR
```

**Critical Check:**
The Razorpay popup should show:
```
Amount: ₹450.00
(50% of ₹900, NOT 50% of ₹1000)
```

---

### **Step 6: Complete the Payment**

**Action:** Complete Razorpay payment with test credentials

**During Payment Processing:**

**Console Logs to Watch For:**
```javascript
// In Browser Console (F12)
"Mock Mode enabled: Skipping signature verification"
// OR
"Payment successful!"
```

**Backend Logs (Terminal):**
```javascript
// Should show discount processing
"Discount applied: true"
"Customer reward points reset to 0"
"Reward history entry added: DISCOUNT_USED"
```

---

### **Step 7: Verify Payment Success**

**Expected Result:**
```
✓ Success message: "Payment successful! Booking confirmed."
✓ Modal closes automatically
✓ Redirected to dashboard or confirmation page
```

**Booking Confirmation Should Show:**
```
Booking ID: #BOOK123
Service: Deep Tissue Massage
Original Price: ₹1000
Discount Applied: ₹100
Final Price: ₹900
Advance Paid: ₹450
Remaining: ₹450
Status: Confirmed
```

---

### **Step 8: Check Updated Reward Points (CRITICAL!)**

**Action:** Navigate to Customer Dashboard → Analytics/Rewards tab

**Expected Result:**

#### **BEFORE Payment:**
```
Reward Points: 100 / 100
Progress Bar: Green, 100% filled
Message: "🎉 Congratulations! Your 10% discount is unlocked"
```

#### **AFTER Payment:**
```
Reward Points: 0 / 100          ← MUST BE 0!
Progress Bar: Blue, 0% filled
Message: "Keep reviewing to unlock a 10% discount"
Points Remaining: 100 more points needed
```

**This is the MOST IMPORTANT check!** If points are NOT 0:
- ❌ Backend logic failed
- ❌ Check server logs for errors
- ❌ Verify `customerUser.rewardPoints = 0` executed

---

### **Step 9: Verify Reward History Entry (CRITICAL!)**

**Action:** Check reward history in dashboard or via API

**Expected Entry:**
```
┌─────────────────────────────────────────────┐
│ ★ Reward History                            │
│                                             │
│ ✓ 10% reward discount used for booking     │
│   -100 pts                    [Today, 2:30 PM] │
└─────────────────────────────────────────────┘
```

**Entry Details:**
- **Icon:** Checkmark ✓ (different from star ★ for reviews)
- **Type:** `DISCOUNT_USED`
- **Points:** `-100` (negative, shown in red tag)
- **Description:** "10% reward discount used for booking"
- **Date:** Current date and time

**How to Verify via API:**
```javascript
// Open Browser Console
const token = localStorage.getItem('token');
fetch('/api/customer/rewards/' + YOUR_CUSTOMER_ID, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('Reward History:', data.data.rewardHistory);
  // Should show DISCOUNT_USED entry
});
```

**Expected Console Output:**
```javascript
Reward History: [
  {
    type: "REVIEW_REWARD",
    points: 100,
    description: "Initial points"
  },
  {
    type: "DISCOUNT_USED",      ← MUST BE PRESENT
    points: -100,               ← Negative value
    description: "10% reward discount used for booking",
    date: "2024-01-15T14:30:00.000Z"
  }
]
```

---

### **Step 10: Verify Booking Details in Database**

**For Developers:** Check MongoDB directly

**Query:**
```javascript
// In MongoDB Compass or Shell
db.bookings.findOne({ 
  _id: ObjectId("YOUR_BOOKING_ID") 
})
```

**Expected Document:**
```javascript
{
  _id: ObjectId("..."),
  customer: ObjectId("..."),
  service: ObjectId("..."),
  status: "confirmed",
  paymentStatus: "partial",
  
  // REWARD DISCOUNT FIELDS (MUST BE PRESENT)
  originalPrice: 1000,              // ← Original service price
  rewardDiscountApplied: true,      // ← Boolean flag
  rewardDiscountAmount: 100,        // ← 10% of 1000
  finalPrice: 900,                  // ← After discount
  
  // Payment details
  advancePaid: 450,                 // ← 50% of 900
  remainingAmount: 450,             // ← 50% of 900
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**If these fields are missing or incorrect:**
- ❌ Check backend API logs
- ❌ Verify `applyRewardDiscount` flag was sent
- ❌ Check payment verification route

---

## 🔍 Debugging Checklist

### ✅ **Checkbox Not Showing?**

**Check:**
1. Customer has ≥100 points?
2. Console errors when modal opens?
3. `rewardEligibility` state populated?
4. API call to `/api/customer/reward-eligibility` successful?

**Debug:**
```javascript
// In browser console
console.log('Reward Eligibility:', rewardEligibility);
// Should show: { rewardPoints: 100, discountUnlocked: true }
```

---

### ✅ **Price Not Updating?**

**Check:**
1. Checkbox `onChange` handler firing?
2. `applyRewardDiscount` state updating?
3. Calculation: `booking.service.price * 0.90` correct?

**Debug:**
```javascript
// Check state
console.log('Apply Discount:', applyRewardDiscount);
console.log('Service Price:', booking.service.price);
console.log('Final Price:', booking.service.price * 0.90);
```

---

### ✅ **Wrong Amount Charged?**

**Expected:** ₹450 (50% of ₹900)  
**If showing ₹500 instead:**

**Check:**
1. `applyRewardDiscount` flag passed to payment API?
2. Backend received the flag?
3. Discount calculation in `verify/route.ts` executing?

**Debug:**
```javascript
// In backend terminal (add console.log)
console.log('Apply Reward Discount:', applyRewardDiscount);
console.log('Final Amount:', finalAmount);
console.log('Advance Amount:', amount);
```

---

### ✅ **Points Not Resetting to 0?**

**This is CRITICAL!** If points remain at 100:

**Check Backend Logs:**
```bash
# Should see these logs:
"Discount applied: true"
"Customer reward points reset to 0"
"Reward history entry added: DISCOUNT_USED"
```

**Verify Code Execution:**
In `app/api/payments/razorpay/verify/route.ts`:
```javascript
// Lines 156-170 should execute:
if (applyRewardDiscount === true) {
  const customerUser = await UserModel.findById(booking.customer);
  if (customerUser && customerUser.rewardPoints >= 100) {
    customerUser.rewardPoints = 0;  // ← THIS LINE
    customerUser.rewardHistory.push({
      type: 'DISCOUNT_USED',
      points: -100,
      description: '10% reward discount used for booking',
      date: new Date()
    });
    await customerUser.save();  // ← THIS LINE
  }
}
```

**Common Issues:**
- `applyRewardDiscount` not received in request body
- Customer query fails
- `save()` operation fails silently
- Race condition (check happens before save completes)

---

### ✅ **No Reward History Entry?**

**Check:**
1. `rewardHistory.push()` called?
2. Array initialized in User document?
3. `save()` operation successful?

**Debug:**
```javascript
// In MongoDB
db.users.findOne({ _id: ObjectId("CUSTOMER_ID") })

// Check rewardHistory array
{
  rewardHistory: [
    {
      type: "DISCOUNT_USED",
      points: -100,
      description: "10% reward discount used for booking",
      date: ISODate("2024-01-15T14:30:00.000Z")
    }
  ]
}
```

---

## 📊 Success Criteria Checklist

Use this checklist to confirm everything is working:

### **Frontend Checks**
- [ ] Green checkbox appears when customer has ≥100 points
- [ ] Checkbox shows correct points count "(100 pts available)"
- [ ] Price updates instantly when checkbox checked
- [ ] Original price: ₹1000 → Final price: ₹900
- [ ] Advance payment: ₹500 → ₹450
- [ ] Success alert appears explaining point reset
- [ ] Razorpay charges exactly ₹450

### **Backend Checks**
- [ ] `applyRewardDiscount` flag received in payment API
- [ ] Customer eligibility validated (≥100 points)
- [ ] 10% discount calculated correctly (₹100)
- [ ] Final price updated to ₹900
- [ ] Customer reward points set to 0
- [ ] `DISCOUNT_USED` entry added to reward history
- [ ] Booking saved with all 4 pricing fields

### **Database Checks**
- [ ] Customer.rewardPoints = 0 (was 100)
- [ ] Customer.rewardHistory contains DISCOUNT_USED entry
- [ ] Booking.originalPrice = 1000
- [ ] Booking.rewardDiscountApplied = true
- [ ] Booking.rewardDiscountAmount = 100
- [ ] Booking.finalPrice = 900

### **Post-Payment Checks**
- [ ] Dashboard shows 0 / 100 points
- [ ] Progress bar shows 0% (blue, not green)
- [ ] Message changed to "Keep reviewing to unlock..."
- [ ] Reward history displays DISCOUNT_USED entry
- [ ] Booking confirmation shows discounted price

---

## 🎯 Quick Test Commands

### **Check Customer Points via API:**
```bash
curl -X GET http://localhost:3000/api/customer/rewards/YOUR_CUSTOMER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "rewardPoints": 0,  // ← SHOULD BE 0 AFTER DISCOUNT
    "maxPoints": 100,
    "discountUnlocked": false,  // ← SHOULD BE FALSE NOW
    "pointsRemaining": 100,
    "rewardHistory": [
      {
        "type": "DISCOUNT_USED",
        "points": -100,
        "description": "10% reward discount used for booking"
      }
    ]
  }
}
```

### **Check Booking via API:**
```bash
curl -X GET http://localhost:3000/api/bookings/YOUR_BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "originalPrice": 1000,
    "rewardDiscountApplied": true,
    "rewardDiscountAmount": 100,
    "finalPrice": 900,
    "advancePaid": 450,
    "remainingAmount": 450
  }
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Points Stay at 100**
**Cause:** Backend logic not executing  
**Solution:** Check `applyRewardDiscount` flag is being sent in payment request

### **Issue 2: Wrong Amount Charged (₹500 instead of ₹450)**
**Cause:** Discount not applied during payment  
**Solution:** Verify `finalAmount` calculation in `handleConfirm` uses discounted price

### **Issue 3: No Reward History Entry**
**Cause:** `save()` operation failing  
**Solution:** Check MongoDB connection, validate rewardHistory schema

### **Issue 4: Booking Missing Discount Fields**
**Cause:** Update query not including discount fields  
**Solution:** Verify `$set` includes all 4 pricing fields in `findByIdAndUpdate`

---

## ✅ Final Verification

**If ALL checks pass, the system is working correctly:**

✅ Customer sees discount checkbox  
✅ Price updates when checkbox checked  
✅ Payment charges discounted amount  
✅ Points reset to 0 after payment  
✅ Reward history shows DISCOUNT_USED  
✅ Booking stores complete pricing breakdown  
✅ Dashboard reflects updated points  

**Congratulations! Your 10% reward discount flow is fully operational! 🎉**

---

**Need Help?** Check these files:
- Frontend: `app/components/BookingConfirmationModal.tsx`
- Backend: `app/api/payments/razorpay/verify/route.ts`
- Test: `test-reward-discount-flow.js`
- Docs: `COMPLETE_REWARD_DISCOUNT_FLOW.md`
