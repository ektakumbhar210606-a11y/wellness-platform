# Business Reviews API Endpoint

## Overview
This document describes the implementation of the GET /api/business/reviews endpoint that allows businesses to monitor all reviews for their associated therapists.

## API Endpoint Details

### Route
```
GET /api/business/reviews
```

### Authentication
- Requires business authentication via JWT token
- Uses `requireBusinessAuth` middleware
- Validates that the authenticated user has the 'business' role

### Purpose
Allow businesses to monitor all therapist reviews for therapists associated with their business.

### Query Parameters
- `therapistId` (optional): Filter reviews for a specific therapist

### Filter
- Reviews from therapists associated with the authenticated business
- Optional filter by specific therapistId

### Sort
- Newest first (by `createdAt` field, descending)

### Response Format

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "therapistName": "John Smith",
        "customerName": "Jane Doe",
        "serviceName": "Swedish Massage",
        "rating": 5,
        "comment": "Excellent service!",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalCount": 25
  }
}
```

## Implementation Details

### File Location
`app/api/business/reviews/route.ts`

### Key Features
1. **Authentication**: Uses business-specific authentication middleware
2. **Authorization**: Verifies business ownership and therapist associations
3. **Filtering**: 
   - Automatically filters reviews to only those from therapists associated with the business
   - Optional `therapistId` parameter for specific therapist filtering
4. **Data Population**: 
   - Populates therapist names (from fullName or user firstName/lastName)
   - Populates customer names (from firstName/lastName)
   - Populates service names
5. **Sorting**: Returns reviews sorted by createdAt descending (newest first)
6. **Validation**: 
   - Validates therapistId format if provided
   - Verifies therapist association with business
   - Handles edge cases (no therapists, no reviews)

### Security Features
- **Role-based Access**: Only authenticated business users can access
- **Data Isolation**: Businesses can only see reviews from their associated therapists
- **Therapist Verification**: When filtering by therapistId, verifies the therapist is approved for the business
- **Token Validation**: JWT token verification with expiration checking

### Error Handling
The API handles various error scenarios:
- Invalid or missing authentication token (401)
- User not found (404)
- Business profile not found (404)
- Invalid therapist ID format (400)
- Therapist not found (404)
- Therapist not approved for business (403)
- Database connection errors (500)
- General server errors (500)

## Usage Examples

### Get All Reviews for Business
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/business/reviews
```

### Get Reviews for Specific Therapist
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/business/reviews?therapistId=507f1f77bcf86cd799439011"
```

### Frontend Usage Example
```javascript
// Get all reviews
const fetchAllReviews = async () => {
  try {
    const response = await fetch('/api/business/reviews', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      console.log(`Found ${data.data.totalCount} reviews`);
      setReviews(data.data.reviews);
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }
};

// Get reviews for specific therapist
const fetchTherapistReviews = async (therapistId) => {
  try {
    const response = await fetch(`/api/business/reviews?therapistId=${therapistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      setReviews(data.data.reviews);
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }
};
```

## Data Flow

1. **Authentication**: Business user logs in and receives JWT token
2. **API Request**: Frontend makes GET request to `/api/business/reviews` with Authorization header
3. **Middleware**: `requireBusinessAuth` validates token and role
4. **Business Verification**: Server finds business owned by authenticated user
5. **Therapist Association**: Server gets list of approved therapists for the business
6. **Review Query**: Server queries Review collection for reviews from associated therapists
7. **Optional Filtering**: If therapistId provided, applies additional filter and validation
8. **Population**: Populates therapist, customer, and service names from related collections
9. **Sorting**: Results sorted by createdAt descending
10. **Transformation**: Data formatted to match required response structure
11. **Response**: JSON response with reviews array and total count

## Response Fields

### Review Object
- `therapistName`: Full name of the therapist
- `customerName`: Full name of the customer
- `serviceName`: Name of the service
- `rating`: Review rating (1-5)
- `comment`: Review comment (if provided)
- `createdAt`: Review creation date

### Response Metadata
- `totalCount`: Total number of reviews returned

## Future Enhancements

Potential improvements that could be added:
- Pagination support (limit/skip parameters)
- Date range filtering
- Rating-based filtering (e.g., 5-star only)
- Search functionality within reviews
- Review analytics and trends
- Export reviews to CSV/PDF
- Review response functionality for businesses