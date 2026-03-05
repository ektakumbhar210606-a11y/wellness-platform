# Customer Reward and Discount System - Complete Documentation

## 🎯 Overview

A comprehensive reward system that allows customers to earn points by submitting reviews and unlock discounts when they reach maximum points. Built with MERN stack following MVC architecture.

---

## 📁 Project Structure

```
wellness-app/
├── models/
│   ├── User.js              # User schema with reward points & history
│   ├── Review.js            # Review schema with duplicate prevention
│   └── Booking.js           # Booking schema with discount tracking
├── controllers/
│   ├── reviewController.js  # Review submission & reward logic
│   ├── rewardController.js  # Reward information endpoints
│   ├── bookingController.js # Booking creation with discount application
│   └── adminController.js   # Admin analytics endpoint
├── routes/
│   ├── reviewRoutes.js      # Review API routes
│   ├── rewardRoutes.js      # Reward API routes
│   ├── bookingRoutes.js     # Booking API routes
│   └── adminRoutes.js       # Admin API routes
├── utils/
│   └── rewardUtils.js       # Reward calculation utilities
├── app/components/
│   └── RewardsDashboard.jsx # React UI component
└── REWARD_SYSTEM_DOCUMENTATION.md
```

---

## 🔧 Core Features

### 1. **Reward Points System**
- ✅ Earn **5 points** per review submitted
- ✅ Maximum **100 points** cap
- ✅ Points tracked in User model
- ✅ Complete reward history maintained

### 2. **Discount System**
- ✅ **10% discount** unlocked at 100 points
- ✅ Automatic discount application during booking
- ✅ Points reset to 0 after discount usage
- ✅ Discount usage tracked in reward history

### 3. **Review Management**
- ✅ One review per service (duplicate prevention)
- ✅ Rating validation (1-5 stars)
- ✅ Optional comment field
- ✅ Automatic reward point allocation

### 4. **Booking Integration**
- ✅ Automatic discount eligibility check
- ✅ Price calculation with discount
- ✅ Original price, discount, final price tracking
- ✅ Reward points reset after discount use

### 5. **Admin Analytics**
- ✅ Total rewards issued statistics
- ✅ Total discounts used count
- ✅ Top customers by reward points
- ✅ Average reward points across platform

---

## 📊 Database Schemas

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  rewardPoints: Number (0-100, default: 0),
  rewardHistory: [{
    type: 'REVIEW_REWARD' | 'DISCOUNT_USED',
    points: Number,
    description: String,
    date: Date
  }],
  createdAt: Date
}
```

### Review Model
```javascript
{
  customerId: ObjectId (ref: User),
  serviceId: ObjectId (ref: Service),
  rating: Number (1-5),
  comment: String (max 1000 chars),
  createdAt: Date
}
// Unique index: { customerId: 1, serviceId: 1 }
```

### Booking Model
```javascript
{
  customerId: ObjectId (ref: User),
  serviceId: ObjectId (ref: Service),
  originalPrice: Number,
  discountApplied: Number (default: 0),
  finalPrice: Number,
  bookingDate: Date
}
```

---

## 🌐 API Endpoints

### Review Endpoints

#### POST /api/reviews
Submit a review and earn reward points.

**Request Body:**
```json
{
  "customerId": "60d5ecb5c9a8f41234567890",
  "serviceId": "60d5ecb5c9a8f41234567891",
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Review submitted successfully and reward points awarded",
  "data": {
    "review": {
      "id": "60d5ecb5c9a8f41234567892",
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "rewardPoints": {
      "previous": 0,
      "earned": 5,
      "total": 5
    }
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid rating
- `404`: Customer not found
- `409`: Duplicate review (already reviewed this service)

---

#### GET /api/reviews/service/:serviceId
Get all reviews for a specific service.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "60d5ecb5c9a8f41234567892",
      "customerId": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### GET /api/reviews/customer/:customerId
Get all reviews by a specific customer.

---

### Reward Endpoints

#### GET /api/customer/rewards/:customerId
Get customer reward information.

**Response:**
```json
{
  "success": true,
  "data": {
    "customerId": "60d5ecb5c9a8f41234567890",
    "customerName": "John Doe",
    "rewardPoints": 60,
    "maxPoints": 100,
    "discountUnlocked": false,
    "pointsRemaining": 40,
    "rewardHistory": [
      {
        "type": "REVIEW_REWARD",
        "points": 5,
        "description": "Reward for submitting review",
        "date": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

#### GET /api/customer/rewards/history/:customerId
Get customer reward history.

---

### Booking Endpoints

#### POST /api/bookings
Create a new booking with optional reward discount.

**Request Body:**
```json
{
  "customerId": "60d5ecb5c9a8f41234567890",
  "serviceId": "60d5ecb5c9a8f41234567891",
  "bookingDate": "2024-01-20T14:00:00.000Z"
}
```

**Response (With Discount):**
```json
{
  "success": true,
  "message": "Booking created successfully with 10% reward discount!",
  "data": {
    "booking": {
      "id": "...",
      "customer": "John Doe",
      "service": "Deep Tissue Massage",
      "bookingDate": "2024-01-20T14:00:00.000Z"
    },
    "pricing": {
      "originalPrice": "₹1000.00",
      "discountApplied": "-₹100.00",
      "finalPrice": "₹900.00",
      "discountPercentage": "10%"
    },
    "rewardStatus": {
      "discountUsed": true,
      "previousPoints": 100,
      "currentPoints": 0,
      "message": "Reward points reset to 0 after discount usage"
    }
  }
}
```

**Response (Without Discount):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "pricing": {
      "originalPrice": "₹1000.00",
      "discountApplied": "₹0.00",
      "finalPrice": "₹1000.00",
      "discountPercentage": "0%"
    },
    "rewardStatus": {
      "discountUsed": false,
      "previousPoints": 60,
      "currentPoints": 60,
      "message": "Current points: 60/100"
    }
  }
}
```

---

### Admin Endpoints

#### GET /api/admin/reward-stats
Get reward system statistics (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRewardsIssued": 2500,
    "totalDiscountsUsed": 45,
    "customersWithUnlockedDiscount": 12,
    "averageRewardPoints": "42.50",
    "topCustomers": [
      {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "rewardPoints": 100
      },
      {
        "id": "...",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "rewardPoints": 95
      }
    ]
  }
}
```

---

## 🎨 Frontend Component

### RewardsDashboard.jsx

A complete React component displaying:

1. **Reward Progress Card**
   - Current points display (e.g., "60 / 100")
   - Animated progress bar
   - Status-based messaging
   - Color-coded progress (blue → green when unlocked)

2. **Quick Stats Section**
   - Current points
   - Points remaining
   - Discount status (Locked/Unlocked tag)
   - Reward history count

3. **Reward History List**
   - Chronological list of all reward activities
   - Icons for different types (star for reviews, check for discounts)
   - Points earned/lost with color coding
   - Timestamps for each entry

**Usage:**
```jsx
import RewardsDashboard from './components/RewardsDashboard';

function App() {
  return (
    <RewardsDashboard customerId="60d5ecb5c9a8f41234567890" />
  );
}
```

---

## ⚙️ Utility Functions

### rewardUtils.js

#### checkRewardDiscount(customer)
Returns `true` if customer has ≥ 100 points.

```javascript
const isEligible = checkRewardDiscount(customer);
// Returns: boolean
```

#### calculateUpdatedPoints(currentPoints, pointsToAdd)
Calculates new points with max limit enforcement.

```javascript
const newPoints = calculateUpdatedPoints(60, 5);
// Returns: 65

const cappedPoints = calculateUpdatedPoints(98, 5);
// Returns: 100 (capped)
```

#### calculateDiscountedPrice(originalPrice)
Calculates 10% discount and final price.

```javascript
const { discount, finalPrice } = calculateDiscountedPrice(1000);
// discount: 100
// finalPrice: 900
```

#### createRewardHistoryEntry(type, points, description)
Creates standardized reward history object.

```javascript
const entry = createRewardHistoryEntry(
  'REVIEW_REWARD',
  5,
  'Reward for submitting review'
);
// Returns: { type, points, description, date }
```

---

## 🔄 Business Logic Flow

### Review Submission Flow

1. Customer submits review (customerId, serviceId, rating, comment)
2. Backend validates input (required fields, rating range)
3. Check for duplicate review (findOne with customerId + serviceId)
4. Create and save review document
5. Fetch customer document
6. Calculate new points: `Math.min(currentPoints + 5, 100)`
7. Update customer.rewardPoints
8. Add reward history entry (type: REVIEW_REWARD, points: 5)
9. Save customer document
10. Return success response with review and reward data

### Booking Creation Flow

1. Customer creates booking (customerId, serviceId)
2. Fetch service to get price
3. Fetch customer to check reward status
4. Check discount eligibility: `checkRewardDiscount(customer)`
5. If eligible:
   - Calculate discount: `price × 0.10`
   - Calculate final price: `price - discount`
   - Reset customer.rewardPoints to 0
   - Add reward history entry (type: DISCOUNT_USED, points: -100)
   - Save customer document
6. Create booking with pricing details
7. Return success response with booking and reward status

---

## 🔒 Security & Validation

### Input Validation
- Required field checks
- Rating range validation (1-5)
- Email format validation
- String length limits
- Numeric range validation

### Database Security
- Unique compound index prevents duplicate reviews
- MongoDB indexes for query performance
- Select: false on password field
- Population with field selection

### Error Handling
- Try-catch blocks in all async operations
- Descriptive error messages
- HTTP status codes (400, 404, 409, 500)
- Console logging for debugging

---

## 📈 Performance Optimizations

### Database Indexes
```javascript
// User model
userSchema.index({ rewardPoints: -1 });

// Review model
reviewSchema.index({ customerId: 1, serviceId: 1 }, { unique: true });
reviewSchema.index({ customerId: -1 });

// Booking model
bookingSchema.index({ customerId: -1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ bookingDate: -1 });
```

### Query Optimization
- Selective field projection with `.select()`
- Compound indexes for frequently queried fields
- Limit on aggregation results
- Sorting optimization

---

## 🧪 Testing Examples

### Test Review Submission
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "60d5ecb5c9a8f41234567890",
    "serviceId": "60d5ecb5c9a8f41234567891",
    "rating": 5,
    "comment": "Excellent service!"
  }'
```

### Test Get Rewards
```bash
curl http://localhost:3000/api/customer/rewards/60d5ecb5c9a8f41234567890
```

### Test Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "60d5ecb5c9a8f41234567890",
    "serviceId": "60d5ecb5c9a8f41234567891",
    "bookingDate": "2024-01-20T14:00:00.000Z"
  }'
```

### Test Admin Stats
```bash
curl http://localhost:3000/api/admin/reward-stats
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install mongoose express dotenv
```

### 2. Configure Environment
Create `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/wellness
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 3. Import Models
Ensure all models are imported in your main server file.

### 4. Mount Routes
```javascript
const reviewRoutes = require('./routes/reviewRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/reviews', reviewRoutes);
app.use('/api/customer', rewardRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
```

### 5. Start Server
```bash
npm start
```

---

## 📝 Key Implementation Notes

1. **Duplicate Prevention**: The unique compound index on `{ customerId: 1, serviceId: 1 }` ensures customers can only review each service once.

2. **Point Cap Enforcement**: Using `Math.min(currentPoints + 5, 100)` ensures points never exceed 100.

3. **Automatic Discount**: The booking controller automatically checks eligibility and applies discount without manual intervention.

4. **History Tracking**: Every reward action is logged in rewardHistory array for complete audit trail.

5. **Modular Architecture**: Controllers, routes, models, and utilities are separated for maintainability.

6. **Reusable Utilities**: All reward calculations are in dedicated utility functions for consistency.

---

## 🎯 Future Enhancements

- [ ] Tiered reward levels (Bronze, Silver, Gold)
- [ ] Expiration date for reward points
- [ ] Multiple discount tiers (15%, 20% for higher tiers)
- [ ] Referral bonus program
- [ ] Seasonal bonus point events
- [ ] Email notifications for milestone achievements
- [ ] Admin dashboard for reward management
- [ ] Export reward history to PDF
- [ ] Mobile app integration

---

## 📞 Support

For questions or issues with the reward system implementation, refer to the code comments and API documentation above.

**System Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Author:** Senior MERN Stack Developer
