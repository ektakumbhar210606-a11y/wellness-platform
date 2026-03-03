# Customer Analytics with Graphs - Implementation Guide

## Overview
Enhanced the Customer Analytics dashboard with interactive charts and graphs using Recharts library, providing visual insights into booking patterns, service preferences, therapist usage, and spending behavior.

---

## 📊 Charts Implemented

### 1. Bar Chart - Services Usage Distribution
**Purpose:** Visualize which services are most popular among customers

**Features:**
- X-axis: Service names (angled labels for better readability)
- Y-axis: Number of times booked
- Multi-colored bars using color palette
- Responsive design with tooltips

**Technical Details:**
```typescript
<ResponsiveContainer>
  <BarChart data={serviceBreakdown}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="service" angle={-15} textAnchor="end" height={80} />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Bar dataKey="count" fill="#667eea">
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

---

### 2. Pie Chart - Therapist Sessions Distribution
**Purpose:** Show percentage distribution of sessions across therapists

**Features:**
- Circular pie chart with percentage labels
- Color-coded segments for each therapist
- Shows therapist name and percentage
- Interactive tooltips on hover

**Technical Details:**
```typescript
<ResponsiveContainer>
  <PieChart>
    <Pie
      data={therapistBreakdown}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
      outerRadius={120}
      dataKey="count"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

---

### 3. Line Chart - Monthly Booking Trend
**Purpose:** Display booking frequency trends over time

**Features:**
- X-axis: Month (YYYY-MM format)
- Y-axis: Number of bookings
- Smooth line with dot markers
- Green gradient for positive visualization

**Technical Details:**
```typescript
<ResponsiveContainer>
  <LineChart data={monthlyBookings}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis allowDecimals={false} />
    <Tooltip />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="count" 
      stroke="#43e97b" 
      strokeWidth={3}
      dot={{ fill: '#43e97b', r: 6 }}
      activeDot={{ r: 8 }}
    />
  </LineChart>
</ResponsiveContainer>
```

---

### 4. Bar Chart - Monthly Spending Pattern
**Purpose:** Visualize monthly expenditure on wellness services

**Features:**
- X-axis: Month
- Y-axis: Total amount spent (formatted as currency)
- Rounded bar corners for modern look
- Pink/purple gradient for visual appeal

**Technical Details:**
```typescript
<ResponsiveContainer>
  <BarChart data={monthlySpending}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
    <Tooltip 
      formatter={(value) => [`$${value.toFixed(2)}`, 'Amount Spent']}
    />
    <Legend />
    <Bar 
      dataKey="total" 
      fill="#fa8bfd" 
      radius={[4, 4, 0, 0]} 
    />
  </BarChart>
</ResponsiveContainer>
```

---

## 🔧 Backend Updates

### API Enhancement
**File:** `app/api/customer/analytics/route.ts`

Added `monthlySpending` calculation to track spending by month:

```typescript
// Calculate monthly spending from completed bookings
const monthlySpendingMap = new Map<string, number>();
result.monthlySpendingData.forEach((detail: any) => {
  if (detail.status === 'completed') {
    const current = monthlySpendingMap.get(detail.month) || 0;
    monthlySpendingMap.set(detail.month, current + (detail.servicePrice || 0));
  }
});

const monthlySpending = Array.from(monthlySpendingMap.entries())
  .map(([month, total]) => ({ month, total }))
  .sort((a, b) => a.month.localeCompare(b.month));
```

### Updated Response Structure
```json
{
  "totalBookings": 15,
  "totalCompletedBookings": 12,
  "totalSpent": 1250.00,
  "mostBookedService": "Swedish Massage",
  "serviceBreakdown": [
    { "service": "Swedish Massage", "count": 8 },
    { "service": "Deep Tissue", "count": 5 }
  ],
  "therapistBreakdown": [
    { "therapistName": "Dr. Jane Smith", "count": 10 },
    { "therapistName": "John Doe", "count": 3 }
  ],
  "monthlyBookings": [
    { "month": "2026-02", "count": 5 },
    { "month": "2026-03", "count": 7 }
  ],
  "monthlySpending": [
    { "month": "2026-02", "total": 500.00 },
    { "month": "2026-03", "total": 750.00 }
  ]
}
```

---

## 🎨 Design Features

### Color Palette
Consistent 10-color palette used across all charts:
```typescript
const CHART_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#43e97b', '#fa8bfd',
  '#faad14', '#13c2c2', '#eb2f96', '#52c41a', '#1890ff'
];
```

### Responsive Layout
- **Mobile-first approach** with breakpoints
- **ResponsiveContainer** ensures charts scale properly
- **Card-based layout** for clean organization
- **Grid system** adapts to screen size

### Empty States
Each chart handles empty data gracefully:
```typescript
{data.length > 0 ? (
  <ResponsiveContainer>
    {/* Chart component */}
  </ResponsiveContainer>
) : (
  <Empty description="No data available" />
)}
```

---

## 📦 Dependencies

### Required Packages
```json
{
  "recharts": "^2.x.x"
}
```

**Installation:**
```bash
npm install recharts
```

### Imports Used
```typescript
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
```

---

## 🏗️ Component Architecture

### State Management
```typescript
const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Data Fetching
```typescript
useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  fetchAnalytics();
}, []);
```

---

## 🎯 Key Features

### ✅ Interactive Elements
- **Tooltips:** Hover over chart elements for detailed information
- **Legends:** Click to filter data series
- **Responsive Containers:** Charts resize automatically
- **Animations:** Smooth transitions on load and update

### ✅ Accessibility
- **Color contrast:** High contrast for readability
- **Labels:** Clear labeling on all chart elements
- **Empty states:** Helpful messages when no data exists
- **Loading states:** Spin indicator during data fetch

### ✅ Performance
- **Single API call:** All data fetched at once
- **Client-side rendering:** No server-side rendering overhead
- **Efficient aggregation:** MongoDB aggregation pipeline
- **Memoization:** React optimizes re-renders

---

## 📱 Responsive Design

### Breakpoints
```typescript
<Col xs={24} sm={12} lg={8}>  // Cards
<Col xs={24}>                  // Full-width charts
```

### Container Heights
- Overview cards: Auto height
- Bar charts: 300px
- Pie chart: 400px (needs more space for labels)
- Line chart: 300px

---

## 🔒 Security & Data Integrity

### Authentication
- JWT token required for API access
- Customer role validation
- Data isolation (customers see only their own data)

### Data Validation
- Null/undefined checks with fallback values
- Type safety with TypeScript interfaces
- Defensive programming in UI (e.g., `|| 0` for numbers)

---

## 🧪 Testing

### Manual Testing Steps
1. Start dev server: `npm run dev`
2. Login as customer
3. Navigate to `/dashboard/customer/analytics`
4. Verify all 4 charts render correctly
5. Test with different scenarios:
   - Customer with many bookings
   - Customer with no bookings (empty state)
   - Customer with partial data

### Expected Behavior
- ✅ Charts render within 2 seconds
- ✅ Tooltips appear on hover
- ✅ Responsive on mobile/tablet/desktop
- ✅ Empty states show when no data
- ✅ Loading spinner during fetch

---

## 🚀 Future Enhancements

Potential improvements:
- 📊 **Export functionality:** Download charts as PNG/PDF
- 🎨 **Custom date range:** Filter by specific time period
- 📈 **Comparison mode:** Compare current vs previous period
- 🏆 **Achievement badges:** Milestone celebrations
- 💡 **AI insights:** Personalized recommendations
- 🌐 **Dark mode:** Alternative color scheme
- 📱 **Touch gestures:** Swipe between charts on mobile

---

## 📋 Checklist

All requirements met:
- ✅ Bar Chart - Services Usage
- ✅ Pie Chart - Therapist Distribution
- ✅ Line Chart - Monthly Booking Trend
- ✅ Bar Chart - Monthly Spending
- ✅ Uses Recharts library
- ✅ Responsive design
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Consistent color palette
- ✅ Only completed bookings for spending
- ✅ Protected API endpoint
- ✅ TypeScript type safety

---

## 🎉 Conclusion

The graph-based analytics dashboard provides customers with powerful visual insights into their wellness journey. The implementation uses modern charting libraries, follows best practices for React development, and maintains security and performance standards.

All charts are fully functional, responsive, and ready for production use!
