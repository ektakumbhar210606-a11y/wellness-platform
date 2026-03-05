# 🎁 Reward Discount - Visual Flow Chart

## Complete Customer Journey with 10% Discount

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Customer Dashboard                     │
│                                                                  │
│  Reward Points: 100 / 100  ✓                                    │
│  Status: "🎉 Congratulations! Your 10% discount is unlocked"    │
│  Progress Bar: ████████████████████ 100% (GREEN)               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              STEP 1: Select Service (₹1000)                      │
│              Choose Date & Time                                  │
│              Click "Book Now" or "Confirm Payment"              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│           STEP 2: Booking Modal Opens                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ PAYMENT SUMMARY                                        │    │
│  │                                                        │    │
│  │ Service Price: ₹1000                                   │    │
│  │                                                        │    │
│  │ ┌──────────────────────────────────────────────────┐  │    │
│  │ │ ☑ Apply 10% Reward Discount (100 pts available) │  │    │
│  │ │                                                   │  │    │
│  │ │ ℹ️ You have 100 reward points.                   │  │    │
│  │ │   10% discount will be applied and               │  │    │
│  │ │   points will reset to 0 after booking.          │  │    │
│  │ └──────────────────────────────────────────────────┘  │    │
│  │                                                        │    │
│  │ [Customer checks the checkbox]                         │    │
│  │                                                        │    │
│  │ Service Price:        ₹1000                            │    │
│  │ Reward Discount:      -₹100  ← RED TEXT                │    │
│  │ Final Price:          ₹900   ← GREEN TEXT              │    │
│  │ Advance (50%):        ₹450   ← UPDATED!                │    │
│  │ Remaining at Venue:   ₹450   ← UPDATED!                │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 3: Fill Form & Click "Pay Now"                     │
│                                                                  │
│  Full Name: John Doe                                            │
│  Email: john@example.com                                        │
│  Phone: +91 9876543210                                          │
│                                                                  │
│  [PAY NOW] → Triggers Razorpay                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 4: Razorpay Popup Opens                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Pay ₹450.00 to Wellness Platform                  │        │
│  │                                                     │        │
│  │  (50% of ₹900 - with 10% reward discount)         │        │
│  │                                                     │        │
│  │  [Credit/Debit Card] [Net Banking] [UPI] [Wallet] │        │
│  │                                                     │        │
│  │  Customer completes payment...                     │        │
│  └────────────────────────────────────────────────────┘        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 5: Payment Successful! ✅                          │
│                                                                  │
│  Message: "Payment successful! Booking confirmed."              │
│                                                                  │
│  Booking Details:                                               │
│  ✓ Service: Deep Tissue Massage                                 │
│  ✓ Original Price: ₹1000                                        │
│  ✓ Discount Applied: ₹100                                       │
│  ✓ Final Price: ₹900                                            │
│  ✓ Advance Paid: ₹450                                           │
│  ✓ Remaining: ₹450                                              │
│                                                                  │
│  Backend Processing (Happening Simultaneously):                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Validate applyRewardDiscount = true                 │    │
│  │ 2. Check customer.rewardPoints >= 100 ✓                │    │
│  │ 3. Calculate discount: 1000 × 0.10 = ₹100              │    │
│  │ 4. Set final price: 1000 - 100 = ₹900                  │    │
│  │ 5. Reset reward points: 100 → 0                        │    │
│  │ 6. Add to reward history:                              │    │
│  │    { type: 'DISCOUNT_USED',                            │    │
│  │      points: -100,                                     │    │
│  │      description: '10% reward discount used' }         │    │
│  │ 7. Save booking with pricing:                          │    │
│  │    originalPrice: 1000                                 │    │
│  │    rewardDiscountApplied: true                         │    │
│  │    rewardDiscountAmount: 100                           │    │
│  │    finalPrice: 900                                     │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 6: Customer Dashboard Updates                      │
│                                                                  │
│  BEFORE (100 points):                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Reward Points: 100 / 100                               │    │
│  │ ██████████████████████████████ 100% (GREEN)            │    │
│  │ 🎉 Congratulations! Your 10% discount is unlocked      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  AFTER (0 points):                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Reward Points: 0 / 100     ← CHANGED!                  │    │
│  │ █░░░░░░░░░░░░░░░░░░░░░░░░░   0% (BLUE)                │    │
│  │ 🏆 Keep reviewing to unlock a 10% discount             │    │
│  │                                                        │    │
│  │ Reward History:                                        │    │
│  │ ★ 10% reward discount used for booking                 │    │
│  │   -100 pts                        [Today, 2:30 PM]     │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    END: Ready to Earn Again                     │
│                                                                  │
│  Customer can now:                                              │
│  ✓ Submit reviews to earn 5 points each                        │
│  ✓ Work towards next 10% discount                              │
│  ✓ View complete booking history with discount details         │
│                                                                  │
│  Database State:                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Customer: {                                            │    │
│  │   rewardPoints: 0,                                     │    │
│  │   rewardHistory: [{                                    │    │
│  │     type: 'DISCOUNT_USED',                             │    │
│  │     points: -100,                                      │    │
│  │     description: '10% reward discount used'            │    │
│  │   }]                                                   │    │
│  │ }                                                      │    │
│  │                                                        │    │
│  │ Booking: {                                             │    │
│  │   originalPrice: 1000,                                 │    │
│  │   rewardDiscountApplied: true,                         │    │
│  │   rewardDiscountAmount: 100,                           │    │
│  │   finalPrice: 900,                                     │    │
│  │   advancePaid: 450,                                    │    │
│  │   remainingAmount: 450                                 │    │
│  │ }                                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│   Customer   │
│  (100 pts)   │
└──────┬───────┘
       │ 1. Books service (₹1000)
       ▼
┌─────────────────────────────────────────────────────────┐
│  BookingConfirmationModal.tsx                           │
│                                                         │
│  • Fetches reward eligibility                           │
│  • Shows green checkbox                                 │
│  • Calculates: ₹1000 × 0.90 = ₹900                     │
│  • Calculates: ₹900 × 0.50 = ₹450 (advance)            │
│  • Sends: applyRewardDiscount = true                    │
└──────┬──────────────────────────────────────────────────┘
       │ 2. POST /api/payments/razorpay/order
       │    { bookingId, amount: 450, applyRewardDiscount: true }
       ▼
┌─────────────────────────────────────────────────────────┐
│  /api/payments/razorpay/order                           │
│                                                         │
│  • Creates Razorpay order for ₹450 (45000 paise)       │
│  • Returns: { order_id, amount, currency }             │
└──────┬──────────────────────────────────────────────────┘
       │ 3. Customer pays ₹450 via Razorpay
       ▼
┌─────────────────────────────────────────────────────────┐
│  /api/payments/razorpay/verify                          │
│                                                         │
│  CRITICAL LOGIC:                                        │
│  if (applyRewardDiscount === true) {                   │
│    customer = findById(booking.customer)               │
│    if (customer.rewardPoints >= 100) {                 │
│      discount = 1000 × 0.10 = ₹100                     │
│      finalPrice = 1000 - 100 = ₹900                    │
│      customer.rewardPoints = 0                         │
│      customer.rewardHistory.push({                     │
│        type: 'DISCOUNT_USED',                          │
│        points: -100,                                   │
│        description: '10% reward discount used'         │
│      })                                                │
│      await customer.save()                             │
│    }                                                   │
│  }                                                     │
│                                                         │
│  Update Booking:                                        │
│  $set: {                                                │
│    originalPrice: 1000,                                │
│    rewardDiscountApplied: true,                        │
│    rewardDiscountAmount: 100,                          │
│    finalPrice: 900,                                    │
│    status: 'confirmed',                                │
│    paymentStatus: 'partial'                            │
│  }                                                     │
└──────┬──────────────────────────────────────────────────┘
       │ 4. Success Response
       │    { success: true, paymentId, bookingId }
       ▼
┌──────────────┐
│   Customer   │
│   (0 pts)    │ ← POINTS RESET!
└──────────────┘
```

---

## ✅ Verification Checklist

### **Visual Checks (Frontend)**
```
[✓] Green checkbox appears with gift icon
[✓] Shows "(100 pts available)"
[✓] Price updates when checked:
    - Before: Total ₹1000, Advance ₹500
    - After:  Final ₹900,  Advance ₹450
[✓] Success alert explains point reset
[✓] Razorpay charges exactly ₹450
```

### **Data Checks (Backend)**
```
[✓] applyRewardDiscount flag received
[✓] Customer validated (≥100 points)
[✓] Discount calculated: 1000 × 0.10 = 100
[✓] Final price: 1000 - 100 = 900
[✓] Points reset: 100 → 0
[✓] History entry added: DISCOUNT_USED (-100 pts)
```

### **Database Checks (MongoDB)**
```javascript
// Customer Document
{
  rewardPoints: 0,  // ← MUST BE 0
  rewardHistory: [
    {
      type: "DISCOUNT_USED",
      points: -100,
      description: "10% reward discount used for booking"
    }
  ]
}

// Booking Document
{
  originalPrice: 1000,
  rewardDiscountApplied: true,
  rewardDiscountAmount: 100,
  finalPrice: 900,
  advancePaid: 450,
  remainingAmount: 450
}
```

---

## 🎯 Key Moments to Verify

### **Moment 1: Checkbox Appears**
- Customer has ≥100 points ✓
- Green box with gift icon visible ✓
- Text shows "100 pts available" ✓

### **Moment 2: Price Updates**
- Customer checks checkbox ✓
- Price changes: ₹1000 → ₹900 ✓
- Advance updates: ₹500 → ₹450 ✓
- Alert message appears ✓

### **Moment 3: Payment Processes**
- Razorpay popup opens ✓
- Amount shown: ₹450 (NOT ₹500) ✓
- Customer completes payment ✓

### **Moment 4: Points Reset**
- Backend validates eligibility ✓
- Points set to 0 ✓
- History updated with DISCOUNT_USED ✓
- Booking saved with discount fields ✓

### **Moment 5: Dashboard Reflects Changes**
- Customer sees 0 / 100 points ✓
- Progress bar shows 0% ✓
- Message changed to "Keep reviewing..." ✓
- Reward history shows DISCOUNT_USED entry ✓

---

## 🚨 Troubleshooting Quick Reference

| Problem | Check This | Solution |
|---------|-----------|----------|
| No checkbox | `rewardEligibility.discountUnlocked` | Verify customer has ≥100 points |
| Price doesn't update | `applyRewardDiscount` state | Check checkbox onChange handler |
| Wrong amount charged | Payment API request body | Ensure `applyRewardDiscount: true` sent |
| Points stay at 100 | Backend logs | Check if discount logic executes |
| No history entry | MongoDB save operation | Verify rewardHistory array exists |
| Booking missing fields | Update query in verify route | Check $set includes all 4 fields |

---

**If ALL moments verified successfully → System Working Perfectly! 🎉**
