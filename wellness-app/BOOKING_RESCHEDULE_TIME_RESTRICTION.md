# Booking Reschedule Time Restriction Implementation

## Overview
This implementation adds time-based restrictions for the reschedule functionality in the booking system. Bookings that are within 24 hours of the current time will have the reschedule option disabled/hidden on customer and business dashboards, while therapists will always have access to reschedule.

## Files Modified

### 1. Utility Functions (`app/utils/bookingTimeUtils.ts`)
Created new utility functions:
- `isBookingWithin24Hours(bookingDate, bookingTime)`: Checks if a booking is within 24 hours from current time
- `shouldRestrictReschedule(bookingDate, bookingTime, userRole)`: Determines if reschedule should be restricted based on user role

### 2. Customer Dashboard (`app/dashboard/customer/bookings/page.tsx`)
- Added import for `shouldRestrictReschedule` utility
- Modified reschedule buttons in both "Booking Requests" and "Confirmed Bookings" tabs
- Reschedule buttons are now conditionally rendered based on time restriction

### 3. Business Dashboard - Booking Management (`app/components/BookingManagement.tsx`)
- Added import for `shouldRestrictReschedule` utility
- Modified reschedule button in the booking requests table
- Reschedule button is now conditionally rendered based on time restriction

### 4. Business Dashboard - Assigned Bookings (`app/components/AssignedBookingsTracker.tsx`)
- Added import for `shouldRestrictReschedule` utility
- Modified reschedule button in the assigned bookings list
- Reschedule button is now conditionally rendered based on time restriction

### 5. Therapist Dashboard (`app/components/TherapistBookings.tsx`)
- Added import for `shouldRestrictReschedule` utility
- No changes to reschedule functionality (therapists always have access)

## Logic Implementation

### Time Calculation
- The system calculates the time difference between the current time and the booking time
- If the difference is 24 hours or less, reschedule is restricted for customer and business users
- Past bookings (negative time difference) are also restricted
- Therapists are exempt from this restriction

### User Role Handling
- **Customer**: Reschedule restricted if booking is within 24 hours
- **Business**: Reschedule restricted if booking is within 24 hours  
- **Therapist**: Reschedule always available (no restrictions)

## Behavior Changes

### Before Implementation
- All users could reschedule any booking regardless of time proximity

### After Implementation
- Customer dashboard: Reschedule button hidden for bookings within 24 hours
- Business dashboard: Reschedule button hidden for bookings within 24 hours
- Therapist dashboard: Reschedule button always visible (unchanged)

## Testing Scenarios

1. **Booking within 24 hours**: Reschedule button should be hidden on customer/business dashboards
2. **Booking beyond 24 hours**: Reschedule button should be visible on all dashboards
3. **Past bookings**: Reschedule button should be hidden on customer/business dashboards
4. **Therapist dashboard**: Reschedule button should always be visible regardless of time

## Error Handling
- The utility functions include error handling for malformed date/time data
- In case of parsing errors, the system defaults to restricting reschedule (conservative approach)

## Additional Notes
- All other booking functionalities (cancel, view details, confirm) remain unchanged
- The restriction only affects the visibility/accessibility of the reschedule option
- No changes to the underlying rescheduling API or database logic