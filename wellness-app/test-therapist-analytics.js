/**
 * Test script for Therapist Analytics API
 * Tests the /api/therapist/analytics endpoint
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const BookingModel = require('./models/Booking').default;
const TherapistModel = require('./models/Therapist').default;
const ServiceModel = require('./models/Service').default;
const UserModel = require('./models/User').default;
const ReviewModel = require('./models/Review').default;
const { BookingStatus } = require('./models/Booking');

async function testTherapistAnalytics() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness');
    console.log('✓ Connected to database\n');

    // Find a therapist with bookings
    const therapist = await TherapistModel.findOne({});
    
    if (!therapist) {
      console.log('❌ No therapist found in database');
      return;
    }

    console.log(`Testing analytics for therapist: ${therapist.fullName}`);
    console.log(`Therapist ID: ${therapist._id}\n`);

    // Get all bookings for this therapist
    const bookings = await BookingModel.find({ 
      therapist: therapist._id 
    }).populate('service');

    console.log(`📊 Found ${bookings.length} total bookings\n`);

    if (bookings.length === 0) {
      console.log('No bookings found for this therapist.');
      console.log('The analytics API will return empty state data.\n');
    } else {
      // Calculate expected analytics manually
      const totalSessionsCompleted = bookings.filter(b => b.status === BookingStatus.Completed).length;
      
      // Calculate total earnings from completed bookings
      const totalEarnings = bookings
        .filter(b => b.status === BookingStatus.Completed)
        .reduce((sum, b) => sum + (b.therapistPayoutAmount || 0), 0);
      
      // Get reviews for this therapist
      const reviews = await ReviewModel.find({ therapist: therapist._id });
      const averageRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

      // Group by month for earnings trend
      const monthlyEarningsMap = {};
      bookings.filter(b => b.status === BookingStatus.Completed).forEach(booking => {
        const month = booking.date.toISOString().slice(0, 7);
        if (!monthlyEarningsMap[month]) {
          monthlyEarningsMap[month] = 0;
        }
        monthlyEarningsMap[month] += (booking.therapistPayoutAmount || 0);
      });
      
      const monthlyEarnings = Object.entries(monthlyEarningsMap).map(([month, earnings]) => ({
        month,
        earnings
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Group by month for sessions
      const monthlySessionsMap = {};
      bookings.filter(b => b.status === BookingStatus.Completed).forEach(booking => {
        const month = booking.date.toISOString().slice(0, 7);
        if (!monthlySessionsMap[month]) {
          monthlySessionsMap[month] = 0;
        }
        monthlySessionsMap[month]++;
      });
      
      const monthlySessions = Object.entries(monthlySessionsMap).map(([month, sessions]) => ({
        month,
        sessions
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Group by service
      const serviceMap = {};
      bookings.filter(b => b.status === BookingStatus.Completed).forEach(booking => {
        const serviceName = booking.service?.name || 'Unknown';
        serviceMap[serviceName] = (serviceMap[serviceName] || 0) + 1;
      });
      
      const serviceDistribution = Object.entries(serviceMap).map(([service, totalSessions]) => ({
        serviceName: service,
        totalSessions
      })).sort((a, b) => b.totalSessions - a.totalSessions);

      // Display expected results
      console.log('=== EXPECTED ANALYTICS ===');
      console.log(`Total Sessions Completed: ${totalSessionsCompleted}`);
      console.log(`Total Earnings: $${totalEarnings.toFixed(2)}`);
      console.log(`Average Rating: ${averageRating}`);
      console.log(`Monthly Bonus Earned: $0.00 (no bonus model)`);
      
      console.log('\nMonthly Earnings Trend:');
      monthlyEarnings.forEach(item => {
        console.log(`  - ${item.month}: $${item.earnings.toFixed(2)}`);
      });

      console.log('\nMonthly Sessions:');
      monthlySessions.forEach(item => {
        console.log(`  - ${item.month}: ${item.sessions} sessions`);
      });

      console.log('\nService Distribution:');
      serviceDistribution.forEach(item => {
        console.log(`  - ${item.serviceName}: ${item.totalSessions} sessions`);
      });

      console.log('\n✅ Manual calculation complete');
    }
    
    console.log('\n=== API TESTING ===');
    console.log('To test the actual API endpoint:');
    console.log('1. Make sure the development server is running');
    console.log('2. Navigate to the therapist dashboard');
    console.log('3. Click on the "Analytics" tab in the sidebar');
    console.log('4. The analytics page should display:');
    console.log('   - Summary cards (Sessions, Earnings, Rating, Bonus)');
    console.log('   - Monthly Earnings Trend (Line Chart)');
    console.log('   - Completed Sessions Per Month (Bar Chart)');
    console.log('   - Rating Trend Per Month (Line Chart)');
    console.log('   - Service Distribution (Pie Chart)');
    console.log('   - Monthly Reviews Count (Bar Chart)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
  }
}

// Run the test
testTherapistAnalytics();
