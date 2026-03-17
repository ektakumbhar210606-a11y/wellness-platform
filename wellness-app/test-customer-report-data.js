const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const BookingModel = require('./models/Booking');
const UserModel = require('./models/User');

async function testCustomerBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a customer user
    const customerUser = await UserModel.findOne({ role: 'Customer' });
    
    if (!customerUser) {
      console.log('❌ No customer users found in database');
      return;
    }

    console.log('\n✅ Found customer user:');
    console.log('   ID:', customerUser._id.toString());
    console.log('   Name:', customerUser.name);
    console.log('   Email:', customerUser.email);

    // Find bookings for this customer
    const bookings = await BookingModel.find({ 
      customer: customerUser._id 
    }).populate('service', 'name price')
      .populate('therapist', 'fullName');

    console.log('\n📊 Bookings found:', bookings.length);

    if (bookings.length > 0) {
      console.log('\nRecent bookings:');
      bookings.slice(0, 3).forEach((booking, idx) => {
        console.log(`\n${idx + 1}. Booking ${booking._id.toString().slice(-6)}`);
        console.log('   Status:', booking.status);
        console.log('   Service:', booking.service?.name || 'N/A');
        console.log('   Price:', booking.service?.price || booking.finalPrice || 0);
        console.log('   Date:', booking.date);
        console.log('   Therapist:', booking.therapist?.fullName || 'N/A');
      });
    } else {
      console.log('\n⚠️  This customer has NO bookings in the database');
      console.log('\n💡 To test the report, you need to:');
      console.log('   1. Create some bookings for this customer, OR');
      console.log('   2. Login with a different customer account that has bookings');
    }

    // Count total bookings by status
    const statusCounts = {};
    bookings.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    
    console.log('\n📈 Booking status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCustomerBookings();
