# Business Therapist Cancellation Stats API - Documentation

## Overview
New API endpoint for Business Dashboard to retrieve cancellation statistics for all therapists associated with the business.

## API Endpoint

```
GET /api/business/therapist-cancellation-stats
```

## Authentication
**Required**: Yes  
**Role**: Business or Provider  
**Header**: `Authorization: Bearer <business_jwt_token>`

## Implementation Details

### Files Created
1. ✅ `wellness-app/app/api/business/therapist-cancellation-stats/route.ts` - API endpoint
2. ✅ `test-business-cancellation-stats.js` - Test script
3. ✅ `BUSINESS_THERAPIST_CANCELLATION_STATS_API.md` - This documentation

### Logic Flow

```javascript
// Step 1: Authenticate business user
const authResult = await requireBusinessAuth(req);

// Step 2: Find business owned by user
const business = await BusinessModel.findOne({ owner: decoded.id });

// Step 3: Find all approved therapists linked to business
const therapists = await TherapistModel.find({
  'associatedBusinesses.businessId': business._id,
  'associatedBusinesses.status': 'approved'
}).populate('user', 'firstName lastName');

// Step 4: Calculate statistics for each therapist
const stats = await Promise.all(
  therapists.map(async (therapist) => {
    const completedBookings = await BookingModel.countDocuments({
      therapist: therapist._id,
      status: BookingStatus.Completed
    });

    return {
      therapistName: therapist.fullName || user.name,
      completedBookings,
      monthlyCancelCount: therapist.monthlyCancelCount || 0,
      totalCancelCount: therapist.totalCancelCount || 0,
      cancelWarnings: therapist.cancelWarnings || 0,
      bonusPenaltyPercentage: therapist.bonusPenaltyPercentage || 0
    };
  })
);

// Step 5: Return statistics array
return Response.json({ success: true, data: stats });
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Therapist cancellation statistics retrieved successfully",
  "data": [
    {
      "therapistName": "Rahul Kumar",
      "completedBookings": 32,
      "monthlyCancelCount": 2,
      "totalCancelCount": 10,
      "cancelWarnings": 0,
      "bonusPenaltyPercentage": 0
    },
    {
      "therapistName": "Meera Sharma",
      "completedBookings": 25,
      "monthlyCancelCount": 5,
      "totalCancelCount": 15,
      "cancelWarnings": 1,
      "bonusPenaltyPercentage": 10
    }
  ]
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "error": "Authentication token required"
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "error": "Access denied. Business or Provider role required"
}
```

**404 Not Found** - Business profile doesn't exist
```json
{
  "success": false,
  "error": "Business profile not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Response Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `therapistName` | String | Full name of the therapist |
| `completedBookings` | Number | Total number of completed bookings by this therapist |
| `monthlyCancelCount` | Number | Cancellations in current month (resets monthly) |
| `totalCancelCount` | Number | Lifetime cancellations by this therapist |
| `cancelWarnings` | Number | Warning flag (0 = no warning, 1 = warned) |
| `bonusPenaltyPercentage` | Number | Bonus penalty applied (0-100%) |

## Penalty Reference

Based on `monthlyCancelCount`:

| Monthly Cancels | Warning | Bonus Penalty |
|----------------|---------|---------------|
| 0-2 | No | 0% |
| 3-4 | Yes | 0% |
| 5 | Yes | 10% |
| 6 | Yes | 25% |
| 7+ | Yes | 100% |

## Usage Examples

### JavaScript/Fetch
```javascript
const response = await fetch('/api/business/therapist-cancellation-stats', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of therapist stats
```

### React Component Example
```tsx
import { useEffect, useState } from 'react';

function TherapistStatsDashboard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/therapist-cancellation-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setStats(result.data);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {stats.map((stat, idx) => (
        <div key={idx}>
          <h3>{stat.therapistName}</h3>
          <p>Completed: {stat.completedBookings}</p>
          <p>Monthly Cancels: {stat.monthlyCancelCount}</p>
          <p>Bonus Penalty: {stat.bonusPenaltyPercentage}%</p>
        </div>
      ))}
    </div>
  );
}
```

### cURL
```bash
curl -X GET http://localhost:3000/api/business/therapist-cancellation-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

### Using the Test Script

Run the provided test script:
```bash
node test-business-cancellation-stats.js
```

The script will:
1. Connect to MongoDB
2. Find a business user
3. Retrieve all approved therapists
4. Calculate statistics
5. Display formatted results

### Manual Testing Steps

1. **Setup**: Ensure you have:
   - A business account with associated therapists
   - Some therapists with cancellation data
   - Completed bookings in the database

2. **Get Business Token**: Login as business user and get JWT token

3. **Make Request**:
   ```bash
   curl -X GET http://localhost:3000/api/business/therapist-cancellation-stats \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Verify Response**: Check that response matches expected format

## Database Queries Used

### Find Business
```javascript
const business = await BusinessModel.findOne({ owner: decoded.id });
```

### Find Approved Therapists
```javascript
const therapists = await TherapistModel.find({
  'associatedBusinesses.businessId': business._id,
  'associatedBusinesses.status': 'approved'
}).populate('user', 'firstName lastName');
```

### Count Completed Bookings
```javascript
const completedBookings = await BookingModel.countDocuments({
  therapist: therapist._id,
  status: BookingStatus.Completed
});
```

## Performance Considerations

### Optimization Strategies

1. **Indexing**: The following indexes are used:
   - `TherapistModel`: `associatedBusinesses.businessId`, `associatedBusinesses.status`
   - `BookingModel`: `therapist`, `status`

2. **Parallel Processing**: Uses `Promise.all()` to calculate stats concurrently

3. **Lean Queries**: Could add `.lean()` for faster reads if no document methods needed

4. **Pagination**: For businesses with many therapists, consider adding pagination:
   ```javascript
   const page = parseInt(req.searchParams.get('page')) || 1;
   const limit = parseInt(req.searchParams.get('limit')) || 10;
   const skip = (page - 1) * limit;
   ```

## Security Features

✅ **Authentication Required**: Only authenticated business users can access  
✅ **Authorization**: Verifies user owns the business  
✅ **Data Isolation**: Each business only sees their own therapists  
✅ **Read-Only**: GET endpoint - no data modification  

## Compatibility

### Existing APIs Unaffected
- ✅ No changes to booking APIs
- ✅ No changes to therapist APIs
- ✅ No changes to authentication flow
- ✅ No breaking changes to existing endpoints

### Dependencies
- Uses existing models: `Business`, `Therapist`, `Booking`, `User`
- Uses existing authentication middleware pattern
- Compatible with Next.js App Router

## Frontend Integration

### Dashboard UI Suggestions

#### Table View
```tsx
<table>
  <thead>
    <tr>
      <th>Therapist</th>
      <th>Completed</th>
      <th>Monthly Cancels</th>
      <th>Warnings</th>
      <th>Penalty %</th>
    </tr>
  </thead>
  <tbody>
    {stats.map(stat => (
      <tr key={stat.therapistName}>
        <td>{stat.therapistName}</td>
        <td>{stat.completedBookings}</td>
        <td>{stat.monthlyCancelCount}</td>
        <td>{stat.cancelWarnings ? '⚠️' : '✓'}</td>
        <td>{stat.bonusPenaltyPercentage}%</td>
      </tr>
    ))}
  </tbody>
</table>
```

#### Visual Indicators
- 🟢 Green: 0-2 cancellations (no penalty)
- 🟡 Yellow: 3-4 cancellations (warning only)
- 🟠 Orange: 5-6 cancellations (10-25% penalty)
- 🔴 Red: 7+ cancellations (100% penalty)

## Troubleshooting

### Issue: Empty array returned
**Solution**: Ensure business has approved therapists

### Issue: 404 Business not found
**Solution**: Verify user has a business profile created

### Issue: 403 Access denied
**Solution**: Check user role is 'business' or 'Provider'

### Issue: High latency
**Solution**: Add database indexes on frequently queried fields

---

**Created**: March 12, 2026  
**Status**: ✅ Ready for Production  
**Version**: 1.0
