# Therapist Cancellation Card - Visual Mockup

## Dashboard Location
```
Therapist Dashboard → Dashboard Overview tab → Below statistics cards
```

## Page Layout Context

```
┌─────────────────────────────────────────────────────────────┐
│  Therapist Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│  [Dashboard] [Profile] [Schedule] [Bookings] [Reviews]...   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard Overview                                         │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Today's  │ │ Pending  │ │Completed │ │  Avg.    │      │
│  │Appt: 3   │ │Reqs: 2   │ │Sessions: │ │ Rating:  │      │
│  │          │ │          │ │   25     │ │  4.8/5   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 📊 CANCELLATION PERFORMANCE (NEW CARD)             │    │
│  ├────────────────────────────────────────────────────┤    │
│  │                                                    │    │
│  │  Monthly    Total      Warning       Bonus        │    │
│  │  Cancel     Cancel     Status        Penalty      │    │
│  │                                                    │    │
│  │    2         8         None          0%           │    │
│  │  Good      Lifetime    ✅ No        ████████░░░░  │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Recent Activity                                            │
│  • Service with Customer - Date/Time                       │
│  • Service with Customer - Date/Time                       │
└─────────────────────────────────────────────────────────────┘
```

## Card Design Details

### Desktop View (≥768px)

```
┌───────────────────────────────────────────────────────────┐
│ 📊 Cancellation Performance                               │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Monthly  │  Total   │ Warning  │  Bonus   │          │
│  │ Cancel   │ Cancel   │  Status  │ Penalty  │          │
│  │          │          │          │          │          │
│  │    4     │    12    │  Active  │   10%    │          │
│  │ Caution  │ Lifetime │  ⚠️ Yes  │ ████░░░  │          │
│  │          │          │          │          │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
│                                                           │
│  ───────────────────────────────────────────────────────  │
│                                                           │
│  Note: Your cancellation performance affects bonus.       │
│  ⚠️ You have 4 cancellations this month...               │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Tablet View (576px - 767px)

```
┌─────────────────────────────────────┐
│ 📊 Cancellation Performance         │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┬──────────┐           │
│  │ Monthly  │  Total   │           │
│  │ Cancel   │ Cancel   │           │
│  │    4     │    12    │           │
│  │ Caution  │ Lifetime │           │
│  └──────────┴──────────┘           │
│                                     │
│  ┌──────────┬──────────┐           │
│  │ Warning  │  Bonus   │           │
│  │  Status  │ Penalty  │           │
│  │  Active  │   10%    │           │
│  │ ⚠️ Yes   │ ████░░░  │           │
│  └──────────┴──────────┘           │
│                                     │
│  ─────────────────────────────────  │
│  Note: Your cancellation...         │
│                                     │
└─────────────────────────────────────┘
```

### Mobile View (<576px)

```
┌─────────────────────────┐
│ 📊 Cancellation Perf.   │
├─────────────────────────┤
│                         │
│  Monthly Cancellations  │
│         4               │
│      Caution            │
│                         │
│  Total Cancellations    │
│         12              │
│      Lifetime           │
│                         │
│   Warning Status        │
│      Active             │
│     ⚠️ Yes              │
│                         │
│    Bonus Penalty        │
│        10%              │
│    ████░░░░░ 90% perf   │
│                         │
│  ─────────────────────  │
│  Note: Your cancel...   │
│                         │
└─────────────────────────┘
```

## Color Variations

### Excellent Performance (All Green)

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 1    Total: 5    None     Bonus: 0%│
│  🟢 Good    Lifetime     ✅       ████████  │
└──────────────────────────────────────────────┘
```

### Moderate Issues (Yellow/Orange)

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 3    Total: 10   Active   Bonus: 0%│
│  🟡 Caution  Lifetime     ⚠️       ████████  │
├──────────────────────────────────────────────┤
│ ⚠️ You have 3 cancellations this month...    │
└──────────────────────────────────────────────┘
```

### High Risk (Red)

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 7    Total: 20   Active   Bonus: 100%│
│  🔴 Crit    Lifetime     ⚠️       ░░░░░░░░  │
├──────────────────────────────────────────────┤
│ ⚠️ You have 7 cancellations this month...    │
│ ⚠️ A 100% penalty is currently applied...    │
└──────────────────────────────────────────────┘
```

## Loading State

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│                                              │
│              ⟳ (spinning)                    │
│                                              │
│     Loading cancellation performance...      │
│                                              │
└──────────────────────────────────────────────┘
```

## Error State

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│                                              │
│  ❌ Error Loading Data                        │
│                                              │
│  Failed to fetch cancellation data.          │
│  Please check your connection and try again. │
│                                              │
│                              [Retry Button]  │
│                                              │
└──────────────────────────────────────────────┘
```

## Empty State (No Data)

```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│                                              │
│              📭                              │
│                                              │
│     No cancellation data available yet.      │
│                                              │
│  Start accepting bookings to track your      │
│  cancellation performance metrics.           │
│                                              │
└──────────────────────────────────────────────┘
```

## Interactive Elements

### Hover Effects
- Cards lift slightly on hover (subtle shadow increase)
- Progress bar animates on load
- Tags have subtle hover state

### Responsive Behavior
- Columns reflow based on screen size
- Font sizes adjust for mobile
- Touch targets minimum 44px × 44px

## Animation Details

### Progress Bar Animation
```css
/* When component mounts */
progress-bar {
  animation: fillProgress 0.6s ease-out;
}

@keyframes fillProgress {
  from { width: 0%; }
  to { width: calculated-width; }
}
```

### Tag Fade In
```css
status-tag {
  animation: fadeIn 0.3s ease-in;
}
```

## Accessibility Features

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for icons
- Descriptive text for status

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate retry button
- Focus indicators visible

### Color Contrast
- All text meets WCAG AA standards
- Icons have sufficient contrast
- Progress bar distinguishable

---

**Design Notes:**
- Clean, professional aesthetic matching Ant Design
- Instant visual feedback through color coding
- Progressive disclosure (details on demand)
- Mobile-first responsive approach
- Consistent with existing dashboard styling

**Created**: March 12, 2026  
**Status**: Ready for implementation
