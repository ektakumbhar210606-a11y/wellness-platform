/**
 * Test script for Customer Payment History API
 * 
 * This script tests the /api/customer/payments endpoint
 * Run with: node test-customer-payments-api.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}===========================================${colors.reset}`);
console.log(`${colors.cyan}Customer Payment History API Test${colors.reset}`);
console.log(`${colors.cyan}===========================================${colors.reset}\n`);

async function testPaymentHistoryAPI() {
  try {
    // Connect to MongoDB
    console.log(`${colors.yellow}Connecting to database...${colors.reset}`);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform');
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Import models
    const Booking = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist' },
      date: Date,
      time: String,
      status: String,
      finalPrice: Number,
      originalPrice: Number,
      rewardDiscountApplied: Boolean
    }, { timestamps: true }));

    const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
      booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      amount: Number,
      totalAmount: Number,
      advancePaid: Number,
      remainingAmount: Number,
      paymentType: { type: String, enum: ['FULL', 'ADVANCE'] },
      method: { type: String, enum: ['credit_card', 'debit_card', 'cash', 'paypal', 'bank_transfer', 'mobile_wallet'] },
      status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'] },
      paymentDate: Date
    }, { timestamps: true }));

    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: { type: String, enum: ['customer', 'therapist', 'business', 'admin'] }
    }, { timestamps: true }));

    // Find a customer user
    console.log(`${colors.yellow}Finding a customer user...${colors.reset}`);
    const customer = await User.findOne({ role: 'customer' }).select('_id name email');
    
    if (!customer) {
      console.log(`${colors.red}✗ No customer user found in the database${colors.reset}`);
      console.log(`${colors.yellow}Please create a customer user first${colors.reset}\n`);
      return;
    }

    console.log(`${colors.green}✓ Found customer: ${customer.name} (${customer.email})${colors.reset}\n`);

    // Find bookings for this customer
    console.log(`${colors.yellow}Finding bookings for customer...${colors.reset}`);
    const customerBookings = await Booking.find({ customer: customer._id })
      .populate('service', 'name price')
      .limit(5);

    if (customerBookings.length === 0) {
      console.log(`${colors.yellow}! No bookings found for this customer${colors.reset}`);
      console.log(`${colors.blue}This is expected if you haven't created any bookings yet${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✓ Found ${customerBookings.length} booking(s)${colors.reset}`);
      customerBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.service?.name || 'N/A'} - ${booking.status}`);
      });
      console.log();
    }

    // Find payments for these bookings
    const bookingIds = customerBookings.map(b => b._id);
    
    console.log(`${colors.yellow}Finding payment records...${colors.reset}`);
    const payments = await Payment.find({ booking: { $in: bookingIds } })
      .populate({
        path: 'booking',
        populate: { path: 'service', select: 'name price' }
      });

    if (payments.length === 0) {
      console.log(`${colors.yellow}! No payment records found${colors.reset}`);
      console.log(`${colors.blue}Payments will be created when customers make bookings${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✓ Found ${payments.length} payment record(s)${colors.reset}\n`);
      
      console.log(`${colors.cyan}Payment Details:${colors.reset}`);
      payments.forEach((payment, index) => {
        console.log(`\n${colors.yellow}Payment ${index + 1}:${colors.reset}`);
        console.log(`  ID: ${payment._id}`);
        console.log(`  Amount: ₹${payment.amount}`);
        console.log(`  Total Amount: ₹${payment.totalAmount}`);
        console.log(`  Type: ${payment.paymentType}`);
        console.log(`  Method: ${payment.method}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}`);
        
        if (payment.booking) {
          console.log(`  Service: ${payment.booking.service?.name || 'N/A'}`);
          console.log(`  Booking Status: ${payment.booking.status}`);
        }
      });
      console.log();
    }

    // Summary
    console.log(`${colors.cyan}===========================================${colors.reset}`);
    console.log(`${colors.green}✓ Test completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}===========================================${colors.reset}\n`);

    console.log(`${colors.blue}To test the API endpoint:${colors.reset}`);
    console.log(`1. Start the development server: npm run dev`);
    console.log(`2. Navigate to: http://localhost:3000/dashboard/customer/payments`);
    console.log(`3. Or call the API directly:`);
    console.log(`   GET http://localhost:3000/api/customer/payments`);
    console.log(`   Headers: Authorization: Bearer <your_jwt_token>\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.yellow}Database connection closed${colors.reset}\n`);
  }
}

// Run the test
testPaymentHistoryAPI();
