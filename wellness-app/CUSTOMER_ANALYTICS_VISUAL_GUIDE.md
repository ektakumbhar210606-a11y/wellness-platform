# 📊 Customer Analytics Dashboard - Visual Guide

## Quick Start

### 1. Install Dependencies
```bash
cd wellness-app
npm install recharts
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Analytics
- Login as a customer
- Navigate to **Dashboard → Analytics** tab
- URL: `http://localhost:3000/dashboard/customer/analytics`

---

## 🎨 Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  📊 Your Wellness Analytics                         │
│  Visual insights into your wellness journey         │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 📅 Total     │ ✅ Completed │ 💰 Total     │
│   Bookings   │   Sessions   │   Spent      │
│     15       │      12      │   $1,250.00  │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────┐
│ 🏆 Services Usage Distribution                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │    ████████  Swedish Massage (8)                │ │
│ │    █████████ Deep Tissue (5)                    │ │
│ │    ████ Facial Treatment (2)                    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 👥 Therapist Sessions Distribution                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │         ╭─────╮                                 │ │
│ │      ╭──╯ 40% ╰──╮  Dr. Jane Smith             │ │
│ │     │    ╰─────╯  │                             │ │
│ │  35% │            │ 25%                         │ │
│ │ John Doe        Sarah Johnson                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📈 Monthly Booking Trend                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │     ●                                           │ │
│ │    ╱ ╲                                          │ │
│ │   ╱   ╰●                                        │ │
│ │  ╱       ╲                                      │ │
│ │ ●         ╰●                                    │ │
│ │ Jan  Feb  Mar  Apr  May                         │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 💰 Monthly Spending Pattern                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │  ████████  $500                                 │ │
│ │  ██████████████  $850                           │ │
│ │  ██████████  $650                               │ │
│ │  ████████████████  $1,200                       │ │
│ │  Jan    Feb    Mar    Apr                       │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Chart Specifications

### 1. Bar Chart - Services Usage
**Data Source:** `serviceBreakdown` array  
**Visualization:** Vertical bars with different colors  
**Interactivity:** Hover for details, click legend to filter

**Example Data:**
```json
[
  { "service": "Swedish Massage", "count": 8 },
  { "service": "Deep Tissue Massage", "count": 5 },
  { "service": "Facial Treatment", "count": 2 }
]
```

---

### 2. Pie Chart - Therapist Distribution
**Data Source:** `therapistBreakdown` array  
**Visualization:** Circular pie with percentage labels  
**Interactivity:** Hover for therapist name and percentage

**Example Data:**
```json
[
  { "therapistName": "Dr. Jane Smith", "count": 10 },
  { "therapistName": "John Doe", "count": 3 },
  { "therapistName": "Sarah Johnson", "count": 2 }
]
```

**Display Format:**
- Dr. Jane Smith: 67%
- John Doe: 20%
- Sarah Johnson: 13%

---

### 3. Line Chart - Monthly Booking Trend
**Data Source:** `monthlyBookings` array  
**Visualization:** Smooth line with dot markers  
**Interactivity:** Hover for exact count, follow trend line

**Example Data:**
```json
[
  { "month": "2026-01", "count": 3 },
  { "month": "2026-02", "count": 5 },
  { "month": "2026-03", "count": 7 },
  { "month": "2026-04", "count": 4 }
]
```

---

### 4. Bar Chart - Monthly Spending
**Data Source:** `monthlySpending` array  
**Visualization:** Rounded vertical bars in pink gradient  
**Interactivity:** Hover for exact amount spent

**Example Data:**
```json
[
  { "month": "2026-01", "total": 300.00 },
  { "month": "2026-02", "total": 500.00 },
  { "month": "2026-03", "total": 750.00 },
  { "month": "2026-04", "total": 450.00 }
]
```

---

## 🎨 Color Scheme

### Overview Cards
- **Total Bookings:** Purple gradient (#667eea)
- **Completed Sessions:** Green gradient (#43e97b)
- **Total Spent:** Pink gradient (#fa8bfd)

### Charts
Services are color-coded using this palette:
1. #667eea (Purple)
2. #764ba2 (Deep Purple)
3. #f093fb (Pink)
4. #43e97b (Green)
5. #fa8bfd (Magenta)
6. #faad14 (Gold)
7. #13c2c2 (Cyan)
8. #eb2f96 (Rose)
9. #52c41a (Lime)
10. #1890ff (Blue)

---

## 🔍 Features Breakdown

### Loading State
```
┌─────────────────────────────┐
│         ⠸⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂⠂          │
│  Loading your analytics...  │
└─────────────────────────────┘
```

### Empty State (No Bookings)
```
┌─────────────────────────────┐
│         📭                  │
│  No booking history yet     │
│  Start booking wellness     │
│  services to see analytics! │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│         ⚠️                  │
│  Failed to load analytics   │
│  Please check connection    │
└─────────────────────────────┘
```

---

## 📱 Responsive Behavior

### Desktop (> 1024px)
- 3 columns for overview cards
- Full-width charts
- Large chart heights (300-400px)

### Tablet (768px - 1024px)
- 2 columns for overview cards
- Full-width charts
- Medium chart heights (250-350px)

### Mobile (< 768px)
- 1 column for overview cards
- Full-width charts
- Compact chart heights (200-300px)
- Smaller fonts and icons

---

## 🧪 Test Scenarios

### Scenario 1: Active Customer
**Profile:** 15 bookings, 12 completed, $1,250 spent  
**Expected Result:**
- ✅ All 4 charts display correctly
- ✅ Service breakdown shows 5+ services
- ✅ Therapist pie chart has 3+ segments
- ✅ Monthly trend shows 6+ months
- ✅ Spending chart displays accurate totals

### Scenario 2: New Customer
**Profile:** 0 bookings  
**Expected Result:**
- ✅ Empty state message displays
- ✅ Friendly encouragement to book services
- ✅ No broken charts or errors

### Scenario 3: Partial Data
**Profile:** 2 bookings, both pending  
**Expected Result:**
- ✅ Overview cards show 2 total, 0 completed, $0 spent
- ✅ Service breakdown shows 2 services
- ✅ Therapist chart shows distribution
- ✅ Monthly charts show booking counts
- ✅ Spending chart empty (no completed bookings)

---

## 🎯 Success Metrics

### Performance
- Page loads in < 2 seconds
- Charts render within 500ms
- API response in < 1 second
- Smooth animations at 60fps

### User Experience
- Intuitive chart navigation
- Clear data labels and legends
- Helpful tooltips on hover
- Responsive on all devices

### Data Accuracy
- Correct booking counts
- Accurate spending calculations
- Proper percentage distributions
- Correct monthly aggregations

---

## 🛠️ Troubleshooting

### Issue: Charts not rendering
**Solution:** Check if Recharts is installed
```bash
npm list recharts
npm install recharts
```

### Issue: No data showing
**Solution:** 
1. Verify customer has bookings
2. Check API endpoint returns data
3. Inspect browser console for errors
4. Verify authentication token

### Issue: Charts look distorted
**Solution:**
1. Check container has defined height
2. Verify ResponsiveContainer wrapper
3. Ensure proper data format
4. Clear browser cache

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review API response in Network tab
3. Verify database has booking data
4. Consult implementation documentation

---

## 🎉 Enjoy Your Analytics!

The dashboard provides powerful visual insights into your wellness journey. Use the data to:
- Track your favorite services
- Monitor spending patterns
- Identify wellness trends
- Make informed booking decisions

Happy wellness journey! 🌟
