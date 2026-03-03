# 📐 Therapist Analytics Tab - Visual Layout Guide

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    THERAPIST ANALYTICS PAGE                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 📊 Practice Analytics                                     │   │
│  │ Comprehensive insights into your therapy practice         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 1: SUMMARY CARDS (Top Row - 4 Cards)                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ ✓ Sessions │ │ $ Earnings │ │ ⭐ Rating  │ │ 🏆 Bonus   │  │
│  │    45      │ │  $4,500.00 │ │    4.7     │ │   $0.00    │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 2: MONTHLY EARNINGS TREND (Line Chart)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💰 Monthly Earnings Trend                                  │   │
│  │                                                            │   │
│  │       ╭╮        ╭╮                                        │   │
│  │      ╭╯╰╮      ╭╯╰╮      ╭╮                               │   │
│  │     ╭╯  ╰╮    ╭╯  ╰╮    ╭╯╰╮                              │   │
│  │    ╭╯    ╰╮  ╭╯    ╰╮  ╭╯  ╰╮                             │   │
│  │ ───╯──────────╯──────────╯────────────────────────         │   │
│  │   Jan   Feb   Mar   Apr   May   Jun                        │   │
│  │                                                            │   │
│  │ 📈 Line Chart - Monthly Earnings Trend                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 3: COMPLETED SESSIONS PER MONTH (Bar Chart)           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 👥 Completed Sessions Per Month                            │   │
│  │                                                            │   │
│  │     ████        ████                                      │   │
│  │     ████        ████        ████                          │   │
│  │     ████        ████        ████        ████              │   │
│  │     ████        ████        ████        ████              │   │
│  │ ───████────────████────────████────────████────────        │   │
│  │     Jan         Feb         Mar         Apr                │   │
│  │                                                            │   │
│  │ 📊 Bar Chart - Completed Sessions Per Month                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 4: RATING TREND PER MONTH (Line Chart)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⭐ Rating Trend Per Month                                  │   │
│  │                                                            │   │
│  │   5.0 ──────────────────────────────────────────          │   │
│  │         ╭╮        ╭╮                                      │   │
│  │   4.0 ──╯╰╮      ╭╯╰╮───────                              │   │
│  │           ╰╮    ╭╯                                        │   │
│  │   3.0 ─────╰────╯                                         │   │
│  │                                                            │   │
│  │     Jan   Feb   Mar   Apr   May   Jun                      │   │
│  │                                                            │   │
│  │ 📈 Line Chart - Rating Trend Per Month                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 5: SERVICE DISTRIBUTION (Pie Chart + Legend)          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🏆 Service Distribution                                    │   │
│  │                                                            │   │
│  │            ╭──────────────╮                                │   │
│  │          ╱   Deep Tissue  ╲                                │   │
│  │        ╱       35%         ╲                               │   │
│  │       │        ╭─────╮      │                              │   │
│  │       │       ╱       ╲     │                              │   │
│  │        ╲   Swedish    ╱                                    │   │
│  │          ╲  25%      ╱                                     │   │
│  │            ╰─────────╯                                     │   │
│  │                                                            │   │
│  │ 🥧 Pie Chart - Service Distribution                        │   │
│  │                                                            │   │
│  │ Service Breakdown:                                          │   │
│  │ ■ Deep Tissue Massage – 12 sessions (35%)                  │   │
│  │ ■ Swedish Massage – 8 sessions (25%)                       │   │
│  │ ■ Sports Massage – 7 sessions (22%)                        │   │
│  │ ■ Thai Massage – 5 sessions (18%)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SECTION 6: MONTHLY REVIEWS COUNT (Bar Chart)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 💬 Monthly Reviews Count                                   │   │
│  │                                                            │   │
│  │           ████                                            │   │
│  │           ████        ████                                │   │
│  │     ███   ████        ████        ███                     │   │
│  │     ███   ████   █    ████   ███   ███   █                │   │
│  │ ────███───████───█────████───███───███───█────────         │   │
│  │     Jan   Feb   Mar   Apr   May   Jun   Jul                │   │
│  │                                                            │   │
│  │ 📊 Bar Chart - Monthly Reviews Count                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop View (≥992px)
```
┌─────────────────────────────────────────────────────────┐
│ [Card 1] [Card 2] [Card 3] [Card 4]                     │
│                                                         │
│ [Chart: Full Width]                                     │
│                                                         │
│ [Chart: Full Width]                                     │
│                                                         │
│ [Chart: Full Width]                                     │
│                                                         │
│ [Chart: Full Width]                                     │
│                                                         │
│ [Chart: Full Width]                                     │
└─────────────────────────────────────────────────────────┘
```

### Tablet View (≥576px, <992px)
```
┌─────────────────────────────────────┐
│ [Card 1]    [Card 2]                │
│ [Card 3]    [Card 4]                │
│                                     │
│ [Chart: Full Width]                 │
│                                     │
│ [Chart: Full Width]                 │
│                                     │
│ [Chart: Full Width]                 │
│                                     │
│ [Chart: Full Width]                 │
│                                     │
│ [Chart: Full Width]                 │
└─────────────────────────────────────┘
```

### Mobile View (<576px)
```
┌───────────────────┐
│ [Card 1]          │
│ [Card 2]          │
│ [Card 3]          │
│ [Card 4]          │
│                   │
│ [Chart: Full W.]  │
│                   │
│ [Chart: Full W.]  │
│                   │
│ [Chart: Full W.]  │
│                   │
│ [Chart: Full W.]  │
│                   │
│ [Chart: Full W.]  │
└───────────────────┘
```

---

## Color Scheme Reference

### Summary Cards
| Card | Icon Color | Background |
|------|-----------|------------|
| Sessions | White | #43e97b (Green) |
| Earnings | White | #667eea (Purple-Blue) |
| Rating | White | #faad14 (Yellow-Orange) |
| Bonus | White | #f093fb (Pink) |

### Charts
| Chart | Primary Color |
|-------|--------------|
| Monthly Earnings | #667eea (Purple-Blue) |
| Completed Sessions | #43e97b (Green) |
| Rating Trend | #faad14 (Yellow-Orange) |
| Service Distribution | Multi-color palette (10 colors) |
| Monthly Reviews | #13c2c2 (Cyan) |

### Pie Chart Palette
```
Color 1: #667eea
Color 2: #764ba2
Color 3: #f093fb
Color 4: #43e97b
Color 5: #fa8bfd
Color 6: #faad14
Color 7: #13c2c2
Color 8: #eb2f96
Color 9: #52c41a
Color 10: #1890ff
```

---

## Component Hierarchy

```
TherapistAnalyticsPage
├── Header Section
│   ├── Title: "Practice Analytics"
│   └── Subtitle: "Comprehensive insights..."
│
├── Summary Cards Section (Row)
│   ├── StatCard (Sessions)
│   ├── StatCard (Earnings)
│   ├── StatCard (Rating)
│   └── StatCard (Bonus)
│
├── Chart Section 1 (Row)
│   └── Card: Monthly Earnings Trend
│       └── LineChart
│           └── Label: "📈 Line Chart - Monthly Earnings Trend"
│
├── Chart Section 2 (Row)
│   └── Card: Completed Sessions Per Month
│       └── BarChart
│           └── Label: "📊 Bar Chart - Completed Sessions Per Month"
│
├── Chart Section 3 (Row)
│   └── Card: Rating Trend Per Month
│       └── LineChart
│           └── Label: "📈 Line Chart - Rating Trend Per Month"
│
├── Chart Section 4 (Row)
│   └── Card: Service Distribution
│       ├── PieChart
│       │   └── Label: "🥧 Pie Chart - Service Distribution"
│       └── Service Legend
│           ├── Service 1 (Name, Sessions, %)
│           ├── Service 2 (Name, Sessions, %)
│           └── ...
│
└── Chart Section 5 (Row)
    └── Card: Monthly Reviews Count
        └── BarChart
            └── Label: "📊 Bar Chart - Monthly Reviews Count"
```

---

## Data Flow Diagram

```
┌─────────────────┐
│   Therapist     │
│     Login       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Analytics│
│   in Sidebar    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component Mounts│
│ useEffect Fires │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Call:       │
│ GET /api/       │
│ therapist/      │
│ analytics       │
│ + JWT Token     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Middleware │
│ ✓ Verify Token  │
│ ✓ Check Role    │
│ ✓ Find User     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7 MongoDB       │
│ Aggregations    │
│ Run in Parallel │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Aggregate Results│
│ Format Response │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return JSON     │
│ to Frontend     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ React State     │
│ Updated with    │
│ Analytics Data  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Components      │
│ Re-render with  │
│ New Data        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Charts Render   │
│ Using Recharts  │
│ Library         │
└─────────────────┘
```

---

## Empty State Design

```
┌─────────────────────────────────────────┐
│                                          │
│           📭 No Data Available           │
│                                          │
│   No analytics data available yet        │
│                                          │
│   Start accepting bookings to see your   │
│   practice analytics here!               │
│                                          │
└─────────────────────────────────────────┘
```

## Loading State Design

```
┌─────────────────────────────────────────┐
│                                          │
│              ⏳ Loading...               │
│                                          │
│         [Large Spinning Spinner]         │
│                                          │
│      Loading your analytics...           │
│                                          │
└─────────────────────────────────────────┘
```

## Error State Design

```
┌─────────────────────────────────────────┐
│                                          │
│           ⚠️ Error Occurred             │
│                                          │
│   [Error message from API or network]    │
│                                          │
│   Please try refreshing the page         │
│                                          │
└─────────────────────────────────────────┘
```

---

## Screen Dimensions

### Recommended Minimum
- **Width:** 320px (mobile)
- **Height:** 568px (small mobile)

### Optimal Experience
- **Desktop:** 1920x1080 or higher
- **Tablet:** 768x1024
- **Mobile:** 375x667 or larger

### Chart Heights
- All charts: 350px height
- Pie chart: 450px height (larger for better visibility)
- Container padding: 24px

### Spacing
- Card gutter (horizontal): 16px
- Card gutter (vertical): 16px
- Section margin bottom: 24px
- Page padding: 24px
- Max content width: 1400px (centered)

---

This visual guide ensures consistent implementation and helps developers understand the exact layout and behavior of the Analytics tab!
