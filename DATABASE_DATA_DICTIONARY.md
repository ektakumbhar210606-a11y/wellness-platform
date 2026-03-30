# DATABASE DATA DICTIONARY
## Wellness Platform - Complete Schema Reference

---

## TABLE: User
**Collection:** `users`  
**Description:** Core user authentication and account management for all platform users

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| name | String | Yes | - | Max 100 chars | Full name of the user |
| email | String | Yes | - | Unique, Valid email, Lowercase | Email address |
| password | String | Yes | - | Min 6 chars | Hashed password (not returned in queries) |
| role | Enum | Yes | Customer | Values: Customer, Business, Therapist | User role in the system |
| phone | String | No | - | Valid international phone format | Phone number |
| resetPasswordToken | String | No | null | - | Password reset token |
| resetPasswordExpires | Date | No | null | - | Password reset token expiration |
| rewardPoints | Number | No | 0 | Min: 0 | Current reward points balance |
| rewardHistory.type | Enum (in Array) | Yes | - | REVIEW_REWARD, DISCOUNT_USED | Transaction type |
| rewardHistory.points | Number (in Array) | Yes | - | - | Points earned or redeemed |
| rewardHistory.description | String (in Array) | Yes | - | - | Transaction description |
| rewardHistory.date | Date (in Array) | Yes | Now | - | Transaction timestamp |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** email (unique), role  
**Relationships:** 1:1 with Customer, 1:1 with Therapist, 1:M with Business (owner)

---

## TABLE: Customer
**Collection:** `customers`  
**Description:** Detailed customer profile information, preferences, wellness goals, and history

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| user | ObjectId | Yes | - | Unique, FK → User.user_id | Reference to User model |
| fullName | String | Yes | - | Max 100 chars | Customer's full name |
| email | String | Yes | - | Valid email format | Email address |
| phoneNumber | String | No | null | - | Phone number |
| dateOfBirth | Date | No | null | Must be in past | Date of birth |
| gender | Enum | No | null | male, female, other, prefer-not-to-say | Gender identity |
| location.city | String | No | null | - | City of residence |
| location.state | String | No | null | - | State/Province |
| location.country | String | No | null | - | Country |
| location.zipCode | String | No | null | - | Postal/ZIP code |
| onboardingCompleted | Boolean | Yes | false | - | Onboarding completion status |
| onboardingCompletedAt | Date | No | null | - | Onboarding completion timestamp |
| preferences.type | Enum (in Array) | No | - | service, therapy, lifestyle, goal | Preference category |
| preferences.value | String (in Array) | No | - | - | Preference value |
| preferences.category | String (in Array) | No | - | - | Sub-category (e.g., massage, spa) |
| preferredTherapies | Array[String] | No | [] | - | List of preferred therapy types |
| appointmentFrequency | Enum | No | null | weekly, bi-weekly, monthly, occasional, first-time | Preferred frequency |
| preferredTimeSlots | Array[String] | No | [] | morning, afternoon, evening, weekend | Preferred times of day |
| wellnessGoals | String | No | null | Max 1000 chars | Primary wellness goals description |
| wellnessGoalsList.title | String (in Array) | Yes | - | - | Goal title |
| wellnessGoalsList.description | String (in Array) | No | - | - | Goal description |
| wellnessGoalsList.targetDate | Date (in Array) | No | null | - | Target completion date |
| wellnessGoalsList.progress | Number (in Array) | No | 0 | Min: 0, Max: 100 | Progress percentage |
| wellnessGoalsList.completed | Boolean (in Array) | No | false | - | Goal completion status |
| wellnessGoalsList.createdAt | Date (in Array) | Yes | Now | - | Goal creation timestamp |
| stressLevel | Enum | No | null | low, moderate, high, very-high | Current stress level |
| lifestyleFactors | Array[String] | No | [] | - | Lifestyle factors affecting wellness |
| medicalInfo.conditions | Array[String] | No | [] | - | Medical conditions |
| medicalInfo.allergies | Array[String] | No | [] | - | Known allergies |
| medicalInfo.medications | Array[String] | No | [] | - | Current medications |
| medicalInfo.notes | String | No | null | - | Additional medical notes |
| medicalInfo.lastUpdated | Date | No | Now | - | Medical info last update |
| wellnessHistory.serviceId | ObjectId (in Array) | No | null | FK → Service._id | Service reference |
| wellnessHistory.serviceName | String (in Array) | No | - | - | Service name |
| wellnessHistory.therapistId | ObjectId (in Array) | No | null | FK → Therapist._id | Therapist reference |
| wellnessHistory.therapistName | String (in Array) | No | - | - | Therapist name |
| wellnessHistory.businessId | ObjectId (in Array) | No | null | FK → Business._id | Business reference |
| wellnessHistory.businessName | String (in Array) | No | - | - | Business name |
| wellnessHistory.date | Date (in Array) | Yes | - | - | Service date |
| wellnessHistory.rating | Number (in Array) | No | null | Min: 1, Max: 5 | Rating given |
| wellnessHistory.notes | String (in Array) | No | null | - | Service notes |
| wellnessHistory.tags | Array[String] (in Array) | No | [] | - | Tags for categorization |
| totalAppointments | Number | No | 0 | Min: 0 | Total appointments count |
| totalServicesUsed | Number | No | 0 | Min: 0 | Total unique services used |
| avgRating | Number | No | 0 | Min: 0, Max: 5 | Average rating given by customer |
| favoriteTherapists | Array[ObjectId] | No | [] | FK → Therapist._id | Favorite therapists |
| favoriteServices | Array[ObjectId] | No | [] | FK → Service._id | Favorite services |
| communicationPreferences.emailNotifications | Boolean | No | true | - | Email notifications enabled |
| communicationPreferences.smsNotifications | Boolean | No | false | - | SMS notifications enabled |
| communicationPreferences.marketingEmails | Boolean | No | false | - | Marketing emails enabled |
| privacySettings.profileVisibility | Enum | No | private | public, private, friends | Profile visibility |
| privacySettings.appointmentHistoryVisibility | Enum | No | private | public, private, friends | Appointment history visibility |
| rewardPoints | Number | No | 0 | Min: 0 | Reward points (denormalized) |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** user (unique), email, preferences.type+value, preferredTherapies, location.city+state, wellnessGoalsList.completed, totalAppointments, avgRating, wellnessHistory.date (desc)  
**Virtual Fields:** age (calculated from dateOfBirth)  
**Relationships:** 1:1 with User

---

## TABLE: Business
**Collection:** `businesses`  
**Description:** Business/Spa profiles including location, hours, services, and therapist associations

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| owner | ObjectId | Yes | - | FK → User._id | Business owner user reference |
| name | String | Yes | - | Max 100 chars, Alphanumeric/spaces/hyphens | Business name |
| description | String | No | null | Max 500 chars | Business description |
| serviceType | Enum | No | null | massage, spa, wellness, corporate | Type of business |
| serviceName | String | No | null | Max 100 chars | Specific service name |
| address.street | String | Yes | - | Max 200 chars | Street address |
| address.city | String | Yes | - | Max 50 chars | City |
| address.state | String | Yes | - | Max 50 chars | State/Province |
| address.zipCode | String | Yes | - | Max 20 chars | ZIP/Postal code |
| address.country | String | Yes | - | Max 50 chars | Country |
| address.currency | String | No | INR | Max 3 chars | Currency code |
| phone | String | No | null | Max 20 chars, Valid phone format | Business phone |
| email | String | No | null | Max 100 chars, Valid email | Business email |
| website | String | No | null | Max 200 chars, Valid URL | Business website |
| openingTime | String | Yes | - | HH:MM format (24-hour) | Daily opening time |
| closingTime | String | Yes | - | HH:MM format (24-hour) | Daily closing time |
| businessHours.Monday.open | String | No | null | HH:MM format | Monday opening time |
| businessHours.Monday.close | String | No | null | HH:MM format | Monday closing time |
| businessHours.Monday.closed | Boolean | No | false | - | Whether closed on Monday |
| businessHours.Tuesday.* | Object | No | null | Same as Monday | Tuesday hours |
| businessHours.Wednesday.* | Object | No | null | Same as Monday | Wednesday hours |
| businessHours.Thursday.* | Object | No | null | Same as Monday | Thursday hours |
| businessHours.Friday.* | Object | No | null | Same as Monday | Friday hours |
| businessHours.Saturday.* | Object | No | null | Same as Monday | Saturday hours |
| businessHours.Sunday.* | Object | No | null | Same as Monday | Sunday hours |
| status | Enum | Yes | active | active, inactive, suspended | Business operational status |
| currency | String | No | INR | Max 3 chars | Default currency code |
| therapists.therapistId | ObjectId (in Array) | Yes | - | FK → Therapist._id | Therapist reference |
| therapists.status | Enum (in Array) | No | pending | pending, approved | Association status |
| therapists.joinedAt | Date (in Array) | No | null | - | Join timestamp |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** owner, name (text), address.city, status, serviceType, therapists.therapistId  
**Relationships:** M:1 with User (owner), 1:M with Therapist (associations), 1:M with Service

---

## TABLE: Therapist
**Collection:** `therapists`  
**Description:** Therapist profiles including skills, experience, ratings, and business associations

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| user | ObjectId | Yes | - | Unique, FK → User._id | Reference to User model |
| business | ObjectId | No | null | FK → Business._id | Primary associated business |
| experience | Number | Yes | - | Min: 0, Integer | Years of experience |
| skills | Array[String] | Yes | [] | Non-empty, Valid skill IDs | Therapy skill IDs |
| rating | Number | No | null | Min: 0, Max: 5, 2 decimals | Average rating (deprecated) |
| averageRating | Number | No | 0 | Min: 0, Max: 5 | Aggregated average rating |
| totalReviews | Number | No | 0 | Min: 0 | Total reviews count |
| availabilityStatus | Enum | Yes | available | available, busy, offline, on-leave | Current availability |
| associatedBusinesses.businessId | ObjectId (in Array) | Yes | - | FK → Business._id | Business reference |
| associatedBusinesses.status | Enum (in Array) | No | pending | pending, approved, rejected | Association status |
| associatedBusinesses.requestedAt | Date (in Array) | No | Now | - | Request timestamp |
| associatedBusinesses.approvedAt | Date (in Array) | No | null | - | Approval timestamp |
| fullName | String | No | null | - | Therapist's full name |
| email | String | No | null | - | Email address |
| phoneNumber | String | No | null | - | Phone number |
| professionalTitle | String | No | null | - | Professional title (e.g., LMT) |
| bio | String | No | null | - | Professional biography |
| location.city | String | No | null | - | City |
| location.state | String | No | null | - | State/Province |
| location.country | String | No | null | - | Country |
| certifications | Array[String] | No | [] | - | Certifications list |
| licenseNumber | String | No | null | - | Professional license number |
| weeklyAvailability.day | Enum (in Array) | Yes | - | Monday-Sunday | Day of week |
| weeklyAvailability.startTime | String (in Array) | Yes | - | HH:MM format | Start time |
| weeklyAvailability.endTime | String (in Array) | Yes | - | HH:MM format | End time |
| areaOfExpertise | Array[String] | No | [] | Valid expertise IDs | Areas of specialization |
| monthlyCancelCount | Number | No | 0 | - | Cancellations this month |
| totalCancelCount | Number | No | 0 | - | Total cancellations |
| cancelWarnings | Number | No | 0 | - | Warning count |
| bonusPenaltyPercentage | Number | No | 0 | Min: 0, Max: 100 | Bonus/penalty calculation |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** user (unique), business, skills, rating, availabilityStatus, associatedBusinesses.businessId, associatedBusinesses.status, monthlyCancelCount, totalCancelCount, bonusPenaltyPercentage  
**Valid Skill IDs:** client_assessment_consultation, anatomy_physiology, manual_massage_techniques, mindfulness_coaching, stress_reduction_techniques, communication_client_care, hygiene_safety_management  
**Valid Expertise IDs:** swedish_massage, deep_tissue_massage, aromatherapy_massage, hot_stone_massage, thai_massage, reflexology, head_neck_shoulder_massage, facial_treatments_basic/advanced, body_scrub_polishing, body_wrap_therapy, manicure_pedicure, hair_spa_treatment, meditation_mindfulness, weight_management, stress_management, detox_lifestyle, mental_wellness_counseling, sleep_improvement  
**Relationships:** 1:1 with User, M:1 with Business (primary), M:M with Business (associations)

---

## TABLE: ServiceCategory
**Collection:** `servicecategories`  
**Description:** Master list of service categories for classification

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| name | String | Yes | - | Unique, Max 100 chars | Category name |
| slug | String | Yes | - | Unique, lowercase, Max 100 chars | URL-friendly identifier |
| description | String | No | null | Max 500 chars | Category description |
| isActive | Boolean | No | true | - | Active status |
| createdAt | Date | Auto | Auto | - | Creation timestamp |
| updatedAt | Date | Auto | Auto | - | Update timestamp |

**Indexes:** name (text), isActive, createdAt (desc)  
**Example Categories:** Massage Therapy, Spa Treatments, Wellness Programs, Corporate Wellness

---

## TABLE: Service
**Collection:** `services`  
**Description:** Individual services offered by businesses with pricing and therapists

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| business | ObjectId | Yes | - | FK → Business._id | Offering business |
| serviceCategory | ObjectId | Yes | - | FK → ServiceCategory._id | Service category |
| name | String | Yes | - | Max 200 chars | Service name |
| price | Number | Yes | - | Min: 0 | Service price |
| duration | Number | Yes | - | Min: 1 (minutes) | Service duration in minutes |
| description | String | No | null | Max 500 chars | Service description |
| therapists | Array[ObjectId] | No | [] | FK → Therapist._id | Therapists who can perform service |
| teamMembers | Array[ObjectId] | No | [] | FK → Therapist._id | Alternative therapist reference |
| createdAt | Date | Auto | Auto | - | Creation timestamp |
| updatedAt | Date | Auto | Auto | - | Update timestamp |

**Indexes:** business, serviceCategory, price, duration, therapists, teamMembers  
**Relationships:** M:1 with Business, M:1 with ServiceCategory, M:M with Therapist

---

## TABLE: Booking
**Collection:** `bookings`  
**Description:** Appointment bookings linking customers, therapists, and services

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| customer | ObjectId | Yes | - | FK → User._id | Customer who made booking |
| therapist | ObjectId | Yes | - | FK → Therapist._id | Assigned therapist |
| service | ObjectId | Yes | - | FK → Service._id | Booked service |
| date | Date | Yes | - | - | Appointment date |
| time | String | Yes | - | HH:MM format (24-hour) | Appointment time |
| status | Enum | Yes | pending | See status values below | Booking status |
| notes | String | No | null | Max 500 chars | Customer notes/special requests |
| duration | Number | No | null | Min: 1 | Booking duration (if different) |
| assignedByAdmin | Boolean | No | false | - | Admin-assigned booking flag |
| assignedById | String | No | null | FK → User._id | Admin who assigned |
| therapistResponded | Boolean | No | false | - | Therapist response flag |
| notificationDestination | Enum | No | customer | customer, business | Notification recipient |
| responseVisibleToBusinessOnly | Boolean | No | false | - | Hide responses from customer |
| originalDate | Date | No | null | - | Original date before reschedule |
| originalTime | String | No | null | HH:MM format | Original time before reschedule |
| rescheduledBy | String | No | null | - | User ID who rescheduled |
| rescheduledAt | Date | No | null | - | Reschedule timestamp |
| confirmedBy | String | No | null | - | User ID who confirmed |
| confirmedAt | Date | No | null | - | Confirmation timestamp |
| cancelledBy | String | No | null | - | User ID who cancelled |
| cancelledAt | Date | No | null | - | Cancellation timestamp |
| cancelReason | String | No | null | - | Generic cancellation reason |
| customerCancelReason | String | No | null | Max 500 chars | Customer's cancellation reason |
| therapistCancelReason | String | No | null | - | Therapist's cancellation reason |
| businessCancelReason | String | No | null | Max 500 chars | Business's cancellation reason |
| refundAmount | Number | No | null | Min: 0 | Amount refunded to customer |
| refundPenaltyPercentage | Number | No | null | Min: 0, Max: 100 | Penalty percentage applied |
| therapistCancelRequestedAt | Date | No | null | - | Therapist cancel request time |
| businessReviewStatus | Enum | No | null | pending, approved, rejected | Business review of cancel request |
| businessReviewedAt | Date | No | null | - | Business review timestamp |
| completedAt | Date | No | null | - | Completion timestamp |
| reviewSubmitted | Boolean | No | false | - | Review submission flag |
| paymentStatus | Enum | No | pending | pending, partial, paid | Payment status |
| therapistPayoutStatus | Enum | No | pending | pending, paid | Therapist payout status |
| therapistPayoutAmount | Number | No | null | - | Amount paid to therapist |
| therapistPaidAt | Date | No | null | - | Therapist payment timestamp |
| paymentVerification.orderId | String | No | null | - | Razorpay order ID |
| paymentVerification.paymentId | String | No | null | - | Razorpay payment ID |
| paymentVerification.signature | String | No | null | - | Payment signature |
| paymentVerification.verifiedAt | Date | No | null | - | Verification timestamp |
| originalPrice | Number | No | null | - | Original price before discounts |
| rewardDiscountApplied | Boolean | No | false | - | Reward discount flag |
| rewardDiscountAmount | Number | No | null | - | Discount amount |
| finalPrice | Number | No | null | - | Final price after discount |
| therapistPayoutOrderInfo.orderId | String | No | null | - | Payout order ID |
| therapistPayoutOrderInfo.amount | Number | No | null | - | Payout amount |
| therapistPayoutOrderInfo.currency | String | No | null | - | Currency |
| therapistPayoutOrderInfo.created_at | Date | No | null | - | Order creation timestamp |
| createdAt | Date | Auto | Auto | - | Booking creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Booking Status Values:** pending, therapist_confirmed, therapist_rejected, confirmed, paid, completed, cancelled, no-show, rescheduled, therapist_cancel_requested, cancelled_by_therapist  
**Indexes:** customer, therapist, service, date, status, customer+date (compound), therapist+date (compound)  
**Relationships:** M:1 with User (customer), M:1 with Therapist, M:1 with Service, 1:1 with Review, 1:M with Payment

---

## TABLE: Payment
**Collection:** `payments`  
**Description:** Payment records for bookings including amounts, methods, and status

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| booking | ObjectId | Yes | - | FK → Booking._id | Related booking |
| amount | Number | Yes | - | Min: 0 | Payment amount (advance portion) |
| totalAmount | Number | Yes | - | Min: 0 | Total service amount |
| advancePaid | Number | Yes | - | Min: 0 | Amount paid as advance |
| remainingAmount | Number | Yes | - | Min: 0 | Remaining amount due at venue |
| paymentType | Enum | Yes | FULL | FULL, ADVANCE | Payment type |
| method | Enum | Yes | - | credit_card, debit_card, cash, paypal, bank_transfer, mobile_wallet | Payment method |
| status | Enum | Yes | pending | pending, completed, failed, refunded | Payment status |
| paymentDate | Date | No | Now | - | Payment processing date |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** booking, amount, method, status, paymentDate  
**Relationships:** M:1 with Booking

---

## TABLE: Review
**Collection:** `reviews`  
**Description:** Customer reviews and ratings for therapists and services

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| bookingId | ObjectId | Yes | - | Unique, FK → Booking._id | Related booking |
| customer | ObjectId | Yes | - | FK → User._id | Customer who wrote review |
| therapist | ObjectId | Yes | - | FK → User._id | Therapist being reviewed |
| service | ObjectId | Yes | - | FK → Service._id | Service reviewed |
| rating | Number | Yes | - | Min: 1, Max: 5 | Star rating |
| comment | String | No | null | Max 1000 chars | Review comment |
| createdAt | Date | Auto | Auto | - | Review creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** therapist, bookingId (unique - prevents duplicate reviews)  
**Relationships:** M:1 with Booking, M:1 with User (customer), M:1 with User (therapist), M:1 with Service

---

## TABLE: TherapistAvailability
**Collection:** `therapistavailabilities`  
**Description:** Therapist availability slots for specific dates and times

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| therapist | ObjectId | Yes | - | FK → Therapist._id | Therapist reference |
| date | Date | Yes | - | - | Specific date |
| startTime | String | Yes | - | HH:MM format (24-hour) | Slot start time |
| endTime | String | Yes | - | HH:MM format (24-hour) | Slot end time |
| status | Enum | No | available | available, booked, unavailable, on-leave | Availability status |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Validation Rules:** endTime must be after startTime  
**Indexes:** therapist, date, status, therapist+date (compound)  
**Relationships:** M:1 with Therapist

---

## TABLE: TherapistBonus
**Collection:** `therapistbonuses`  
**Description:** Monthly bonus calculations and payments for therapists based on performance

| Column Name | Data Type | Required | Default | Constraints | Description |
|-------------|-----------|----------|---------|-------------|-------------|
| _id | ObjectId | Auto | Auto-generated | Primary Key, Unique | MongoDB document ID |
| therapist | ObjectId | Yes | - | FK → User._id | Therapist user reference |
| business | ObjectId | Yes | - | FK → User._id | Business user reference |
| month | Number | Yes | - | Min: 1, Max: 12 | Month (1=January, 12=December) |
| year | Number | Yes | - | Min: 1970, Max: 2100 | Year (YYYY format) |
| averageRating | Number | No | null | Min: 0, Max: 5 | Average rating for month |
| totalReviews | Number | No | null | Min: 0 | Total reviews for month |
| bonusAmount | Number | No | null | Min: 0 | Calculated bonus amount |
| status | Enum | No | pending | pending, paid | Bonus payment status |
| createdAt | Date | Auto | Auto | - | Record creation timestamp |
| updatedAt | Date | Auto | Auto | - | Last update timestamp |

**Indexes:** therapist+month+year (unique compound - one record per therapist per month)  
**Relationships:** M:1 with User (therapist), M:1 with User (business)

---

## ENTITY RELATIONSHIPS SUMMARY

| Relationship | Type | Description |
|--------------|-----|-------------|
| User ↔ Customer | One-to-One | Each user can have one customer profile |
| User ↔ Therapist | One-to-One | Each user can have one therapist profile |
| User ↔ Business | One-to-Many | A user can own multiple businesses |
| Business ↔ Therapist | Many-to-Many | Therapists can associate with multiple businesses |
| Business ↔ Service | One-to-Many | Businesses offer multiple services |
| ServiceCategory ↔ Service | One-to-Many | Categories contain multiple services |
| Customer ↔ Booking | One-to-Many | Customers can make multiple bookings |
| Therapist ↔ Booking | One-to-Many | Therapists can have multiple bookings |
| Service ↔ Booking | One-to-Many | Services can be booked multiple times |
| Booking ↔ Review | One-to-One | Each booking can have one review |
| Booking ↔ Payment | One-to-Many | Bookings can have multiple payment records |
| Therapist ↔ TherapistAvailability | One-to-Many | Therapists have multiple availability slots |
| Therapist ↔ TherapistBonus | One-to-Many | Therapists receive monthly bonuses |

---

## COMMON ENUMERATIONS REFERENCE

### UserRole
- Customer
- Business
- Therapist

### BookingStatus
- pending
- therapist_confirmed
- therapist_rejected
- confirmed
- paid
- completed
- cancelled
- no-show
- rescheduled
- therapist_cancel_requested
- cancelled_by_therapist

### PaymentStatus
- pending
- completed
- failed
- refunded

### PaymentMethod
- credit_card
- debit_card
- cash
- paypal
- bank_transfer
- mobile_wallet

### TherapistAvailability
- available
- busy
- offline
- on-leave

### BusinessStatus
- active
- inactive
- suspended

### ServiceType
- massage
- spa
- wellness
- corporate

### StressLevel
- low
- moderate
- high
- very-high

### AppointmentFrequency
- weekly
- bi-weekly
- monthly
- occasional
- first-time

### CustomerPreferenceType
- service
- therapy
- lifestyle
- goal

### TherapistAssociationStatus
- pending
- approved
- rejected

### BusinessAssociationStatus
- pending
- approved
- rejected

### TherapistAvailabilityStatus
- Available
- Booked
- Unavailable
- OnLeave

---

**Document Version:** 1.0  
**Last Updated:** March 26, 2026  
**Database Technology:** MongoDB with Mongoose ODM  
**Platform:** Wellness Booking Platform
