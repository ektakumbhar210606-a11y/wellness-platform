/**
 * Test script for Customer Analytics API
 * Tests the /api/customer/analytics endpoint
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const BookingModel = require('./models/Booking').default;
const TherapistModel = require('./models/Therapist').default;
const ServiceModel = require('./models/Service').default;
const UserModel = require('./models/User').default;

async function testCustomerAnalytics() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness');
    console.log('✓ Connected to database\n');

    // Find a customer with bookings
    const customer = await UserModel.findOne({ role: 'Customer' });
    
    if (!customer) {
      console.log('❌ No customer found in database');
      return;
    }

    console.log(`Testing analytics for customer: ${customer.name} (${customer.email})`);
    console.log(`Customer ID: ${customer._id}\n`);

    // Get all bookings for this customer
    const bookings = await BookingModel.find({ 
      customer: customer._id 
    }).populate('service therapist');

    console.log(`📊 Found ${bookings.length} total bookings\n`);

    if (bookings.length === 0) {
      console.log('No bookings found. Creating test data...');
      
      // Create a test service if none exists
      let service = await ServiceModel.findOne();
      if (!service) {
        const business = await mongoose.model('Business').findOne();
        if (!business) {
          console.log('No business found. Please create a business first.');
          return;
        }
        
        const serviceCategory = await mongoose.model('ServiceCategory').findOne();
        if (!serviceCategory) {
          console.log('No service category found. Please create one first.');
          return;
        }

        service = new ServiceModel({
          business: business._id,
          serviceCategory: serviceCategory._id,
          name: 'Swedish Massage',
          price: 100,
          duration: 60
        });
        await service.save();
        console.log('✓ Created test service');
      }

      // Create a test therapist if none exists
      let therapist = await TherapistModel.findOne();
      if (!therapist) {
        const user = await UserModel.findOne({ role: 'Therapist' });
        if (!user) {
          console.log('No therapist user found. Creating one...');
          const therapistUser = new UserModel({
            name: 'Test Therapist',
            email: `therapist_test_${Date.now()}@test.com`,
            password: 'password123',
            role: 'Therapist'
          });
          await therapistUser.save();
          
          therapist = new TherapistModel({
            user: therapistUser._id,
            experience: 5,
            skills: ['manual_massage_techniques'],
            fullName: 'Dr. Test Therapist'
          });
          await therapist.save();
          console.log('✓ Created test therapist');
        } else {
          therapist = await TherapistModel.findOne({ user: user._id });
        }
      }

      // Create some test bookings
      const completedBooking = new BookingModel({
        customer: customer._id,
        therapist: therapist._id,
        service: service._id,
        date: new Date(),
        time: '10:00',
        status: 'completed'
      });
      await completedBooking.save();

      const pendingBooking = new BookingModel({
        customer: customer._id,
        therapist: therapist._id,
        service: service._id,
        date: new Date(Date.now() + 86400000), // Tomorrow
        time: '14:00',
        status: 'pending'
      });
      await pendingBooking.save();

      console.log('✓ Created test bookings\n');
      
      // Refresh bookings
      const freshBookings = await BookingModel.find({ 
        customer: customer._id 
      }).populate('service therapist');
      
      console.log(`📊 Updated: ${freshBookings.length} total bookings\n`);
    }

    // Calculate expected analytics manually
    const totalBookings = bookings.length;
    const totalCompleted = bookings.filter(b => b.status === 'completed').length;
    
    // Group by service
    const serviceMap = {};
    bookings.forEach(booking => {
      const serviceName = booking.service?.name || 'Unknown';
      serviceMap[serviceName] = (serviceMap[serviceName] || 0) + 1;
    });
    
    const serviceBreakdown = Object.entries(serviceMap).map(([service, count]) => ({
      service,
      count
    })).sort((a, b) => b.count - a.count);

    // Group by therapist
    const therapistMap = {};
    bookings.forEach(booking => {
      const therapistName = booking.therapist?.fullName || 'Unknown';
      therapistMap[therapistName] = (therapistMap[therapistName] || 0) + 1;
    });
    
    const therapistBreakdown = Object.entries(therapistMap).map(([name, count]) => ({
      therapistName: name,
      count
    })).sort((a, b) => b.count - a.count);

    // Group by month
    const monthlyMap = {};
    bookings.forEach(booking => {
      const month = booking.date.toISOString().slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    
    const monthlyBookings = Object.entries(monthlyMap).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Display expected results
    console.log('=== EXPECTED ANALYTICS ===');
    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`Completed Bookings: ${totalCompleted}`);
    console.log(`Most Booked Service: ${serviceBreakdown[0]?.service || 'N/A'}`);
    
    console.log('\nService Breakdown:');
    serviceBreakdown.forEach(item => {
      console.log(`  - ${item.service}: ${item.count}`);
    });

    console.log('\nTherapist Breakdown:');
    therapistBreakdown.forEach(item => {
      console.log(`  - ${item.therapistName}: ${item.count}`);
    });

    console.log('\nMonthly Bookings:');
    monthlyBookings.forEach(item => {
      console.log(`  - ${item.month}: ${item.count}`);
    });

    console.log('\n✅ Manual calculation complete');
    console.log('\nTo test the actual API endpoint:');
    console.log(`1. Start the development server`);
    console.log(`2. Login as: ${customer.email}`);
    console.log(`3. Navigate to: /dashboard/customer/analytics`);
    console.log(`4. Or call: GET /api/customer/analytics with Bearer token\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database connection closed');
  }
}

// Run the test
testCustomerAnalytics();
