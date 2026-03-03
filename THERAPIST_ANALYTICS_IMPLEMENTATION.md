# Therapist Analytics Feature - Complete Implementation

## Overview
This document provides comprehensive documentation for the **Analytics tab** implementation in the Therapist Dashboard, delivering detailed visual insights into therapy practice performance through interactive charts and statistics.

## ✨ Features Implemented

### 📊 Analytics Dashboard Components

#### SECTION 1: Summary Performance Cards (Top Row)
Four responsive overview cards displaying key metrics:

1. **Total Sessions Completed** 
   - Source: Completed bookings count
   - Icon: Green check circle
   - Color: #43e97b

2. **Total Earnings**
   - Source: Sum of therapistPayoutAmount from completed bookings
   - Format: Currency with 2 decimal places
   - Icon: Dollar sign
   - Color: #667eea

3. **Average Rating**
   - Source: Average of all reviews (1-5 scale)
   - Format: 1 decimal place
   - Icon: Star
   - Color: #faad14

4. **Monthly Bonus Earned**
   - Source: Placeholder (no bonus model exists)
   - Format: Currency ($0.00)
   - Icon: Trophy
   - Color: #f093fb

#### SECTION 2: Monthly Earnings Trend (Line Chart)
- **X-axis**: Month (YYYY-MM format)
- **Y-axis**: Earnings in dollars
- **Data source**: Completed bookings grouped by month
- **Visualization**: Line chart with gradient dots
- **Color**: #667eea (purple-blue)

#### SECTION 3: Completed Sessions Per Month (Bar Chart)
- **X-axis**: Month (YYYY-MM format)
- **Y-axis**: Number of sessions
- **Data source**: Completed bookings count by month
- **Visualization**: Bar chart with rounded corners
- **Color**: #43e97b (green)

#### SECTION 4: Rating Trend Per Month (Line Chart)
- **X-axis**: Month (YYYY-MM format)
- **Y-axis**: Average rating (0-5 scale)
- **Data source**: Reviews grouped by month
- **Visualization**: Line chart showing rating progression
- **Color**: #faad14 (yellow-orange)

#### SECTION 5: Service Distribution (Pie Chart)
- **Data**: Breakdown of services provided
- **Labels**: Service name + percentage
- **Legend**: Detailed breakdown below chart showing:
  - Service name
  - Total sessions
  - Percentage of total
- **Colors**: Multi-color palette (10 colors)

#### SECTION 6: Monthly Reviews Count (Bar Chart)
- **X-axis**: Month (YYYY-MM format)
- **Y-axis**: Number of reviews
- **Data source**: Reviews grouped by month
- **Visualization**: Bar chart with rounded corners
- **Color**: #13c2c2 (cyan)

---

## 🔧 Backend Implementation

### API Endpoint

**Route:** `GET /api/therapist/analytics`

**File:** `app/api/therapist/analytics/route.ts`

### Authentication & Authorization

```typescript
async function requireTherapistAuth(request: NextRequest)
```

**Security Measures:**
- JWT token authentication required
- Role-based access control (therapist only)
- User verification from database
- Token expiration handling

**Response on Auth Failure:**
```json
{
  "error": "Authentication token required",
  "status": 401
}
```

### Database Logic - Step by Step

#### STEP 1: Basic Summary Aggregation

```javascript
const bookingSummary = await BookingModel.aggregate([
  { $match: { therapist: therapist._id } },
  {
    $lookup: {
      from: 'services',
      localField: 'service',
      foreignField: '_id',
      as: 'serviceInfo'
    }
  },
  { $unwind: { path: '$serviceInfo', preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: null,
      totalSessionsCompleted: {
        $sum: { $cond: [{ $eq: ['$status', BookingStatus.Completed] }, 1, 0] }
      },
      totalEarnings: {
        $sum: {
          $cond: [
            { $eq: ['$status', BookingStatus.Completed] },
            { $ifNull: ['$therapistPayoutAmount', 0] },
            0
          ]
        }
      }
    }
  }
]);
```

**Calculates:**
- `totalSessionsCompleted`: Count of completed bookings
- `totalEarnings`: Sum of therapistPayoutAmount for completed bookings

#### STEP 2: Average Rating Calculation

```javascript
const reviewSummary = await ReviewModel.aggregate([
  { $match: { therapist: therapist._id } },
  {
    $group: {
      _id: null,
      averageRating: { $avg: '$rating' },
      totalReviews: { $sum: 1 }
    }
  }
]);
```

**Calculates:**
- `averageRating`: Mean of all ratings
- `totalReviews`: Total review count

#### STEP 3: Monthly Earnings Trend

```javascript
const monthlyEarningsData = await BookingModel.aggregate([
  { $match: { 
      therapist: therapist._id,
      status: BookingStatus.Completed
    } 
  },
  {
    $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' }
      },
      earnings: {
        $sum: { $ifNull: ['$therapistPayoutAmount', 0] }
      }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  {
    $project: {
      _id: 0,
      month: {
        $concat: [
          { $toString: '$_id.year' },
          '-',
          { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
          { $toString: '$_id.month' }
        ]
      },
      earnings: 1
    }
  }
]);
```

**Output Format:**
```json
[
  { "month": "2026-01", "earnings": 25000 },
  { "month": "2026-02", "earnings": 32000 }
]
```

#### STEP 4: Completed Sessions Per Month

```javascript
const monthlySessionsData = await BookingModel.aggregate([
  { $match: { 
      therapist: therapist._id,
      status: BookingStatus.Completed
    } 
  },
  {
    $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' }
      },
      sessions: { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  {
    $project: {
      _id: 0,
      month: /* YYYY-MM format */,
      sessions: 1
    }
  }
]);
```

**Output Format:**
```json
[
  { "month": "2026-01", "sessions": 18 },
  { "month": "2026-02", "sessions": 24 }
]
```

#### STEP 5: Rating Trend Per Month

```javascript
const monthlyRatingsData = await ReviewModel.aggregate([
  { $match: { therapist: therapist._id } },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      avgRating: { $avg: '$rating' },
      reviewCount: { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  {
    $project: {
      _id: 0,
      month: /* YYYY-MM format */,
      avgRating: { $round: ['$avgRating', 2] },
      reviewCount: 1
    }
  }
]);
```

**Output Format:**
```json
[
  { "month": "2026-01", "avgRating": 4.5, "reviewCount": 8 }
]
```

#### STEP 6: Service Distribution

```javascript
const serviceDistributionData = await BookingModel.aggregate([
  { $match: { 
      therapist: therapist._id,
      status: BookingStatus.Completed
    } 
  },
  {
    $lookup: {
      from: 'services',
      localField: 'service',
      foreignField: '_id',
      as: 'serviceInfo'
    }
  },
  { $unwind: '$serviceInfo' },
  {
    $group: {
      _id: '$serviceInfo.name',
      totalSessions: { $sum: 1 }
    }
  },
  { $sort: { totalSessions: -1 } },
  {
    $project: {
      _id: 0,
      serviceName: '$_id',
      totalSessions: 1
    }
  }
]);
```

**Output Format:**
```json
[
  { "serviceName": "Deep Tissue Massage", "totalSessions": 12 },
  { "serviceName": "Swedish Massage", "totalSessions": 8 }
]
```

#### STEP 7: Monthly Reviews Count

```javascript
const monthlyReviewCountData = await ReviewModel.aggregate([
  { $match: { therapist: therapist._id } },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      reviewCount: { $sum: 1 }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  {
    $project: {
      _id: 0,
      month: /* YYYY-MM format */,
      reviewCount: 1
    }
  }
]);
```

**Output Format:**
```json
[
  { "month": "2026-01", "reviewCount": 8 },
  { "month": "2026-02", "reviewCount": 12 }
]
```

### Final API Response

```json
{
  "success": true,
  "data": {
    "totalSessionsCompleted": 45,
    "totalEarnings": 4500.00,
    "averageRating": 4.7,
    "monthlyBonusEarned": 0,
    "monthlyEarnings": [
      { "month": "2026-01", "earnings": 2500 }
    ],
    "monthlySessions": [
      { "month": "2026-01", "sessions": 18 }
    ],
    "monthlyRatings": [
      { "month": "2026-01", "avgRating": 4.5 }
    ],
    "serviceDistribution": [
      { "serviceName": "Deep Tissue Massage", "totalSessions": 12 }
    ],
    "monthlyReviewCount": [
      { "month": "2026-01", "reviewCount": 8 }
    ]
  }
}
```

**Error Handling:**
- Returns `0` instead of `null` for empty data
- Handles missing therapist profile (404)
- Catches MongoDB aggregation errors
- Validates JWT token before processing

---

## 🎨 Frontend Implementation

### Component Structure

**File:** `app/dashboard/therapist/analytics/page.tsx`

### Interface Definition

```typescript
interface AnalyticsData {
  totalSessionsCompleted: number;
  totalEarnings: number;
  averageRating: number;
  monthlyBonusEarned: number;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
  monthlySessions: Array<{ month: string; sessions: number }>;
  monthlyRatings: Array<{ month: string; avgRating: number }>;
  serviceDistribution: Array<{ serviceName: string; totalSessions: number }>;
  monthlyReviewCount: Array<{ month: string; reviewCount: number }>;
}
```

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
      setLoading(true);
      setError(null);
      
      const response = await therapistApi.getAnalytics();
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.error || 'Failed to load analytics');
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Network error...');
    } finally {
      setLoading(false);
    }
  };

  fetchAnalytics();
}, []);
```

### UI Components

#### StatCard Component

```typescript
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color,
  prefix,
  precision = 0
}) => (
  <Card>
    <Space align="start" size="large">
      <div style={{ 
        backgroundColor: color, 
        borderRadius: '50%', 
        width: 56, 
        height: 56, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <Text type="secondary">{title}</Text>
        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
          {prefix && <span>{prefix}</span>}
          {typeof value === 'number' ? value.toFixed(precision) : value}
        </div>
      </div>
    </Space>
  </Card>
);
```

### Chart Implementations

#### 1. Monthly Earnings Trend (Line Chart)

```tsx
<ResponsiveContainer>
  <LineChart data={analytics.monthlyEarnings}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom' }} />
    <YAxis 
      tickFormatter={(value) => `$${value.toFixed(0)}`}
      label={{ value: 'Earnings ($)', angle: -90 }}
    />
    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Earnings']} />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="earnings" 
      stroke="#667eea" 
      strokeWidth={3}
      dot={{ fill: '#667eea', r: 6 }}
    />
  </LineChart>
</ResponsiveContainer>
```

#### 2. Completed Sessions Per Month (Bar Chart)

```tsx
<ResponsiveContainer>
  <BarChart data={analytics.monthlySessions}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom' }} />
    <YAxis allowDecimals={false} label={{ value: 'Sessions', angle: -90 }} />
    <Tooltip />
    <Legend />
    <Bar dataKey="sessions" fill="#43e97b" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

#### 3. Rating Trend Per Month (Line Chart)

```tsx
<ResponsiveContainer>
  <LineChart data={analytics.monthlyRatings}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom' }} />
    <YAxis domain={[0, 5]} label={{ value: 'Average Rating', angle: -90 }} />
    <Tooltip formatter={(value) => [value.toFixed(2), 'Avg Rating']} />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="avgRating" 
      stroke="#faad14" 
      strokeWidth={3}
    />
  </LineChart>
</ResponsiveContainer>
```

#### 4. Service Distribution (Pie Chart)

```tsx
<ResponsiveContainer>
  <PieChart>
    <Pie
      data={analytics.serviceDistribution}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={(entry) => `${entry.serviceName}: ${(entry.percent * 100).toFixed(0)}%`}
      outerRadius={120}
      dataKey="totalSessions"
    >
      {analytics.serviceDistribution.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

**Service Legend Display:**

```tsx
<div style={{ marginTop: '24px' }}>
  <Title level={5}>Service Breakdown</Title>
  <Space direction="vertical" size="small">
    {analytics.serviceDistribution.map((service, index) => {
      const percentage = ((service.totalSessions / totalSessions) * 100).toFixed(1);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
            borderRadius: '4px'
          }} />
          <Text strong>{service.serviceName}</Text>
          <Text type="secondary">– {service.totalSessions} sessions</Text>
          <Text type="secondary">({percent}%)</Text>
        </div>
      );
    })}
  </Space>
</div>
```

#### 5. Monthly Reviews Count (Bar Chart)

```tsx
<ResponsiveContainer>
  <BarChart data={analytics.monthlyReviewCount}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom' }} />
    <YAxis allowDecimals={false} label={{ value: 'Reviews', angle: -90 }} />
    <Tooltip />
    <Legend />
    <Bar dataKey="reviewCount" fill="#13c2c2" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### State Handling

#### Loading State

```tsx
if (loading) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          background: '#fff', 
          padding: '40px', 
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '24px' }}>
            <Text>Loading your analytics...</Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
```

#### Error State

```tsx
if (error) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '40px' }}>
        <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      </Content>
    </Layout>
  );
}
```

#### Empty State

```tsx
if (!analytics || analytics.totalSessionsCompleted === 0) {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '40px' }}>
        <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Empty 
            description="No analytics data available yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              Start accepting bookings to see your practice analytics here!
            </Text>
          </Empty>
        </Card>
      </Content>
    </Layout>
  );
}
```

---

## 📁 Files Created/Modified

### New Files
1. ✅ `app/api/therapist/analytics/route.ts` - Complete API endpoint with 7 aggregation pipelines
2. ✅ `app/dashboard/therapist/analytics/page.tsx` - Full analytics dashboard component
3. ✅ `test-therapist-analytics.js` - Testing script for validation
4. ✅ `THERAPIST_ANALYTICS_IMPLEMENTATION.md` - This comprehensive documentation

### Modified Files
1. ✅ `app/utils/apiUtils.ts` - Added `getAnalytics()` method to therapistApi
2. ✅ `app/dashboard/therapist/page.tsx` - Added Analytics menu item and tab

---

## 🧪 Testing

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   cd wellness-app
   npm run dev
   ```

2. **Login as Therapist**
   - Navigate to `/dashboard/therapist`
   - Verify therapist role authentication

3. **Access Analytics Tab**
   - Click "Analytics" in sidebar (key: '7')
   - OR navigate to `/dashboard/therapist/analytics`

4. **Verify Charts Render**
   - ✓ Summary cards display correct values
   - ✓ Monthly Earnings Trend line chart
   - ✓ Completed Sessions Per Month bar chart
   - ✓ Rating Trend Per Month line chart
   - ✓ Service Distribution pie chart with legend
   - ✓ Monthly Reviews Count bar chart

5. **Test Empty State**
   - Create new therapist without bookings
   - Verify "No analytics data available yet" message

6. **Test Error Handling**
   - Remove auth token
   - Verify authentication error message

### Automated Test Script

Run the test script:
```bash
node test-therapist-analytics.js
```

**What it tests:**
- Connects to MongoDB
- Finds a therapist with bookings
- Calculates expected analytics manually
- Compares with API response structure
- Provides testing instructions

---

## 🔒 Security Considerations

### Authentication
- ✅ JWT token required in Authorization header
- ✅ Token verification using `jsonwebtoken` library
- ✅ Token expiration handling
- ✅ Invalid token returns 401

### Authorization
- ✅ Role-based access control (therapist only)
- ✅ User role validation (`decoded.role.toLowerCase() !== 'therapist'`)
- ✅ Access denied returns 403

### Data Isolation
- ✅ Each therapist sees only their own data
- ✅ Therapist ID extracted from authenticated user
- ✅ No cross-therapist data leakage
- ✅ MongoDB queries scoped to therapist._id

### Error Handling
- ✅ Generic error messages (no internal details exposed)
- ✅ Proper HTTP status codes (401, 403, 404, 500)
- ✅ Try-catch blocks on all async operations
- ✅ Database connection error handling

---

## 🚀 Performance Optimizations

### Database
- ✅ Single MongoDB aggregation pipeline per metric
- ✅ Indexed fields (therapist, date, status)
- ✅ Efficient $match stages (filter early)
- ✅ Minimal data transfer (only required fields)

### Frontend
- ✅ Single API call fetches all analytics
- ✅ Client-side state management
- ✅ Conditional rendering based on data availability
- ✅ Responsive container for chart lazy loading

### Network
- ✅ RESTful API design
- ✅ JSON response format
- ✅ Compressed data payload
- ✅ No redundant API calls

---

## 📱 Responsive Design

### Breakpoints
- **xs**: < 576px (mobile)
- **sm**: ≥ 576px (tablet)
- **md**: ≥ 768px (desktop)
- **lg**: ≥ 992px (large desktop)

### Grid Layout
```tsx
<Col xs={24} sm={12} lg={6}>
  <StatCard ... />
</Col>
```

**Behavior:**
- Mobile: 1 card per row (full width)
- Tablet: 2 cards per row (50% width)
- Desktop: 4 cards per row (25% width)

### Chart Responsiveness
- All charts use `<ResponsiveContainer>`
- Automatic resizing on window change
- Maintains aspect ratio
- Touch-friendly on mobile

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- Purple-Blue: #667eea (Earnings)
- Green: #43e97b (Sessions)
- Yellow-Orange: #faad14 (Rating)
- Pink: #f093fb (Bonus)
- Cyan: #13c2c2 (Reviews)

**Chart Color Palette (10 colors):**
```typescript
const CHART_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#43e97b', '#fa8bfd',
  '#faad14', '#13c2c2', '#eb2f96', '#52c41a', '#1890ff'
];
```

### Typography
- **Titles**: Ant Design Title component (level 2, 4, 5)
- **Body**: Ant Design Text component with type hierarchy
- **Numbers**: 28px bold for stats, 20px for prefixes

### Spacing
- Card gutter: 16px (small), 24px (large)
- Section margin: 24px bottom
- Page padding: 24px

---

## ⚠️ Important Notes

### Data Requirements
- **Completed bookings only**: Earnings and sessions use `status === 'completed'`
- **All reviews included**: Ratings use all reviews regardless of booking status
- **Month format**: YYYY-MM (e.g., "2026-01")
- **Currency format**: 2 decimal places with $ prefix
- **Rating format**: 1 decimal place (0-5 scale)

### Null Safety
- Defensive formatting: `(value || 0).toFixed(2)`
- Prevents "Cannot read properties of null" errors
- Default to 0 for missing data
- Empty arrays for missing trends

### Missing Features
- **Monthly Bonus**: Placeholder ($0.00) - no Bonus model exists
- If bonus system added later, update aggregation pipeline

### Known Limitations
- No date range filter (shows all-time data)
- No export functionality (PDF/CSV)
- No real-time updates (requires page refresh)
- No comparison metrics (month-over-month, etc.)

---

## 🔮 Future Enhancements

### Suggested Additions

1. **Date Range Filter**
   - Last 30 days
   - Last quarter
   - Custom date range picker

2. **Export Functionality**
   - Download PDF report
   - Export CSV data
   - Email analytics summary

3. **Advanced Metrics**
   - Customer retention rate
   - Peak hours analysis
   - Revenue per service category
   - Cancellation rate tracking
   - No-show statistics

4. **Comparative Analytics**
   - Month-over-month growth (%)
   - Year-over-year comparison
   - Performance vs. platform averages

5. **Real-time Updates**
   - WebSocket integration
   - Auto-refresh every 5 minutes
   - Push notifications for milestones

6. **Interactive Features**
   - Drill-down on charts (click to see details)
   - Hover tooltips with more context
   - Zoom and pan on time-series charts

7. **Bonus System Integration**
   - Create Bonus model
   - Track monthly bonuses
   - Display bonus breakdown chart

---

## 📊 Summary

The Therapist Analytics feature is a **complete, production-ready implementation** providing therapists with comprehensive insights into their practice performance through:

✅ **Secure API** - JWT authentication, role-based access  
✅ **Efficient Database** - 7 MongoDB aggregation pipelines  
✅ **Beautiful UI** - Professional SaaS-style design  
✅ **Interactive Charts** - 6 Recharts visualizations  
✅ **Responsive Layout** - Mobile, tablet, desktop support  
✅ **Error Handling** - Graceful empty/error states  
✅ **Type Safety** - TypeScript interfaces  
✅ **Best Practices** - Clean code, proper separation  

**Result:** Therapists can now track earnings, monitor session volume, analyze service popularity, and observe rating trends - all in one beautiful dashboard.

---

## 📞 Support

For questions or issues:
1. Check this documentation first
2. Review API response format
3. Inspect browser console for errors
4. Verify MongoDB data integrity
5. Test with test script provided

**Happy Analytics! 📈**
