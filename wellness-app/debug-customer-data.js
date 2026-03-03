/**
 * Debug script to check customer data retrieval from database
 */

// Import required modules
const mongoose = require('mongoose');

// Connect to database
require('dotenv').config({ path: '.env.local' });

async function debugCustomerData() {
  try {
    // Connect to database (similar to how the API does it)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness');
    
    // Import models
    const BookingModel = require('../../../models/Booking');
    const UserModel = require('../../../models/User');
    
    console.log('=== Debugging Customer Data Retrieval ===\n');
    
    // Test 1: Check if customer data exists in bookings
    console.log('1. Checking bookings with customer population...');
    const bookingsWithCustomer = await BookingModel.find({ paymentStatus: 'paid' })
      .populate({
        path: 'customer',
        select: 'name email phone'
      })
      .limit(5);
    
    console.log(`Found ${bookingsWithCustomer.length} paid bookings`);
    bookingsWithCustomer.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`  - Booking ID: ${booking._id}`);
      console.log(`  - Customer data:`, booking.customer);
      console.log(`  - Customer name: ${booking.customer?.name || 'N/A'}`);
      console.log(`  - Customer email: ${booking.customer?.email || 'N/A'}`);
      console.log(`  - Customer phone: ${booking.customer?.phone || 'N/A'}`);
      console.log('');
    });
    
    // Test 2: Check if customers actually exist in User collection
    console.log('2. Checking raw customer data from User collection...');
    const sampleUsers = await UserModel.find({ 
      email: { $exists: true } 
    }).select('name email phone').limit(5);
    
    console.log('Sample users from database:');
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  - Name: ${user.name || 'N/A'}`);
      console.log(`  - Email: ${user.email || 'N/A'}`);
      console.log(`  - Phone: ${user.phone || 'N/A'}`);
      console.log('');
    });
    
    // Test 3: Check if booking.customer field contains valid user IDs
    if (bookingsWithCustomer.length > 0 && bookingsWithCustomer[0].customer) {
      console.log('3. Checking if customer reference is valid...');
      const customerId = bookingsWithCustomer[0].customer._id;
      if (customerId) {
        const foundUser = await UserModel.findById(customerId).select('name email phone');
        console.log(`Customer found with ID ${customerId}:`);
        console.log(`  - Name: ${foundUser?.name || 'N/A'}`);
        console.log(`  - Email: ${foundUser?.email || 'N/A'}`);
        console.log(`  - Phone: ${foundUser?.phone || 'N/A'}`);
      } else {
        console.log('No customer ID found in the booking.');
      }
    }
    
    console.log('\n=== Debug Complete ===');
    
    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

// Run debug
debugCustomerData();