# Therapist Cancellation Card - Frontend Component

## Overview
React component displaying therapist's personal cancellation performance metrics in a card format on the Therapist Dashboard.

## Component Location
```
wellness-app/app/components/therapist/TherapistCancellationCard.tsx
```

## Features

### Display Metrics
1. **Monthly Cancellations** - Current month cancellation count with color-coded status
2. **Total Cancellations** - Lifetime cancellation count
3. **Warning Status** - Active/None warning indicator
4. **Bonus Penalty** - Percentage penalty with visual progress bar

### Visual Design

#### Color Coding

**Monthly Cancellations:**
| Count | Color | Status Label |
|-------|-------|--------------|
| 0-2 | 🟢 Green (#52c41a) | Good |
| 3-4 | 🟡 Yellow (#faad14) | Caution |
| 5-6 | 🟠 Orange (#ff7a45) | High |
| 7+ | 🔴 Red (#d32f2f) | Critical |

**Bonus Penalty:**
| Percentage | Color | Meaning |
|------------|-------|---------|
| 0% | Green | No penalty |
| 1-10% | Yellow | Light penalty |
| 11-25% | Orange | Medium penalty |
| 100% | Red | Maximum penalty |

**Warning Status:**
| Status | Color | Icon |
|--------|-------|------|
| None | Green | ✅ Check circle |
| Active | Orange | ⚠️ Warning |

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  📊 Cancellation Performance                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Monthly      Total        Warning      Bonus       │
│  Cancel       Cancel       Status       Penalty     │
│                                                     │
│    4           12          Active        10%        │
│  Caution     Lifetime      ⚠️ Yes      ████░░ 90%  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Note: Your cancellation performance affects bonus   │
│ ⚠️ You have 4 cancellations this month...           │
└─────────────────────────────────────────────────────┘
```

## API Integration

### Fetches Data From
```
GET /api/therapist/me
Authorization: Bearer <therapist_token>
```

### Response Processing
Extracts cancellation fields from therapist profile:
```typescript
{
  monthlyCancelCount: number;
  totalCancelCount: number;
  cancelWarnings: number;
  bonusPenaltyPercentage: number;
}
```

## Component Props
No props required - component is self-contained and fetches its own data.

## State Management

```typescript
const [data, setData] = useState<CancellationData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

## UI States

### Loading State
```tsx
<Spin size="large" />
<Text>Loading cancellation performance...</Text>
```

### Error State
```tsx
<Alert
  type="error"
  message="Error Loading Data"
  description={error}
  action={<button onClick={retry}>Retry</button>}
/>
```

### Success State
Full card display with 4-column layout showing all metrics.

## Responsive Design

### Desktop (≥768px)
- 4 columns side-by-side
- All metrics visible at once
- Compact card layout

### Tablet (576px - 767px)
- 2 columns × 2 rows grid
- Maintains readability
- Touch-friendly spacing

### Mobile (<576px)
- Single column stack
- Vertical layout
- Larger touch targets

## Helper Functions

### getMonthlyCancelColor(count: number): string
Returns appropriate color based on monthly cancellation count.

### getPenaltyColor(percentage: number): string
Returns color based on bonus penalty percentage.

### getWarningStatus(): object
Returns warning tag configuration (text, color, icon).

## Conditional Display

### Shows Additional Info When:
- Monthly cancellations > 0, OR
- Bonus penalty > 0%

### Info Messages:
```typescript
// General note
"Note: Your cancellation performance affects your bonus eligibility."

// If monthly >= 3
"⚠️ You have {count} cancellations this month. Try to reduce cancellations to maintain full bonus."

// If penalty > 0
"⚠️ A {percentage}% penalty is currently applied to your bonuses."
```

## Integration

### Added to Therapist Dashboard
Location: `/dashboard/therapist/page.tsx`

```tsx
{/* Cancellation Performance Card */}
<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
  <Col span={24}>
    <TherapistCancellationCard />
  </Col>
</Row>
```

### Placement
- Below the 4 statistics cards (Appointments, Requests, Sessions, Rating)
- Above Recent Activity section
- In Dashboard Overview tab

## Dependencies

### Ant Design Components
- `Card` - Main container
- `Typography` - Text styling
- `Spin` - Loading indicator
- `Alert` - Error messages
- `Tag` - Status indicators
- `Row`, `Col` - Grid layout
- `Statistic` - Metric display
- `Progress` - Penalty visualization
- `Divider` - Section separator

### Icons (Ant Design Icons)
- `WarningOutlined` - Warning icon
- `CheckCircleOutlined` - Success icon
- `BarChartOutlined` - Card title icon

## Example Display

### Scenario 1: Excellent Performance
```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 1    Total: 5    None     Bonus: 0%│
│  Good       Lifetime     ✅       ████████  │
└──────────────────────────────────────────────┘
```

### Scenario 2: Needs Improvement
```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 5    Total: 15   Active   Bonus: 10%│
│  High       Lifetime     ⚠️      ██████░░  │
├──────────────────────────────────────────────┤
│ ⚠️ You have 5 cancellations this month...    │
│ ⚠️ A 10% penalty is currently applied...     │
└──────────────────────────────────────────────┘
```

### Scenario 3: Critical Status
```
┌──────────────────────────────────────────────┐
│ 📊 Cancellation Performance                  │
├──────────────────────────────────────────────┤
│ Monthly: 8    Total: 25   Active   Bonus: 100%│
│ Critical    Lifetime     ⚠️       ░░░░░░░░  │
├──────────────────────────────────────────────┤
│ ⚠️ You have 8 cancellations this month...    │
│ ⚠️ A 100% penalty is currently applied...    │
└──────────────────────────────────────────────┘
```

## Testing Checklist

✅ **Functional Tests:**
- Fetches data on mount
- Displays loading state during fetch
- Handles errors gracefully
- Shows retry option on error
- Updates display when data changes

✅ **Visual Tests:**
- Colors match specification
- Icons display correctly
- Progress bar shows correct percentage
- Responsive on all screen sizes
- Text doesn't overflow

✅ **Integration Tests:**
- Doesn't break existing dashboard features
- Works with other dashboard components
- Proper authentication
- Correct API endpoint usage

## Performance Optimizations

- Single API call on component mount
- No unnecessary re-renders
- Efficient state management
- Lazy loading not needed (small component)

## Accessibility

- Semantic HTML structure
- ARIA labels from Ant Design
- Keyboard navigation support
- Screen reader friendly text
- Color contrast meets WCAG standards

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Created**: March 12, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0
