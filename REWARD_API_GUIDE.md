# 📡 Reward System - API Quick Reference Guide

Complete API documentation for the Customer Reward and Discount System.

---

## 🔑 Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## 📝 Review Endpoints

### 1. Submit Review (Earn Points)

**Endpoint:** `POST /api/reviews`

**Authentication:** Required (Customer)

**Request:**
```http
POST /api/reviews HTTP/1.1
Content-Type: application/json

{
  "customerId": "60d5ecb5c9a8f41234567890",
  "serviceId": "60d5ecb5c9a8f41234567891",
  "rating": 5,
  "comment": "Excellent service! Highly recommended."
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Review submitted successfully and reward points awarded",
  "data": {
    "review": {
      "id": "60d5ecb5c9a8f41234567892",
      "rating": 5,
      "comment": "Excellent service! Highly recommended.",
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

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": "Customer ID, Service ID, and Rating are required"
}
```

**400 Bad Request** - Invalid rating:
```json
{
  "success": false,
  "error": "Rating must be between 1 and 5"
}
```

**409 Conflict** - Duplicate review:
```json
{
  "success": false,
  "error": "You have already reviewed this service"
}
```

**404 Not Found** - Customer not found:
```json
{
  "success": false,
  "error": "Customer not found"
}
```

---

### 2. Get Service Reviews

**Endpoint:** `GET /api/reviews/service/:serviceId`

**Authentication:** Public

**Request:**
```http
GET /api/reviews/service/60d5ecb5c9a8f41234567891 HTTP/1.1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d5ecb5c9a8f41234567892",
      "customerId": {
        "_id": "60d5ecb5c9a8f41234567890",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "serviceId": "60d5ecb5c9a8f41234567891",
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Customer Reviews

**Endpoint:** `GET /api/reviews/customer/:customerId`

**Authentication:** Private

**Request:**
```http
GET /api/reviews/customer/60d5ecb5c9a8f41234567890 HTTP/1.1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60d5ecb5c9a8f41234567892",
      "serviceId": {
        "_id": "60d5ecb5c9a8f41234567891",
        "name": "Deep Tissue Massage",
        "price": 1000
      },
      "rating": 5,
      "comment": "Amazing experience!",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🎁 Reward Endpoints

### 4. Get Customer Rewards

**Endpoint:** `GET /api/customer/rewards/:customerId`

**Authentication:** Private (Customer)

**Request:**
```http
GET /api/customer/rewards/60d5ecb5c9a8f41234567890 HTTP/1.1
```

**Success Response (200 OK):**
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
      },
      {
        "type": "REVIEW_REWARD",
        "points": 5,
        "description": "Reward for submitting review",
        "date": "2024-01-14T09:15:00.000Z"
      }
    ]
  }
}
```

**404 Not Found** - Customer not found:
```json
{
  "success": false,
  "error": "Customer not found"
}
```

---

### 5. Get Reward History

**Endpoint:** `GET /api/customer/rewards/history/:customerId`

**Authentication:** Private

**Request:**
```http
GET /api/customer/rewards/history/60d5ecb5c9a8f41234567890 HTTP/1.1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "type": "REVIEW_REWARD",
      "points": 5,
      "description": "Reward for submitting review",
      "date": "2024-01-15T10:30:00.000Z"
    },
    {
      "type": "DISCOUNT_USED",
      "points": -100,
      "description": "10% reward discount used",
      "date": "2024-01-10T14:20:00.000Z"
    }
  ]
}
```

---

## 📅 Booking Endpoints

### 6. Create Booking (With Auto-Discount)

**Endpoint:** `POST /api/bookings`

**Authentication:** Private (Customer)

**Request:**
```http
POST /api/bookings HTTP/1.1
Content-Type: application/json

{
  "customerId": "60d5ecb5c9a8f41234567890",
  "serviceId": "60d5ecb5c9a8f41234567891",
  "bookingDate": "2024-01-20T14:00:00.000Z"
}
```

**Success Response (201 Created) - WITH DISCOUNT:**
```json
{
  "success": true,
  "message": "Booking created successfully with 10% reward discount!",
  "data": {
    "booking": {
      "id": "60d5ecb5c9a8f41234567893",
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

**Success Response (201 Created) - WITHOUT DISCOUNT:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "60d5ecb5c9a8f41234567893",
      "customer": "Jane Smith",
      "service": "Swedish Massage",
      "bookingDate": "2024-01-20T15:00:00.000Z"
    },
    "pricing": {
      "originalPrice": "₹800.00",
      "discountApplied": "₹0.00",
      "finalPrice": "₹800.00",
      "discountPercentage": "0%"
    },
    "rewardStatus": {
      "discountUsed": false,
      "previousPoints": 45,
      "currentPoints": 45,
      "message": "Current points: 45/100"
    }
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing required fields:
```json
{
  "success": false,
  "error": "Customer ID and Service ID are required"
}
```

**404 Not Found** - Service not found:
```json
{
  "success": false,
  "error": "Service not found"
}
```

**404 Not Found** - Customer not found:
```json
{
  "success": false,
  "error": "Customer not found"
}
```

---

### 7. Get Customer Bookings

**Endpoint:** `GET /api/bookings/customer/:customerId`

**Authentication:** Private

**Request:**
```http
GET /api/bookings/customer/60d5ecb5c9a8f41234567890 HTTP/1.1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "60d5ecb5c9a8f41234567893",
      "customerId": "60d5ecb5c9a8f41234567890",
      "serviceId": {
        "_id": "60d5ecb5c9a8f41234567891",
        "name": "Deep Tissue Massage",
        "price": 1000
      },
      "originalPrice": 1000,
      "discountApplied": 100,
      "finalPrice": 900,
      "bookingDate": "2024-01-20T14:00:00.000Z"
    }
  ]
}
```

---

## 📊 Admin Endpoint

### 8. Get Reward Statistics

**Endpoint:** `GET /api/admin/reward-stats`

**Authentication:** Private (Admin)

**Request:**
```http
GET /api/admin/reward-stats HTTP/1.1
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**
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
        "id": "60d5ecb5c9a8f41234567890",
        "name": "John Doe",
        "email": "john@example.com",
        "rewardPoints": 100
      },
      {
        "id": "60d5ecb5c9a8f41234567891",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "rewardPoints": 95
      },
      {
        "id": "60d5ecb5c9a8f41234567892",
        "name": "Bob Johnson",
        "email": "bob@example.com",
        "rewardPoints": 87
      }
    ]
  }
}
```

---

## 🔍 cURL Testing Examples

### Submit a Review:
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

### Get Customer Rewards:
```bash
curl http://localhost:3000/api/customer/rewards/60d5ecb5c9a8f41234567890
```

### Create Booking:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "60d5ecb5c9a8f41234567890",
    "serviceId": "60d5ecb5c9a8f41234567891"
  }'
```

### Get Admin Stats:
```bash
curl http://localhost:3000/api/admin/reward-stats
```

---

## 📋 HTTP Status Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET requests |
| 201 | Created | Successful POST (review, booking) |
| 400 | Bad Request | Missing/invalid input data |
| 404 | Not Found | Customer/service not found |
| 409 | Conflict | Duplicate review attempt |
| 500 | Internal Server Error | Server/database error |

---

## 🎯 Common Response Patterns

### Success Pattern:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### Error Pattern:
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## 💡 Tips for Integration

1. **Always check `success` field** in response before processing data
2. **Handle all error status codes** (400, 404, 409, 500)
3. **Use try-catch blocks** for async operations
4. **Validate input data** before sending to API
5. **Store customerId securely** for authenticated requests
6. **Implement retry logic** for network failures
7. **Cache reward data** where appropriate to reduce API calls

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Status:** ✅ Production Ready
