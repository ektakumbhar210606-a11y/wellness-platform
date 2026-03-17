# Customer Cancellation Analytics Implementation

## Overview
This document describes the implementation of cancellation analytics for the customer analytics dashboard, specifically tracking **therapist-initiated cancellations**.

## Features Implemented

### 1. Monthly Cancellation Trend Chart
- **Location**: Customer Analytics Dashboard (`/dashboard/customer/analytics`)
- **Chart Type**: Line Chart
- **Data Source**: `/api/customer/analytics` endpoint
- **Displays**: Month-by-month trend of cancellations initiated by therapists
- **Section**: Section 7 in the analytics page

### 2. Cancellation Reasons Breakdown
- **Location**: Customer Analytics Dashboard (`/dashboard/customer/analytics`)
- **Chart Type**: Pie Chart with Data Table
- **Data Source**: `/api/customer/analytics` endpoint
- **Displays**: Distribution of reasons why therapists cancelled bookings
- **Section**: Section 8 in the analytics page

## Backend Changes

### File: `app/api/customer/analytics/route.ts`

#### Changes Made:
1. **Updated MongoDB Aggregation Pipeline** (Lines 156-168)
   - Added `month` field to bookingDetails for monthly trend calculation
   - Added `cancelRequest`, `therapistCancelReason`, and `businessCancelReason` fields
   - Removed unused `cancellationData` field

2. **Enhanced Cancellation Analytics Logic** (Lines 250-296)
   - **Therapist-Initiated Focus**: Now specifically tracks cancellations where `therapistCancelReason` exists
   - **Monthly Trend Calculation**: Groups therapist cancellations by month
   - **Reason Extraction**: Uses only `therapistCancelReason` field (not generic `cancelRequest.reason`)
   - **Cancellation Rate**: Calculated based on therapist-initiated cancellations only

#### Key Code Changes:

```typescript
// Track therapist-initiated cancellations specifically
const therapistCancelledBookings = result.bookingDetails.filter((detail: any) => 
  detail.status === 'cancelled' && detail.therapistCancelReason
).length;

// Monthly cancellation trend - therapist-initiated only
result.bookingDetails.forEach((item: any) => {
  // Only count cancellations where therapist initiated (has therapistCancelReason)
  if (item.status === 'cancelled' && item.therapistCancelReason) {
    const current = monthlyCancellationMap.get(item.month) || 0;
    monthlyCancellationMap.set(item.month, current + 1);
  }
});

// Cancellation reasons breakdown - specifically from therapistCancelReason field
if (item.status === 'cancelled' && item.therapistCancelReason) {
  const reason = item.therapistCancelReason;
  const current = reasonCountMap.get(reason) || 0;
  reasonCountMap.set(reason, current + 1);
}
```

## Frontend Implementation

### File: `app/dashboard/customer/analytics/page.tsx`

The frontend already had the necessary chart components implemented:

#### Section 7: Monthly Cancellation Trend (Lines 545-588)
```tsx
<LineChart data={analytics.monthlyCancellations}>
  <XAxis dataKey="month" />
  <YAxis label={{ value: 'Number of Cancellations' }} />
  <Line dataKey="count" stroke="#ff4d4f" />
</LineChart>
```

#### Section 8: Cancellation Reasons (Lines 590-663)
```tsx
<PieChart data={analytics.cancellationReasons}>
  <Pie dataKey="count" label={(entry) => `${entry.reason}: ${(entry.percent * 100).toFixed(0)}%`} />
</PieChart>

{/* Plus a detailed breakdown table */}
```

## Data Flow

1. **Customer visits analytics page** → Frontend calls `/api/customer/analytics`
2. **Backend processes request**:
   - Authenticates customer user
   - Retrieves all bookings for that customer
   - Filters for therapist-initiated cancellations (where `therapistCancelReason` exists)
   - Aggregates monthly trends
   - Groups cancellation reasons
3. **Frontend displays data**:
   - Renders line chart for monthly trends
   - Renders pie chart for reason distribution
   - Shows detailed breakdown table

## API Response Structure

```json
{
  "totalBookings": 25,
  "totalCompletedBookings": 20,
  "totalSpent": 15000,
  "cancelledBookings": 5,
  "cancellationRate": 20.0,
  "monthlyCancellations": [
    { "month": "2024-01", "count": 2 },
    { "month": "2024-02", "count": 1 },
    { "month": "2024-03", "count": 2 }
  ],
  "cancellationReasons": [
    { "reason": "Emergency", "count": 2 },
    { "reason": "Illness", "count": 2 },
    { "reason": "Schedule Conflict", "count": 1 }
  ]
}
```

## Testing

### Manual Test Steps:
1. Start the development server: `npm run dev`
2. Log in as a customer
3. Navigate to `/dashboard/customer/analytics`
4. Verify both cancellation charts display correctly

### Automated Test:
Run the test script:
```bash
node test-customer-cancellation-analytics.js
```

Set environment variable first:
```bash
set TEST_CUSTOMER_TOKEN=your_jwt_token_here
node test-customer-cancellation-analytics.js
```

## Key Differences from Previous Implementation

| Aspect | Before | After |
|--------|--------|-------|
| **Data Source** | Used `cancelRequest.reason` | Uses `therapistCancelReason` |
| **Scope** | All cancellations | Only therapist-initiated cancellations |
| **Accuracy** | Mixed reasons (customer + therapist) | Specific to therapist actions |
| **Rate Calculation** | Based on all cancellations | Based on therapist cancellations only |

## Benefits

1. **Accurate Tracking**: Customers can see when therapists cancel their bookings
2. **Transparency**: Clear visibility into therapist cancellation patterns
3. **Actionable Insights**: Understand common reasons for therapist cancellations
4. **Data-Driven**: Helps customers make informed booking decisions

## Empty States

Both charts handle cases with no cancellation data:
- **No cancellations**: Shows "No cancellation data available" message
- **No therapist cancellations**: Charts remain empty (correct behavior)

## Future Enhancements

Potential improvements for future iterations:
1. Add filter to view all cancellations vs. therapist-only
2. Compare therapist cancellation rate with platform average
3. Show therapist response time to cancellation requests
4. Add notification preferences for cancellations

## Related Files

- **Backend API**: `wellness-app/app/api/customer/analytics/route.ts`
- **Frontend Page**: `wellness-app/app/dashboard/customer/analytics/page.tsx`
- **Test Script**: `wellness-app/test-customer-cancellation-analytics.js`
- **Booking Model**: `wellness-app/models/Booking.ts` (defines `therapistCancelReason` field)

## Implementation Date
March 16, 2026

## Status
✅ **Complete** - Ready for testing and deployment
