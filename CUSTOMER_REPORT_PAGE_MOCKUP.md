# Customer Report Page - Visual Mockup

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 My Booking Reports                                          │
│  Generate customized reports for your booking history          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Select Report Fields                              [Generate]   │
│  ┌──────────────────────────────────────────────────┐  [PDF]    │
│  │ ☐ 📋 Total Bookings                              │  [Excel]  │
│  │ ☐ ✅ Completed Bookings                          │           │
│  │ ☐ ❌ Cancelled Bookings                          │           │
│  │ ☐ 💰 Total Spent                                 │           │
│  │ ☐ 🎁 Total Discount Used                         │           │
│  │ ☐ ⭐ Most Booked Service                         │           │
│  │ ☐ 📚 All Bookings History                        │           │
│  │ ☐ 📊 Monthly Booking Trend                       │           │
│  │ ☐ 🏢 Service History                             │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  REPORT DISPLAY (appears after clicking Generate)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OVERVIEW STATISTICS                                            │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│  │📋     │ │✅     │ │❌     │ │💰     │ │🎁     │ │⭐     │  │
│  │  15   │ │  12   │ │   3   │ │₹4,500│ │₹450  │ │Swedish│  │
│  │Total  │ │Completed│Cancelled│ Spent │ │Discount│ │Most   │  │
│  │Bookings│ │Bookings│ │Bookings│       │ │ Used  │ │Booked │  │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📚 Complete Booking History                                    │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Service │ Therapist │ Date & Time │ Status │ Price │ Disc ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Swedish │ John D.   │ Jan 15, 2026│COMPLETED│₹300 │ ✅Yes││
│  │ Massage │           │ at 10:00 AM │(green) │      │      ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Deep    │ Sarah M.  │ Jan 10, 2026│CANCELLED│₹0    │ ❌No ││
│  │ Tissue  │           │ at 2:00 PM  │(red)   │      │      ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Aromath │ John D.   │ Jan 5, 2026 │CONFIRMED│₹350 │ ✅Yes││
│  │ erapy   │           │ at 3:30 PM  │(blue)  │      │      ││
│  └────────────────────────────────────────────────────────────┘│
│  Summary: 15 bookings | ✓ 12 | ✗ 3 | 🎁 8 | ₹4,500.00         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 Monthly Booking Trend                                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Month          │ Bookings │ Total Spent                   ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ January 2026   │    5     │        ₹1,500.00              ││
│  │ December 2025  │    4     │        ₹1,200.00              ││
│  │ November 2025  │    6     │        ₹1,800.00              ││
│  └────────────────────────────────────────────────────────────┘│
│  Total: 15 bookings | ₹4,500.00                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🏢 Service History                                             │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Service Name   │ Times │ Total Spent │ Last Booking       ││
│  │                │Booked │             │                    ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ Swedish Massage│   8   │  ₹2,400.00  │ Jan 15, 2026      ││
│  │ Deep Tissue    │   5   │  ₹1,500.00  │ Jan 10, 2026      ││
│  │ Aromatherapy   │   2   │    ₹600.00  │ Jan 5, 2026       ││
│  └────────────────────────────────────────────────────────────┘│
│  Total: 15 bookings | ₹4,500.00                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component States

### Initial State (No Selection)
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 My Booking Reports                                          │
│  Generate customized reports for your booking history          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Select Report Fields                              [Generate]   │
│  ┌──────────────────────────────────────────────────┐  [PDF]    │
│  │ ☐ 📋 Total Bookings                              │  [Excel]  │
│  │ ☐ ✅ Completed Bookings                          │(disabled) │
│  │ ☐ ❌ Cancelled Bookings                          │(disabled) │
│  │ ☐ 💰 Total Spent                                 │           │
│  │ ... (other fields)                               │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              📊 (large gray icon)                               │
│                                                                 │
│         Select report fields and click "Generate Report"        │
│         to view your booking analytics                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────┐
│  Select Report Fields                              [Generating] │
│  ┌──────────────────────────────────────────────────┐  [PDF]    │
│  │ ✓ 📋 Total Bookings                              │  [Excel]  │
│  │ ✓ ✅ Completed Bookings                          │(disabled) │
│  │ ✓ ❌ Cancelled Bookings                          │(disabled) │
│  │ ✓ 💰 Total Spent                                 │           │
│  │ ... (selected fields)                            │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ⟳ (spinning loader)                          │
│                                                                 │
│              Generating your report...                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Error State
```
⚠️ Warning: Please select at least one report field
```

or

```
❌ Error: Failed to generate report
   Network error. Please try again.
```

---

## Responsive Behavior

### Desktop View (> 1024px)
- 6 statistics cards per row
- Full-width tables
- Side-by-side buttons

### Tablet View (768px - 1024px)
- 4 statistics cards per row
- Scrollable tables
- Stacked buttons

### Mobile View (< 768px)
- 2 statistics cards per row
- Horizontal scroll on tables
- Full-width buttons stacked vertically

---

## Color Coding

### Status Colors in Tables
- **Completed**: Green (#52c41a)
- **Cancelled**: Red (#ff4d4f)
- **Confirmed**: Blue (#1890ff)
- **Pending**: Orange (#faad14)

### Statistic Card Colors
- **Total Bookings**: Default blue
- **Completed**: Green text
- **Cancelled**: Red text
- **Total Spent**: Blue text
- **Discount Used**: Purple text

### Icon Colors
- Primary action buttons: Blue (#1890ff)
- Disabled buttons: Gray (#d9d9d9)
- Success messages: Green (#52c41a)
- Error messages: Red (#ff4d4f)
- Warning messages: Orange (#faad14)

---

## Interaction Examples

### Example 1: Quick Summary Report
**User selects:**
- [x] 📋 Total Bookings
- [x] ✅ Completed Bookings
- [x] 💰 Total Spent

**Result shows:**
- 3 statistic cards only
- No tables
- Fast generation

### Example 2: Comprehensive Analysis
**User selects:**
- [x] All 9 fields

**Result shows:**
- 6 statistic cards
- Complete Bookings table
- Monthly Trend table
- Service History table
- Full analytics dashboard

### Example 3: Spending Analysis
**User selects:**
- [x] 💰 Total Spent
- [x] 🎁 Total Discount Used
- [x] 📊 Monthly Booking Trend
- [x] 🏢 Service History

**Result shows:**
- 4 spending-related statistic cards
- Monthly Trend table
- Service History table
- Focus on financial data

---

## PDF Preview

When user clicks "Download PDF":
```
╔══════════════════════════════════════════════════╗
║                                                  ║
║        Customer Booking Report                   ║
║        Generated on: January 15, 2026 2:30 PM   ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Overview Statistics                             ║
║  ┌──────────────┬──────────────┬──────────────┐ ║
║  │ Total        │ Completed    │ Cancelled    │ ║
║  │ Bookings     │ Bookings     │ Bookings     │ ║
║  │     15       │     12       │      3       │ ║
║  └──────────────┴──────────────┴──────────────┘ ║
║                                                  ║
║  Complete Booking History                        ║
║  Service      │ Therapist │ Date     │ Status  ║
║  Swedish      │ John D.   │ Jan 15   │COMPLETED║
║  Massage      │           │ 2026     │         ║
║  ...                                           ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Excel Preview

When user clicks "Download Excel", workbook contains:

**Sheet Tabs (bottom):**
```
[Overview] [All Bookings] [Monthly Trend] [Service History]
```

**Overview Sheet:**
```
A                    │ B
─────────────────────┼──────────────
Customer Booking     │
Report               │
Generated: Jan 15    │
2026 2:30 PM         │
                     │
Total Bookings       │ 15
Completed Bookings   │ 12
Cancelled Bookings   │ 3
Total Spent (₹)      │ 4500.00
```

**All Bookings Sheet:**
```
Service    │ Therapist  │ Date      │ Time   │ Status    │ Price │ Discount
───────────┼────────────┼───────────┼────────┼───────────┼───────┼─────────
Swedish    │ John D.    │ Jan 15    │ 10:00  │ completed │ 300   │ Yes
Massage    │            │ 2026      │ AM     │           │       │
Deep       │ Sarah M.   │ Jan 10    │ 2:00   │ cancelled │ 0     │ No
Tissue     │            │ 2026      │ PM     │           │       │
```

---

## User Experience Highlights

✅ **Intuitive**: Checkbox interface familiar to all users
✅ **Progressive**: Start simple, add complexity as needed
✅ **Visual**: Icons and colors guide understanding
✅ **Responsive**: Works on any device
✅ **Fast**: Loading states keep users informed
✅ **Professional**: Clean design matches business side
✅ **Flexible**: Generate exactly the report you need
✅ **Exportable**: Take data anywhere in PDF/Excel

---

## Accessibility Features

- Keyboard navigation support
- Screen reader friendly labels
- High contrast colors
- Clear focus indicators
- Descriptive button text
- Semantic HTML structure
- ARIA labels where needed

---

This mockup shows how the customer report page provides a professional, user-friendly interface for generating comprehensive booking analytics with the same polish as the business side!
