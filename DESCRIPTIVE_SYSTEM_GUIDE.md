# 🌿 Serenity Wellness Platform - Descriptive System Guide

**A Comprehensive Narrative Documentation**  
**Version:** 1.0 | **Last Updated:** March 23, 2026

---

## 📖 Introduction

Welcome to **Serenity**, a comprehensive wellness and spa management platform that connects customers with therapeutic services while providing powerful business management tools for spa providers, therapists, and administrators.

This guide tells the story of how every piece of the system works together, written in plain language with detailed explanations of each component's purpose and behavior.

---

## 🏗️ Chapter 1: The Big Picture

### What is Serenity?

Serenity is a full-stack web application built to digitize and streamline the entire wellness service experience. Imagine a world where:

- **Customers** can discover spa services, book appointments with their preferred therapists, track their wellness journey, and earn rewards—all from one platform
- **Therapists** can manage their schedules, view their earnings, track their performance, and access detailed analytics about their work
- **Businesses** (spa owners) can manage their service catalog, assign therapists to services, monitor revenue, generate reports, and optimize operations
- **Administrators** can oversee the entire platform, manage users, and ensure smooth operations

The platform handles everything from initial discovery to booking confirmation, service delivery, payment processing, review collection, and comprehensive reporting.

### The Technology Foundation

Serenity is built on modern, cutting-edge technologies:

**Frontend Layer:**
- **Next.js 16** - A React framework that provides both server-side rendering and static site generation for optimal performance
- **React 19** - The latest version of the popular UI library for building interactive components
- **TypeScript** - Adds type safety to catch errors before they reach production
- **Ant Design 6** - A polished component library for consistent, professional UI
- **Tailwind CSS 4** - Utility-first CSS for rapid, responsive styling
- **Recharts** - Beautiful chart and graph visualizations for analytics dashboards

**Backend Layer:**
- **Node.js** with **Express** (built into Next.js API routes) - Handles all server-side logic
- **MongoDB** - A NoSQL database that stores all application data in flexible, JSON-like documents
- **Mongoose 9** - An Object Data Modeling (ODM) library that provides schema validation and easy database operations
- **JWT (JSON Web Tokens)** - Secure authentication mechanism
- **bcryptjs** - Password hashing for security
- **Nodemailer** - Email notifications for bookings, confirmations, and updates
- **node-cron** - Scheduled background jobs for automated tasks

**External Services:**
- **Razorpay** - Indian payment gateway for processing credit cards, debit cards, UPI, and net banking
- **Puppeteer** - Headless Chrome browser for generating PDF reports
- **ExcelJS** - Creating Excel spreadsheets for downloadable reports

---

## 👥 Chapter 2: The Four User Personas

### Persona 1: The Customer

**Who they are:** Individuals seeking wellness and relaxation services

**Their Journey:**
A customer arrives at the Serenity homepage and is greeted with a beautiful, welcoming interface showcasing available services. They can browse by category—perhaps they're interested in massage therapy, aromatherapy, or deep tissue work. Each service has detailed information including duration, price, and description.

When they find a service they like, they can see which therapists are qualified to perform it, along with each therapist's profile, ratings from other customers, and available time slots. This transparency helps them make an informed choice.

Once they select a time slot, the system creates a booking. If it's their first time, they might get a welcome bonus of reward points. During checkout, they're presented with Razorpay's secure payment interface where they can pay using their preferred method—credit card, debit card, UPI, or net banking.

After payment, two things happen simultaneously:
1. They receive a confirmation email with booking details
2. The assigned therapist receives a notification about the new booking

The therapist then confirms the booking, and the customer gets another notification confirming their appointment is locked in.

On the day of service, they arrive at the spa, enjoy their session, and afterward, they're prompted to leave a review. When they submit a review with a star rating and optional comment, they earn reward points (typically 10 points per review). These points accumulate in their account, and once they reach 100 points, they automatically get a 10% discount on their next booking.

Throughout their journey, customers have access to a personal dashboard where they can:
- View all their past and upcoming bookings
- Track how much they've spent on wellness services
- See which services they book most often
- Monitor their reward points balance
- Download reports of their wellness journey
- Update their profile and preferences

---

### Persona 2: The Therapist

**Who they are:** Licensed massage therapists, aromatherapists, and wellness practitioners

**Their Journey:**
A therapist typically joins the platform when a spa business hires them. The business creates their profile in the system, entering their name, qualifications, certifications, and specialties. The therapist then gets login credentials and can access their personalized dashboard.

One of the first things a therapist does is set their availability. They define which days they work and what time slots they're available. For example, they might specify that they're available Mondays from 9 AM to 5 PM with one-hour slots. This availability calendar becomes the foundation for all booking assignments.

When a customer books a session with them, the therapist receives an immediate notification. They can review the booking details—what service, which customer, what date and time—and either confirm or decline it. If they decline, they must provide a reason, and this reason is tracked in the system.

Here's where an important feature comes into play: **cancellation tracking**. Every time a therapist cancels a booking, it counts against them. The system tracks how many times they've cancelled within the current month. If they cancel too frequently, there are consequences:

- **1-2 cancellations per month:** No action (everyone needs to cancel occasionally)
- **3-4 cancellations:** A formal warning is issued
- **5-6 cancellations:** A 5% penalty is applied to their earnings for that month
- **7+ cancellations:** A 10% penalty plus a formal review of their account

This tracking system ensures therapists take their commitments seriously. However, the system is also fair—on the first day of every month, the cancellation counter automatically resets to zero, giving everyone a fresh start. This reset happens through an automated background job that runs at midnight on the 1st of each month.

Therapists earn money based on a percentage of the service price—typically 70% of what the customer paid. So if a customer pays ₹2000 for a massage, the therapist earns ₹1400. Their earnings accumulate throughout the month, and they can view detailed breakdowns in their earnings dashboard.

The therapist dashboard is rich with features:
- **Analytics:** See how many bookings they've completed, their completion rate, total earnings, and customer ratings
- **Reports:** Generate custom reports showing specific metrics they care about—they can choose to see total bookings, completed bookings, cancelled bookings, earnings breakdown by service, monthly revenue trends, and more
- **Reviews:** Read feedback from customers, see their overall rating, and identify areas for improvement
- **Profile Management:** Update their bio, add new certifications, modify specialties, and adjust their availability

One unique feature is the **custom report builder**. Therapists can select exactly which fields they want to see in their report. Maybe this month they only care about earnings and completed bookings. Next month, they might want to see cancellation rates and service breakdown. This flexibility prevents information overload.

---

### Persona 3: The Business Owner

**Who they are:** Spa owners, wellness center managers, or business administrators

**Their Journey:**
A business owner starts by registering their spa on the platform. They provide business details like name, address, contact information, and operating hours. Once approved, they gain access to the business dashboard—a command center for all operations.

The first task is building their service catalog. They create service categories (like "Massage Therapy," "Aromatherapy," "Facial Treatments") and then populate those categories with individual services. For each service, they specify:
- Name and description
- Duration (60 minutes, 90 minutes, etc.)
- Price
- Which therapists are qualified to perform it

Speaking of therapists, the business owner needs to associate therapists with their business. They can invite therapists to join, review their credentials, and assign them to specific services. A single therapist might be qualified to perform multiple services, and a single service might have multiple therapists who can perform it.

Once the catalog is built and therapists are onboarded, the business is ready to accept bookings. When a customer books a service, the system automatically assigns an available therapist based on their schedule. The business owner can see this booking appear in their dashboard in real-time.

The business dashboard provides a bird's-eye view of operations:
- **Total Revenue:** Sum of all completed bookings
- **Booking Statistics:** How many total bookings, how many completed, how many cancelled
- **Popular Services:** Which services are booked most frequently
- **Top Performers:** Which therapists handle the most bookings and generate the most revenue
- **Monthly Trends:** Revenue broken down by month to identify growth patterns

Business owners can also generate comprehensive reports. Unlike therapists who focus on individual performance, business reports show the health of the entire operation. They can export these reports as professionally formatted PDFs or detailed Excel spreadsheets.

One critical feature is **cancellation performance monitoring**. The business can see not just customer cancellations, but also therapist cancellations. If a particular therapist is cancelling frequently, it impacts business operations and customer satisfaction. The dashboard highlights these patterns so management can address them.

The business dashboard also includes a review management section where owners can:
- See all reviews left for their business
- Monitor average ratings
- Read customer comments
- Identify top-rated therapists
- Spot areas needing improvement

---

### Persona 4: The Administrator

**Who they are:** Platform operators, system administrators, support staff

**Their Journey:**
Administrators have god-mode access to the entire platform. They can see everything happening across all businesses, all therapists, and all customers. Their responsibilities include:

- **User Management:** Helping users who have account issues, resetting passwords, resolving disputes
- **Master Data Management:** Maintaining service categories, ensuring data consistency
- **System Monitoring:** Watching for errors, monitoring performance, ensuring uptime
- **Background Job Control:** Managing scheduled tasks like the monthly cancellation reset
- **API Testing:** Using debug endpoints to verify functionality
- **Support:** Responding to help requests through the help center

Administrators have access to special API endpoints that regular users don't see, such as:
- Testing database connections
- Verifying API parameters
- Running diagnostic checks
- Manually triggering background jobs
- Viewing system-wide analytics

---

## 🔄 Chapter 3: Core System Flows Explained

### Flow 1: The Complete Booking Lifecycle

Let's follow a single booking from creation to completion:

**Stage 1: Discovery and Selection**
Mrs. Sharma wants to book a Swedish massage. She logs into Serenity and searches for "massage." The system shows her all available massage services. She filters by price (₹1500-₹2500) and rating (4+ stars). She sees three options and clicks on "Swedish Massage at Serenity Spa."

The service page shows:
- Detailed description of Swedish massage techniques
- Duration: 60 minutes
- Price: ₹2000
- Available therapists: Priya (4.8★), Anita (4.6★), Raj (4.9★)
- Customer reviews

She chooses Raj based on his high rating and reads his profile—he has 5 years of experience and specializes in deep tissue work.

**Stage 2: Availability Check**
Mrs. Sharma selects "Book Now." The system shows Raj's availability calendar for the next two weeks. Green slots are available, red slots are booked, gray slots are outside his working hours. She picks Thursday, March 26th at 3:00 PM.

Behind the scenes, the system queries Raj's availability record:
```javascript
{
  therapistId: raj._id,
  day: "Thursday",
  slots: ["10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"]
}
```

It cross-references with his existing bookings to exclude already-booked slots. The 3:00 PM slot (15:00-16:00) is free, so it's shown as available.

**Stage 3: Booking Creation**
She confirms the slot and proceeds to the booking summary page. Here she sees:
- Service: Swedish Massage
- Therapist: Raj
- Date: Thursday, March 26th
- Time: 3:00 PM - 4:00 PM
- Price: ₹2000

The system checks her reward points balance. She has 150 points. Since she has over 100 points, she qualifies for a 10% discount. The system automatically applies the discount:
- Original Price: ₹2000
- Discount (10%): -₹200
- **Final Price: ₹1800**

Her reward points will reset to 0 after payment.

**Stage 4: Payment Processing**
She clicks "Proceed to Payment." The system creates a Razorpay order:
```javascript
const order = await razorpay.orders.create({
  amount: 180000, // ₹1800 in paise
  currency: "INR",
  receipt: `booking_${newBookingId}`,
  notes: { customerId: mrsSharma._id }
});
```

Razorpay returns an order ID. The frontend opens Razorpay's checkout modal. Mrs. Sharma selects UPI and completes the payment. Razorpay processes it and returns a payment ID and signature.

**Stage 5: Verification and Confirmation**
The backend verifies the payment:
```javascript
const isValid = crypto
  .createHmac("sha256", RAZORPAY_SECRET)
  .update(orderId + "|" + paymentId)
  .digest("hex");

if (isValid === signature) {
  // Payment is genuine
  booking.paymentStatus = 'paid';
  booking.status = 'pending'; // awaiting therapist confirmation
  await booking.save();
  
  // Reset customer reward points
  customer.rewardPoints = 0;
  customer.rewardHistory.push({
    type: 'DISCOUNT_USED',
    points: -100,
    description: '10% discount used on booking'
  });
  await customer.save();
}
```

**Stage 6: Therapist Notification**
Raj (the therapist) receives a notification in his dashboard:
```
New Booking Request
Customer: Mrs. Sharma
Service: Swedish Massage
Date: Thursday, March 26th, 3:00 PM
[Confirm] [Decline]
```

He reviews it and clicks "Confirm." The booking status changes to "confirmed" and Mrs. Sharma receives an email:
```
Subject: Booking Confirmed! ✅

Your Swedish Massage with Raj is confirmed for 
Thursday, March 26th at 3:00 PM at Serenity Spa.

Booking ID: BK123456
```

**Stage 7: Service Delivery**
On March 26th, Mrs. Sharma arrives at Serenity Spa. Raj greets her, reviews any special requirements, and performs the massage. After the session, Raj marks the booking as "completed" in his app.

**Stage 8: Payment Settlement**
The ₹1800 payment is now distributed:
- ₹1260 (70%) → Raj's earnings account
- ₹540 (30%) → Serenity Spa's revenue

Both amounts are tracked in the system even though actual money settlement happens externally through Razorpay's payout system.

**Stage 9: Review and Rewards**
The next day, Mrs. Sharma gets an email:
```
How was your session with Raj?
[★★★★★] Leave a review and earn 10 reward points!
```

She clicks the link, rates Raj 5 stars, and writes:
*"Excellent massage! Raj was professional and skilled. Will definitely book again."*

Upon submission, she earns 10 reward points. Her balance goes from 0 to 10 points. One more review and she'll have enough for another discount!

**Stage 10: Analytics Update**
All of this activity feeds into various analytics dashboards:
- Mrs. Sharma's customer report now shows 1 more completed booking
- Raj's therapist report shows 1 more completed session, ₹1260 earnings, and a 5-star review
- Serenity Spa's business report shows ₹540 revenue and a satisfied customer

---

### Flow 2: Therapist Cancellation and Its Consequences

Let's explore what happens when a therapist needs to cancel a booking:

**Scenario Setup:**
Raj (therapist) has a booking scheduled for Friday at 2:00 PM with Mr. Gupta. On Thursday evening, Raj falls ill and realizes he can't make it.

**Step 1: Cancellation Request**
Raj logs into his dashboard, finds the booking, and clicks "Cancel Booking." A form appears asking for the reason. He selects "Illness" from the dropdown and adds a note: *"Down with fever, apologize for inconvenience."*

**Step 2: System Processing**
The cancellation is recorded:
```javascript
booking.status = 'cancelled';
booking.cancelledBy = 'therapist';
booking.therapistCancelReason = 'Illness: Down with fever';
booking.cancelledAt = new Date();
await booking.save();
```

**Step 3: Counter Increment**
The system checks Raj's cancellation history:
```javascript
const now = new Date();
const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

// Find how many times Raj has cancelled this month
const monthlyCancellations = await Booking.countDocuments({
  therapist: raj._id,
  status: 'cancelled',
  cancelledBy: 'therapist',
  cancelledAt: { $gte: currentMonthStart }
});

// monthlyCancellations = 2 (this is the 3rd cancellation)
raj.monthlyCancelCount = monthlyCancellations + 1; // Now 3
raj.totalCancelCount += 1; // Lifetime count
await raj.save();
```

**Step 4: Threshold Check**
The system evaluates the new cancellation count:
```javascript
if (raj.monthlyCancelCount >= 3 && raj.monthlyCancelCount < 5) {
  // Issue warning
  raj.cancelWarnings += 1;
  sendWarningEmail(raj.email, 'Cancellation Warning');
} else if (raj.monthlyCancelCount >= 5 && raj.monthlyCancelCount < 7) {
  // Apply 5% penalty
  raj.bonusPenaltyPercentage = -5;
  notifyAdmin(raj._id, 'Therapist penalty applied');
} else if (raj.monthlyCancelCount >= 7) {
  // Apply 10% penalty and flag for review
  raj.bonusPenaltyPercentage = -10;
  flagForReview(raj._id);
}
```

Since this is Raj's 3rd cancellation this month, he receives a formal warning. An email is sent to him and copied to the business administrator.

**Step 5: Customer Notification and Rebooking**
Mr. Gupta (customer) receives an email:
```
Important: Your Booking Has Been Cancelled

We regret to inform you that your Friday 2:00 PM session has been cancelled 
due to therapist illness. We sincerely apologize for the inconvenience.

Please log in to reschedule at your convenience. As compensation, 
we've added 20 bonus reward points to your account.
```

The system automatically credits 20 bonus points to Mr. Gupta's account as goodwill.

**Step 6: Impact on Earnings**
At the end of the month, when Raj's earnings are calculated, the system checks his bonus/penalty percentage:
```javascript
const baseEarnings = 14000; // Total from completed bookings
const penaltyRate = raj.bonusPenaltyPercentage; // -5%

if (penaltyRate < 0) {
  const penaltyAmount = baseEarnings * (Math.abs(penaltyRate) / 100);
  const finalEarnings = baseEarnings - penaltyAmount;
  // finalEarnings = 14000 - 700 = ₹13,300
}
```

So Raj loses ₹700 from his earnings due to the 5% penalty.

**Step 7: Monthly Reset**
On April 1st at midnight, the automated reset job runs:
```javascript
// utils/resetTherapistMonthlyCancellationCounters.ts
const therapists = await Therapist.find({
  $or: [
    { monthlyCancelCount: { $gt: 0 } },
    { cancelWarnings: { $gt: 0 } },
    { bonusPenaltyPercentage: { $ne: 0 } }
  ]
});

for (const therapist of therapists) {
  console.log(`Resetting ${therapist.fullName}:`);
  console.log(`  Previous monthlyCancelCount: ${therapist.monthlyCancelCount}`);
  console.log(`  Previous cancelWarnings: ${therapist.cancelWarnings}`);
  console.log(`  Previous bonusPenaltyPercentage: ${therapist.bonusPenaltyPercentage}`);
  
  therapist.monthlyCancelCount = 0;
  therapist.cancelWarnings = 0;
  therapist.bonusPenaltyPercentage = 0;
  therapist.lastResetDate = new Date();
  
  await therapist.save();
  
  console.log(`  ✓ Reset complete`);
}
```

Raj's record is updated:
- `monthlyCancelCount`: 3 → 0
- `cancelWarnings`: 1 → 0
- `bonusPenaltyPercentage`: -5 → 0
- `totalCancelCount`: remains unchanged (e.g., 15)

He starts April with a clean slate, though his lifetime cancellation count still shows 15.

---

### Flow 3: Report Generation Deep Dive

Let's examine how the reporting system works from multiple angles:

#### Customer Report Example

When Mrs. Sharma requests her customer report:

**API Call:**
```
GET /api/reports/customer?userId=67f3a2b1c4d5e6f7a8b9c0d1
```

**Backend Processing:**
The report service receives the request and begins gathering data:

1. **Find All Bookings:**
   ```javascript
   const bookings = await Booking.find({ customer: customerId })
     .populate('service', 'name price')
     .populate('therapist', 'fullName')
     .sort({ createdAt: -1 });
   ```
   
   This returns an array of all Mrs. Sharma's bookings with service and therapist details populated.

2. **Calculate Statistics:**
   ```javascript
   const totalBookings = bookings.length; // 12
   const completedBookings = bookings.filter(b => b.status === 'completed').length; // 10
   const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length; // 2
   
   const totalSpent = bookings
     .filter(b => b.status === 'completed')
     .reduce((sum, b) => sum + b.finalPrice, 0); // ₹22,000
   
   const totalDiscountUsed = bookings
     .reduce((sum, b) => sum + (b.discountApplied || 0), 0); // ₹400
   ```

3. **Find Most Booked Service:**
   ```javascript
   const serviceCount = {};
   bookings.forEach(b => {
     const name = b.service?.name || 'Unknown';
     serviceCount[name] = (serviceCount[name] || 0) + 1;
   });
   
   // serviceCount = {
   //   "Swedish Massage": 5,
   //   "Deep Tissue": 4,
   //   "Aromatherapy": 3
   // }
   
   const mostBookedService = Object.entries(serviceCount)
     .sort((a, b) => b[1] - a[1])[0][0]; // "Swedish Massage"
   ```

4. **Get Recent Bookings:**
   ```javascript
   const recentBookings = bookings.slice(0, 5).map(b => ({
     id: b._id,
     serviceName: b.service?.name,
     therapistName: b.therapist?.fullName,
     date: b.date,
     time: b.time,
     status: b.status,
     finalPrice: b.finalPrice
   }));
   ```

5. **Return Structured Data:**
   ```javascript
   return {
     totalBookings: 12,
     completedBookings: 10,
     cancelledBookings: 2,
     totalSpent: 22000,
     totalDiscountUsed: 400,
     mostBookedService: "Swedish Massage",
     recentBookings: [...]
   };
   ```

**Frontend Display:**
The customer dashboard receives this data and displays it in card format:
- Card 1: "Total Bookings: 12"
- Card 2: "Completed: 10"
- Card 3: "Cancelled: 2"
- Card 4: "Total Spent: ₹22,000"
- Card 5: "Discounts Used: ₹400"
- Card 6: "Favorite Service: Swedish Massage"

Below the cards, a table shows the 5 most recent bookings with columns for service, therapist, date, status, and price.

**PDF Export:**
If Mrs. Sharma clicks "Download PDF":
1. Frontend calls: `GET /api/reports/customer/pdf?userId=xxx`
2. Backend generates the same report data
3. Passes data to Puppeteer with an HTML template
4. Puppeteer renders the HTML in a headless Chrome browser
5. Converts it to a PDF document
6. Returns the PDF as a downloadable file

The PDF looks professional with:
- Serenity logo at the top
- Customer name and report date
- Summary statistics in a grid
- Recent bookings table
- Footer with page numbers

---

#### Therapist Custom Report Example

Raj wants to see his performance report but only cares about specific metrics this month.

**Frontend Selection:**
In the therapist dashboard, Raj sees checkboxes for different report fields:
- ☑ Total Bookings
- ☐ Completed Bookings
- ☑ Total Earnings
- ☑ Monthly Revenue
- ☐ Cancelled Bookings
- ☐ Service Breakdown

He selects only the fields he wants and clicks "Generate Report."

**API Call:**
```
GET /api/reports/therapist/custom?therapistId=raj_id&fields=totalBookings,totalEarnings,monthlyRevenue
```

**Backend Processing:**
The service iterates through requested fields:

```javascript
const reportData = {};

for (const field of selectedFields) {
  switch (field) {
    case 'totalBookings':
      reportData.totalBookings = bookings.length;
      reportData.allBookingsDetails = bookings.map(b => ({
        serviceName: b.service?.name,
        customerName: b.customer?.name,
        date: b.date,
        status: b.status
      }));
      break;
      
    case 'totalEarnings':
      const completed = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completed.reduce((sum, b) => {
        const price = b.finalPrice || b.originalPrice || b.service?.price || 0;
        return sum + (price * 0.7); // 70% share
      }, 0);
      
      reportData.totalEarnings = totalEarnings;
      reportData.earningsDetails = completed.map(b => ({
        serviceName: b.service?.name,
        bookingPrice: b.finalPrice,
        earnings: b.finalPrice * 0.7,
        date: b.date
      }));
      break;
      
    case 'monthlyRevenue':
      const monthlyRevenue = {};
      completed.forEach(b => {
        const month = new Date(b.createdAt).toISOString().slice(0, 7); // YYYY-MM
        const price = b.finalPrice || 0;
        const earnings = price * 0.7;
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + earnings;
      });
      
      reportData.monthlyRevenue = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => b.month.localeCompare(a.month));
      break;
  }
}

return reportData;
```

**Result:**
```javascript
{
  totalBookings: 45,
  allBookingsDetails: [...], // Array of 45 bookings
  totalEarnings: 63000,      // ₹63,000
  earningsDetails: [...],    // Breakdown per booking
  monthlyRevenue: [
    { month: "2026-03", revenue: 21000 },
    { month: "2026-02", revenue: 19500 },
    { month: "2026-01", revenue: 22500 }
  ]
}
```

**Why Custom Reports Matter:**
Some therapists want to see everything; others want focused insights. By allowing field selection, the system:
- Reduces data overload
- Improves performance (less data to process)
- Lets users focus on what matters to them
- Saves bandwidth and rendering time

---

### Flow 4: The Reward System Economy

The reward system is designed to encourage engagement and loyalty. Let's trace how points flow through the ecosystem:

**Earning Points:**

Mrs. Sharma (customer) can earn points through several activities:

1. **Submitting a Review:**
   - Completes a booking
   - Leaves a review with rating and comment
   - Earns 10 points instantly
   - System entry:
     ```javascript
     {
       type: 'REVIEW_REWARD',
       points: 10,
       description: 'Reward for submitting review',
       timestamp: new Date()
     }
     ```

2. **Completing a Booking:**
   - Some promotions offer 5 points per completed booking
   - Automatically credited after service completion

3. **First-Time User Bonus:**
   - When she created her account, she got 50 points
   - One-time welcome bonus

4. **Referral Program:**
   - She shares her referral code with a friend
   - Friend signs up and books their first service
   - She earns 100 points
   - Friend also earns 50 bonus points

**Point Caps and Limits:**
To prevent abuse, the system imposes limits:
- Maximum points from reviews per month: 50 (5 reviews)
- Maximum total points cap: 200
- Points expire after 12 months of inactivity

**Redeeming Points:**

Once Mrs. Sharma accumulates 100 points, she unlocks the ability to redeem:

**Redemption Rules:**
- 100 points = 10% discount on next booking
- Discount auto-applied at checkout if eligible
- Points reset to 0 after redemption
- Cannot combine with other offers

**Redemption Flow:**
```javascript
// During booking creation
const customer = await Customer.findById(customerId);

if (customer.rewardPoints >= 100) {
  // Eligible for discount
  const discountAmount = bookingPrice * 0.10;
  const finalPrice = bookingPrice - discountAmount;
  
  // Apply discount
  booking.originalPrice = bookingPrice;
  booking.discountApplied = discountAmount;
  booking.finalPrice = finalPrice;
  
  // Reset points
  customer.rewardPoints = 0;
  customer.rewardHistory.push({
    type: 'DISCOUNT_USED',
    points: -100,
    description: '10% reward discount used'
  });
  
  await customer.save();
  await booking.save();
}
```

**Tracking and Transparency:**

Customers can view their reward history in their dashboard:

```
Reward History:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date          | Type            | Points | Balance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mar 15, 2026  | Review Reward   | +10    | 150
Mar 10, 2026  | Booking Reward  | +5     | 140
Mar 05, 2026  | Discount Used   | -100   | 135
Feb 28, 2026  | Referral Bonus  | +100   | 235
Feb 20, 2026  | Review Reward   | +10    | 135
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Balance: 150 points (Next discount at 100)
```

**Business Impact:**

The reward system drives key business metrics:
- **Increased Reviews:** More social proof → higher conversion
- **Repeat Bookings:** Customers return to earn more points
- **Customer Loyalty:** Points create switching costs
- **Word-of-Mouth:** Referral bonuses bring new customers

---

## 🎯 Chapter 4: Special Features Deep Dive

### Feature 1: Multi-Layer Availability Management

Therapist availability is complex because it operates on multiple levels:

**Level 1: Base Availability**
Raj sets his standard weekly schedule:
```javascript
{
  therapistId: raj._id,
  availability: [
    { day: "Monday", slots: ["09:00-10:00", "10:00-11:00", "14:00-15:00", "15:00-16:00"] },
    { day: "Tuesday", slots: ["10:00-11:00", "11:00-12:00", "15:00-16:00"] },
    { day: "Wednesday", slots: ["09:00-10:00", "09:00-10:00"] },
    // ... etc for each day
  ]
}
```

This represents his ideal, recurring schedule.

**Level 2: Exception Handling**
But what if Raj wants to take a vacation next week? Or work extra hours on a particular day?

The system supports **exception dates**:
```javascript
{
  therapistId: raj._id,
  exceptions: [
    { 
      date: "2026-04-15", 
      slots: [],  // Completely off
      reason: "Vacation"
    },
    { 
      date: "2026-04-20", 
      slots: ["09:00-10:00", "10:00-11:00", "11:00-12:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"],
      reason: "Extra shift"
    }
  ]
}
```

When checking availability for a specific date, the system:
1. First checks if there's an exception for that date
2. If yes, uses the exception slots
3. If no, falls back to the base weekly schedule for that day of week

**Level 3: Real-Time Booking Conflicts**
Even if a slot exists in the availability, it might already be booked. So the system performs a real-time check:

```javascript
async function getAvailableSlots(therapistId, date) {
  // Step 1: Get base or exception slots for this date
  let slots = await getBaseOrExceptionSlots(therapistId, date);
  
  // Step 2: Find already-booked slots
  const bookings = await Booking.find({
    therapist: therapistId,
    date: date,
    status: { $in: ['pending', 'confirmed'] }
  });
  
  const bookedSlots = bookings.map(b => b.time);
  
  // Step 3: Remove booked slots from available slots
  const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));
  
  return availableSlots;
}
```

This three-layer approach ensures customers only see truly available slots.

---

### Feature 2: Dynamic Pricing and Discounts

The platform supports sophisticated pricing strategies:

**Base Pricing:**
Each service has a base price stored in the database:
```javascript
{
  _id: serviceId,
  name: "Swedish Massage",
  price: 2000,  // Base price in INR
  duration: 60
}
```

**Dynamic Adjustments:**

1. **Time-Based Pricing (Future Feature):**
   - Peak hours (evenings, weekends): +10%
   - Off-peak hours (weekday mornings): -10%

2. **Therapist Experience Premium:**
   - Junior therapist (0-2 years): Base price
   - Mid-level (3-5 years): Base + 10%
   - Senior (5+ years): Base + 20%

3. **Bundle Discounts:**
   - Book 5 sessions upfront: 15% off
   - Monthly membership: Unlimited sessions for fixed fee

**Current Discount System:**

The active discount system is the reward-based discount:

```javascript
function applyRewardDiscount(customer, bookingPrice) {
  if (customer.rewardPoints >= 100) {
    return {
      originalPrice: bookingPrice,
      discount: bookingPrice * 0.10,
      finalPrice: bookingPrice * 0.90,
      pointsToDeduct: 100
    };
  } else {
    return {
      originalPrice: bookingPrice,
      discount: 0,
      finalPrice: bookingPrice,
      pointsToDeduct: 0
    };
  }
}
```

**Display Logic:**
On the booking summary page, the pricing is shown transparently:
```
Service Price:           ₹2,000
Reward Discount (10%):   -₹200
─────────────────────────────────
You Pay:                 ₹1,800
```

---

### Feature 3: Automated Background Jobs

The system runs several automated tasks in the background:

**Job 1: Monthly Cancellation Reset**

**Schedule:** `0 0 1 * *` (Midnight, 1st of every month)

**What it does:**
- Finds all therapists with non-zero cancellation counters
- Resets their monthly counters to zero
- Logs detailed before/after values
- Sends summary email to admin

**Implementation:**
```javascript
// utils/scheduledJobs/resetTherapistCancellationCountersJob.ts
import cron from 'node-cron';
import { resetTherapistMonthlyCancellationCounters } from '../resetTherapistMonthlyCancellationCounters';

export function initializeResetJob() {
  cron.schedule('0 0 1 * *', async () => {
    console.log('[JOB] Starting monthly cancellation reset...');
    
    try {
      const result = await resetTherapistMonthlyCancellationCounters();
      console.log('[JOB] Reset complete:', result);
    } catch (error) {
      console.error('[JOB] Error during reset:', error);
      notifyAdmin('Monthly reset failed', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });
}
```

**Execution Flow:**
1. Cron triggers at midnight on April 1st
2. Job manager initializes
3. Calls the reset function
4. Reset function connects to MongoDB
5. Queries therapists with active counters
6. Iterates through each therapist:
   - Reads current values
   - Sets counters to zero
   - Updates last reset date
   - Saves to database
   - Logs the change
7. Disconnects from database
8. Returns summary statistics
9. Job manager logs completion

**Sample Output:**
```
[JOB] Starting monthly cancellation reset...
[RESET] Found 15 therapists with non-zero counters
[RESET] Processing therapist Raj Kumar (ID: 67f3a...)
  Previous: monthlyCancelCount=3, warnings=1, penalty=-5%
  New: monthlyCancelCount=0, warnings=0, penalty=0%
[RESET] Processing therapist Priya Singh (ID: 68a4b...)
  Previous: monthlyCancelCount=1, warnings=0, penalty=0%
  New: monthlyCancelCount=0, warnings=0, penalty=0%
... (12 more therapists)
[RESET] Reset complete. Processed 15 therapists.
[JOB] Reset complete: { success: true, processed: 15, errors: 0 }
```

**Job 2: Expired Booking Cleanup**

**Schedule:** `*/15 * * * *` (Every 15 minutes)

**What it does:**
- Finds bookings stuck in "pending" status for >24 hours
- Auto-cancels them
- Releases the therapist's slot
- Notifies the customer

**Why it matters:**
Without this cleanup, therapists' schedules would have phantom bookings that never get confirmed or cancelled, blocking slots that could be booked by others.

---

## 🔐 Chapter 5: Security and Data Protection

### Authentication: How Login Works

When a user logs in:

**Step 1: Credential Submission**
```javascript
// Frontend sends
POST /api/auth/login
{
  email: "raj.therapist@email.com",
  password: "SecurePassword123!"
}
```

**Step 2: Password Verification**
```javascript
// Backend logic
const user = await User.findOne({ email });
if (!user) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

const isMatch = await bcrypt.compare(password, user.password);
// user.password contains hashed password like: $2a$10$xyz123...
if (!isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

The bcrypt comparison ensures the plaintext password matches the stored hash without ever storing the actual password.

**Step 3: Token Generation**
```javascript
const token = jwt.sign(
  { 
    userId: user._id, 
    email: user.email, 
    role: user.role 
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Token looks like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.yyyyy
```

**Step 4: Token Delivery**
```javascript
res.json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }
});
```

**Step 5: Client Storage**
Frontend stores the token in localStorage:
```javascript
localStorage.setItem('authToken', token);
```

**Step 6: Subsequent Requests**
Every API call includes the token:
```javascript
fetch('/api/bookings', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Step 7: Token Verification**
```javascript
// Middleware on protected routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
};
```

### Authorization: Role-Based Access Control

Not all users should access all resources. The system enforces permissions:

**Permission Matrix:**

| Resource | Customer | Therapist | Business | Admin |
|----------|----------|-----------|----------|-------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ❌ | ✅ |
| Create booking | ✅ | ❌ | ❌ | ❌ |
| View assigned bookings | ❌ | ✅ | ❌ | ✅ |
| Manage services | ❌ | ❌ | ✅ | ✅ |
| View all bookings | ❌ | ❌ | ✅ (own business) | ✅ |
| Delete any resource | ❌ | ❌ | ❌ | ✅ |

**Implementation Example:**
```javascript
// Route to delete a booking
app.delete('/api/bookings/:id',
  authMiddleware,
  authorize(['admin']),  // Only admins can delete
  async (req, res) => {
    await Booking.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  }
);

// Route to update own profile
app.put('/api/users/me',
  authMiddleware,
  authorize(['customer', 'therapist', 'business']),
  async (req, res) => {
    // Users can only update their own profile
    const userId = req.user.userId;
    await User.findByIdAndUpdate(userId, req.body);
    res.json({ success: true });
  }
);
```

### Data Validation and Sanitization

All user input is validated:

**Example: Creating a Booking**
```javascript
function validateBookingInput(data) {
  const errors = [];
  
  // Check required fields exist
  if (!data.customerId) errors.push('Customer ID is required');
  if (!data.serviceId) errors.push('Service ID is required');
  if (!data.date) errors.push('Date is required');
  if (!data.time) errors.push('Time is required');
  
  // Validate ObjectId format
  if (data.customerId && !mongoose.Types.ObjectId.isValid(data.customerId)) {
    errors.push('Invalid customer ID format');
  }
  
  // Validate date is not in past
  const bookingDate = new Date(data.date);
  if (bookingDate < new Date()) {
    errors.push('Cannot book appointments in the past');
  }
  
  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(data.time)) {
    errors.push('Time must be in HH:MM format');
  }
  
  // Validate time is reasonable (00:00 to 23:00)
  const [hours] = data.time.split(':').map(Number);
  if (hours < 0 || hours > 23) {
    errors.push('Invalid hour value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

If validation fails, the API returns:
```json
{
  "success": false,
  "errors": [
    "Invalid customer ID format",
    "Cannot book appointments in the past"
  ]
}
```

---

## 📊 Chapter 6: Performance and Scalability

### Database Indexing Strategy

To ensure fast queries, strategic indexes are created:

**High-Impact Indexes:**

```javascript
// Bookings are frequently queried by customer + date
db.bookings.createIndex({ customerId: 1, createdAt: -1 });
// Speeds up: "Show me all my bookings"

// Therapists are queried by availability
db.therapists.createIndex({ "businessAssociations.businessId": 1 });
// Speeds up: "Show all therapists at this business"

// Services are searched by name
db.services.createIndex({ name: "text" });
// Enables full-text search: "Find massage services"

// Users need unique emails
db.users.createIndex({ email: 1 }, { unique: true });
// Ensures no duplicate emails and speeds up login
```

**Impact:**
Without indexes, finding a customer's bookings requires scanning every booking in the database (O(n)). With an index, it's a direct lookup (O(log n)).

---

### Query Optimization Techniques

**Problem: Over-Population**
```javascript
// ❌ SLOW - Populating everything
const booking = await Booking.findById(id)
  .populate('customer')
  .populate('therapist')
  .populate('service')
  .populate('business');

// This runs 4 separate database queries!
```

**Solution: Selective Population**
```javascript
// ✅ FAST - Only populate needed fields
const booking = await Booking.findById(id)
  .populate('service', 'name price')  // Only name and price
  .populate('therapist', 'fullName'); // Only full name

// Much faster, less data transferred
```

**Lean Queries for Read-Only Operations:**
```javascript
// Without .lean() - Returns Mongoose documents (heavy)
const bookings = await Booking.find({ customerId });
bookings[0].save(); // Can modify

// With .lean() - Returns plain JS objects (lightweight)
const bookings = await Booking.find({ customerId }).lean();
// Cannot modify, but 2-3x faster and uses less memory
```

---

## 🚀 Chapter 7: Deployment and Operations

### Environment Setup

The application requires environment variables to run:

**.env.local Configuration:**
```bash
# Database Connection
MONGODB_URI=mongodb://localhost:27017/wellness-platform

# JWT Secret Key (change in production!)
JWT_SECRET=your-super-secret-key-change-in-production

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxx

# Email Service (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Background Task Security
BACKGROUND_TASK_SECRET=optional-secret-for-api-auth

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Environment
NODE_ENV=production
```

### Local Development Setup

**Step-by-Step:**

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd wellness-platform/wellness-app
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start MongoDB:**
   ```bash
   # If running locally
   mongod --config /usr/local/etc/mongod.conf
   
   # Or use MongoDB Atlas cloud database
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

6. **Access Application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/*

### Production Deployment

**Option 1: Traditional Server (VPS/EC2)**

1. **Build Application:**
   ```bash
   npm run build
   ```

2. **Start Production Server:**
   ```bash
   npm start
   ```

3. **Use Process Manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start npm --name "wellness-app" -- start
   pm2 save
   pm2 startup
   ```

**Option 2: Docker Container**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t wellness-app .
docker run -p 3000:3000 --env-file .env.local wellness-app
```

**Option 3: Serverless (Vercel/Netlify)**

1. Push code to GitHub
2. Connect Vercel to repository
3. Set environment variables in Vercel dashboard
4. Deploy

Note: Serverless requires adjusting the cron job implementation to use external cron services instead of integrated node-cron.

---

## 🎓 Chapter 8: Learning the System

### For New Developers

**Week 1: Orientation**
- Day 1-2: Read this documentation thoroughly
- Day 3: Set up local development environment
- Day 4: Explore the codebase structure
- Day 5: Make a simple change (e.g., update a label)

**Week 2: Deep Dive**
- Study the database models in `models/` folder
- Trace a booking through the entire flow
- Run test endpoints to see APIs in action

**Week 3: Hands-On**
- Fix a small bug
- Add a simple feature (e.g., new validation rule)
- Write a test for an existing feature

**Week 4: Independence**
- Take ownership of a module
- Propose improvements
- Document your learnings

### For End Users

**Customer Quick Start:**
1. Create account
2. Browse services
3. Book your first appointment
4. Show up and enjoy the service
5. Leave a review and earn points

**Therapist Quick Start:**
1. Receive login credentials from business
2. Log in and complete your profile
3. Set your weekly availability
4. Start receiving booking requests
5. Confirm bookings and track earnings

**Business Quick Start:**
1. Register your business
2. Create service catalog
3. Invite therapists to join
4. Assign therapists to services
5. Start accepting bookings

---

## 📞 Chapter 9: Support and Resources

### Debugging Tools

**Built-in Test Endpoints:**
```
GET /api-test              - Check if API is healthy
GET /auth-test             - Test authentication flow
GET /api/test-all-therapists - List all therapists
GET /api/test-businesses    - List test businesses
```

**Debug Pages:**
```
/debug-business-reviews         - View business reviews debug info
/debug-business-reviews-full    - Full review data
/simple-business-debug          - Simplified business data view
```

**Logging:**
All major operations log to console:
```javascript
console.log('[BOOKING] Creating new booking:', { customerId, serviceId });
console.log('[PAYMENT] Processing payment:', amount);
console.log('[ERROR] Failed to create booking:', error.message);
```

### Troubleshooting Common Issues

**Issue: "Cannot connect to database"**
- Check if MongoDB is running
- Verify MONGODB_URI in .env.local
- Ensure network access (if using cloud MongoDB)

**Issue: "Payment failed"**
- Verify Razorpay credentials
- Check if test mode vs live mode keys are correct
- Inspect browser console for frontend errors

**Issue: "Emails not sending"**
- Verify SMTP credentials
- Check if Gmail requires app-specific password
- Review spam folder

**Issue: "Monthly reset job not running"**
- Check if node-cron is initialized in layout.tsx
- Verify server is running continuously (not serverless)
- Consider using external cron service alternative

---

## 🌟 Conclusion

Serenity is more than just a booking platform—it's a comprehensive ecosystem that connects customers, therapists, and businesses in a seamless wellness experience. Every feature, from reward points to cancellation tracking, from custom reports to automated jobs, works together to create a professional, efficient, and user-friendly service.

The platform is built on modern, scalable technologies and follows best practices for security, performance, and maintainability. Whether you're a developer extending the system, a business owner managing operations, a therapist building your practice, or a customer seeking relaxation, Serenity provides the tools you need to succeed.

As the platform evolves, new features will be added, but the core mission remains the same: making wellness accessible, manageable, and rewarding for everyone.

---

**End of Descriptive System Guide**

---

**Document Information:**
- **Created:** March 23, 2026
- **Version:** 1.0
- **Maintained By:** Development Team
- **For Questions:** Use the in-app help center or contact your system administrator
