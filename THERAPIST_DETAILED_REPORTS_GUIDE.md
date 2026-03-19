# Therapist Detailed Reports - User Guide

## 📊 Overview

The therapist dashboard now generates **comprehensive detailed reports** for each selected option, not just summary numbers!

---

## 🎯 How to Generate Detailed Reports

### Step 1: Navigate to Reports
- Go to **Therapist Dashboard** → **Reports** (in the sidebar menu)

### Step 2: Select Report Fields
Choose from these detailed report options:

#### **📋 Total Bookings Overview**
- **Summary Card**: Shows total number of all bookings
- **Detailed Table**: Complete list of ALL bookings with:
  - Service name
  - Customer name (first + last)
  - Date & Time
  - Status (Pending/Confirmed/Completed/Cancelled)
  - Your earnings (70% of booking price)
  - Sortable columns
  - Pagination (10 per page)

#### **✅ Completed Bookings Details**
- **Summary Card**: Number of completed bookings
- **Detailed Table**: All completed bookings with:
  - Service name
  - Customer name
  - Date & Time
  - Your earnings
  - **Summary row**: Total earnings from completed bookings

#### **❌ Cancelled Bookings Details**
- **Summary Card**: Number of cancelled bookings
- **Detailed Table**: All cancelled bookings with:
  - Service name
  - Customer name
  - Date
  - **Cancellation reason** (very important!)
  - When it was cancelled
  - Helps track cancellation patterns

#### **💰 Earnings Breakdown**
- **Summary Card**: Total earnings amount
- **Detailed Table**: Every completed booking's financial details:
  - Service name
  - Customer name
  - Date
  - **Booking price** (what customer paid)
  - **Your earnings** (70% of booking price)
  - **Summary row**: Total booking value + your total earnings

#### **🎯 Services Performed Details**
- **Summary Card**: Number of unique services you've performed
- **Detailed Table**: Service-wise breakdown:
  - Service name
  - How many times performed
  - Total earnings from this service
  - Average earnings per session
  - **Summary row**: Total services + total earnings

#### **📅 Monthly Cancellations Analysis**
- **Summary Card**: Number of cancellations this month
- **Purpose**: Track your monthly cancellation performance
- **Important**: Affects your bonus/penalty percentage

#### **🎁 Bonus/Penalty %**
- **Summary Card**: Your current bonus or penalty percentage
- **Based on**: Cancellation rate
  - < 5% cancellation = +5% bonus
  - > 20% cancellation = -10% penalty

#### **📜 Recent Bookings (Last 10)**
- **Detailed Table**: Your 10 most recent bookings:
  - Service name
  - Customer name
  - Full date & time
  - Status with color coding
  - Earnings
  - **Summary row**: Quick stats

#### **📊 Monthly Revenue Trend**
- **Detailed Table**: Month-by-month revenue:
  - Month name & year
  - Total revenue for that month
  - Sorted by most recent first
  - Helps identify trends

#### **📈 Service-wise Breakdown**
- **Detailed Table**: Analytics by service type:
  - Service name
  - Total bookings count
  - Total earnings
  - Average per booking
  - **Summary row**: Totals + averages

---

## 🎨 Features of Detailed Reports

### Interactive Tables
- **Sortable**: Click column headers to sort
- **Paginated**: Easy navigation through large datasets
- **Searchable**: Find specific entries
- **Color-coded status**: 
  - 🟢 Green = Completed
  - 🔴 Red = Cancelled
  - 🟡 Yellow = Pending
  - 🔵 Blue = Confirmed

### Summary Rows
Every detailed table includes summary rows showing:
- Totals
- Averages
- Key metrics

### Export Options
After generating reports:
- **📄 Download PDF**: Professional formatted report
- **📊 Download Excel**: Raw data for further analysis

---

## 💡 Usage Tips

### For Performance Reviews
Select these fields:
- ✅ Completed Bookings Details
- 💰 Earnings Breakdown
- 📊 Monthly Revenue Trend
- 🎁 Bonus/Penalty %

### For Business Planning
Select these fields:
- 📈 Service-wise Breakdown
- 🎯 Services Performed Details
- 📊 Monthly Revenue Trend

### For Identifying Issues
Select these fields:
- ❌ Cancelled Bookings Details (check reasons)
- 📅 Monthly Cancellations Analysis
- 📋 Total Bookings Overview

### For Marketing Insights
Select these fields:
- 📈 Service-wise Breakdown (see popular services)
- 📜 Recent Bookings (see recent trends)
- 🎯 Services Performed Details

---

## 🔍 Example Use Cases

### Use Case 1: Monthly Performance Review
1. Select: Completed Bookings, Earnings Breakdown, Monthly Revenue
2. Generate Report
3. Review: Total earnings, monthly trends, completion rate
4. Export: PDF for records

### Use Case 2: Service Popularity Analysis
1. Select: Service-wise Breakdown, Services Performed
2. Generate Report
3. Review: Which services you perform most, which earn most
4. Action: Focus on high-demand, high-earning services

### Use Case 3: Cancellation Pattern Analysis
1. Select: Cancelled Bookings Details, Monthly Cancellations
2. Generate Report
3. Review: Why bookings are getting cancelled, what time, which customers
4. Action: Identify patterns, reduce future cancellations

---

## 📱 What You'll See

### Before (Old System)
```
Total Bookings: 45
Completed: 38
Cancelled: 5
Earnings: ₹50,000
```

### After (New Detailed Reports)
```
Total Bookings: 45
[Full table showing all 45 bookings with customer names, dates, services, status]

Completed Bookings: 38
[Table with 38 rows showing each completed booking, earnings per booking]

Earnings: ₹50,000
[Breakdown showing: Booking #1: ₹2000, Booking #2: ₹3500, etc.]

Services Performed: 12
[List of 12 different services with count and earnings for each]
```

---

## 🚀 Quick Start

1. **Login** to therapist dashboard
2. Click **"Reports"** in sidebar
3. **Check boxes** for reports you want to see
4. Click **"Generate Report"**
5. **Scroll down** to see detailed tables
6. **Export** as PDF or Excel if needed

---

## ⚠️ Important Notes

1. **Customer Names**: Now properly displayed using firstName + lastName from User model
2. **Pagination**: Large datasets are paginated (10 items per page)
3. **Real-time Data**: Reports show live data from database
4. **70% Earnings**: Your earnings calculated as 70% of booking price
5. **Cancellation Reasons**: Visible in cancelled bookings table

---

## 🛠️ Technical Details

### Data Sources
- **Bookings**: From Booking collection
- **Customer Info**: From User collection (firstName, lastName)
- **Service Info**: From Service collection (name, price)
- **Earnings Calculation**: 70% of finalPrice for completed bookings

### Report Generation
- **API**: `/api/reports/therapist/custom`
- **Method**: POST with selectedFields array
- **Response**: Comprehensive data object with both counts and detailed arrays

---

## 📞 Support

If you're still seeing only numbers without detailed tables:
1. Make sure you've clicked "Generate Report" after selecting fields
2. Check browser console for errors
3. Verify you have bookings in the system
4. Try refreshing the page

---

**Last Updated**: March 19, 2026
**Version**: 2.0 - Complete with Detailed Reports
