# Therapist Cancellation Performance - Frontend Component

## Overview
React component displaying therapist cancellation statistics in a responsive table format for the Business Dashboard.

## Component Location
```
wellness-app/app/components/business/TherapistCancellationPerformance.tsx
```

## Features

### Table Columns
1. **Therapist Name** - Sortable, emphasizes therapist name
2. **Completed Bookings** - Green color, shows successful bookings
3. **Monthly Cancel** - Color-coded based on count:
   - 🟢 Green: 0-2 cancellations
   - 🟡 Yellow: 3-4 cancellations
   - 🟠 Orange: 5-6 cancellations
   - 🔴 Red: 7+ cancellations
4. **Total Cancel** - Lifetime cancellation count
5. **Warning** - Tag indicator (Yes/No):
   - ✅ Green "No" with checkmark icon
   - ⚠️ Orange "Yes" with warning icon
6. **Bonus Penalty** - Color-coded percentage:
   - 🟢 Green: 0%
   - 🟡 Yellow: 1-10%
   - 🟠 Orange: 11-25%
   - 🔴 Red: 100%

### Interactive Features
- **Sorting**: All columns are sortable
- **Filtering**: Warning column can be filtered by Yes/No
- **Pagination**: 10 items per page (configurable)
- **Responsive**: Horizontal scroll on smaller screens
- **Retry**: Error state includes retry button

### Summary Statistics
Displays at bottom of table:
- Total therapists count
- Therapists with warnings
- Therapists with penalties
- Average monthly cancellations

## Usage

### Added to Business Dashboard
The component is integrated as a new tab in `/dashboard/business/page.tsx`:

```tsx
{
  key: 'cancellation-performance',
  label: (
    <span>
      <BarChartOutlined style={{ color: '#faad14' }} />
      Cancellation Performance
    </span>
  ),
  children: (
    <div style={{ marginTop: '24px' }}>
      <TherapistCancellationPerformance />
    </div>
  ),
}
```

## API Integration

### Fetches Data From
```
GET /api/business/therapist-cancellation-stats
Authorization: Bearer <token>
```

### Response Format
```typescript
{
  success: boolean;
  data: {
    therapistName: string;
    completedBookings: number;
    monthlyCancelCount: number;
    totalCancelCount: number;
    cancelWarnings: number;
    bonusPenaltyPercentage: number;
  }[];
}
```

## Visual Design

### Color Scheme
- **Success (Green)**: `#52c41a` - Completed bookings, no warnings
- **Warning (Yellow/Orange)**: `#faad14` - Moderate cancellations
- **Alert (Orange)**: `#ff7a45` - High cancellations
- **Danger (Red)**: `#d32f2f` - Critical cancellations/penalties

### UI States

#### Loading State
```tsx
<Spin size="large" />
<Text>Loading cancellation statistics...</Text>
```

#### Error State
```tsx
<Alert
  type="error"
  message="Error Loading Data"
  description={error}
  action={<Button onClick={retry}>Retry</Button>}
/>
```

#### Empty State
```tsx
<Empty description="No therapists found" />
```

### Responsive Design
- Desktop: Full table view
- Tablet: Horizontal scroll enabled
- Mobile: Pagination adjusts, scrollable table

## Component Structure

```tsx
TherapistCancellationPerformance
├── Card (main container)
│   ├── Header (title with icon)
│   ├── Table
│   │   ├── Column: Therapist Name
│   │   ├── Column: Completed Bookings
│   │   ├── Column: Monthly Cancel
│   │   ├── Column: Total Cancel
│   │   ├── Column: Warning
│   │   └── Column: Bonus Penalty
│   └── Summary Card
│       ├── Total Therapists
│       ├── With Warnings
│       ├── With Penalties
│       └── Avg Monthly Cancels
```

## Props & Interfaces

### TherapistStat Interface
```typescript
interface TherapistStat {
  therapistName: string;
  completedBookings: number;
  monthlyCancelCount: number;
  totalCancelCount: number;
  cancelWarnings: number;
  bonusPenaltyPercentage: number;
}
```

### State Management
```typescript
const [stats, setStats] = useState<TherapistStat[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

## Helper Functions

### getPenaltyColor(percentage: number): string
Returns color based on penalty percentage:
- 0% → Green
- 1-10% → Yellow
- 11-25% → Orange
- 100% → Red

### getWarningStatus(hasWarning, monthlyCount)
Returns warning tag configuration:
- No warning + < 3 cancels → Green "No" with checkmark
- Has warning OR ≥ 3 cancels → Orange "Yes" with warning icon

## Dependencies

### Ant Design Components
- `Table` - Data display
- `Card` - Container
- `Tag` - Status indicators
- `Typography` - Text styling
- `Spin` - Loading indicator
- `Alert` - Error messages
- `Empty` - Empty state
- `Space` - Layout spacing

### Icons
- `WarningOutlined` - Warning icon
- `CheckCircleOutlined` - Success icon
- `BarChartOutlined` - Dashboard tab icon

## Testing

### Manual Testing Steps
1. Navigate to Business Dashboard
2. Click "Cancellation Performance" tab
3. Verify table displays correctly
4. Test sorting on each column
5. Test warning filter
6. Test pagination
7. Resize window to test responsiveness

### Expected Behavior
✅ Loads data on tab click  
✅ Shows loading spinner during fetch  
✅ Displays error with retry option on failure  
✅ Shows empty state if no therapists  
✅ Color-codes values correctly  
✅ Sorts data when clicking column headers  
✅ Filters by warning status  
✅ Responsive on mobile devices  

## Accessibility
- Semantic HTML structure
- ARIA labels from Ant Design
- Keyboard navigation support
- Screen reader friendly

## Performance Optimizations
- Single API call on mount
- Efficient rendering with rowKey
- Lazy loading with pagination
- Memoized table columns

---

**Created**: March 12, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0
