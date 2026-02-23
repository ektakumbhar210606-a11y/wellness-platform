# Therapist Reviews API Endpoint Implementation

## Overview
This document describes the implementation of the GET /api/therapist/reviews endpoint that allows therapists to view all reviews given to them.

## API Endpoint Details

### Route
```
GET /api/therapist/reviews
```

### Authentication
- Requires therapist authentication via JWT token
- Uses `requireTherapistAuth` middleware
- Validates that the authenticated user has the 'therapist' role

### Purpose
Allow therapists to view all reviews given to them by customers.

### Filter
- `therapist = logged-in therapist ID` (automatically filtered by authentication)

### Sort
- Newest first (by `createdAt` field, descending)

### Response Format

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "rating": 5,
        "comment": "Excellent service!",
        "customerName": "John Doe",
        "serviceName": "Swedish Massage",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "therapist": {
      "averageRating": 4.8,
      "totalReviews": 25
    }
  }
}
```

## Implementation Files

### 1. Backend Route
**File:** `app/api/therapist/reviews/route.ts`

**Key Features:**
- Authentication using `requireTherapistAuth` middleware
- Fetches therapist profile to get therapist ID
- Queries Review model filtered by therapist ID
- Populates customer name from User model
- Populates service name from Service model
- Sorts results by createdAt descending (newest first)
- Returns formatted review data with therapist statistics

**Data Transformation:**
- Maps customer reference to customer name
- Maps service reference to service name
- Formats response to match required structure
- Includes therapist's average rating and total reviews count

### 2. Frontend Component
**File:** `app/components/TherapistReviews.tsx`

**Key Features:**
- Fetches reviews using authenticated API call
- Displays loading state while fetching
- Shows error state with retry option
- Displays therapist statistics (average rating, total reviews)
- Lists all reviews with:
  - Star rating display
  - Customer comment (if provided)
  - Customer name
  - Service name
  - Review date
- Pagination support (5 reviews per page, configurable)
- Empty state when no reviews exist

### 3. Dashboard Integration
**File:** `app/dashboard/therapist/page.tsx`

**Changes Made:**
- Imported `TherapistReviews` component
- Updated reviews menu item to set active tab
- Added reviews tab to the main Tabs component
- Integrated reviews component into the dashboard layout

## Data Flow

1. **Authentication:** Therapist logs in and receives JWT token
2. **API Request:** Frontend makes GET request to `/api/therapist/reviews` with Authorization header
3. **Middleware:** `requireTherapistAuth` validates token and role
4. **Data Fetch:** Server queries Review collection for therapist's reviews
5. **Population:** Customer and Service data populated from related collections
6. **Sorting:** Results sorted by createdAt descending
7. **Transformation:** Data formatted to match frontend requirements
8. **Response:** JSON response with reviews array and therapist statistics
9. **Display:** Frontend component renders reviews with statistics

## Security Features

- **Authentication Required:** Only authenticated therapists can access
- **Role Validation:** Ensures user has 'therapist' role
- **Data Isolation:** Therapists can only see their own reviews
- **Token Validation:** JWT token verification with expiration checking

## Error Handling

The API handles various error scenarios:
- Invalid or missing authentication token (401)
- User not found (404)
- Therapist profile not found (404)
- Database connection errors (500)
- General server errors (500)

## Testing

A test script is provided at `test-therapist-reviews-api.js` to verify:
- Database connection
- Therapist data retrieval
- Review data structure
- API endpoint logic simulation

## Usage Example

```javascript
// Frontend usage
const fetchReviews = async () => {
  try {
    const response = await makeAuthenticatedRequest('/api/therapist/reviews');
    if (response.success) {
      setReviews(response.data.reviews);
      setStats(response.data.therapist);
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }
};
```

## Future Enhancements

Potential improvements that could be added:
- Filtering by date range
- Filtering by rating (e.g., 5-star only)
- Search functionality within reviews
- Export reviews to CSV/PDF
- Review response functionality for therapists
- Review analytics and trends