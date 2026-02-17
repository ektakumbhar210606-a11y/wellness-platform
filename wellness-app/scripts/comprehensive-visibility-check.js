const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({
  status: String,
  assignedByAdmin: Boolean,
  responseVisibleToBusinessOnly: Boolean,
  therapistResponded: Boolean,
  confirmedBy: String,
  customer: mongoose.Schema.Types.ObjectId,
  therapist: mongoose.Schema.Types.ObjectId,
  service: mongoose.Schema.Types.ObjectId,
  date: Date,
  time: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

async function comprehensiveVisibilityCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== COMPREHENSIVE BOOKING VISIBILITY CHECK ===\n');
    
    // Check 1: All business-assigned bookings
    const assignedBookings = await Booking.find({ assignedByAdmin: true });
    console.log(`Total business-assigned bookings: ${assignedBookings.length}`);
    
    // Check 2: Business-assigned bookings that are confirmed
    const confirmedAssigned = assignedBookings.filter(b => b.status === 'confirmed');
    console.log(`Business-assigned confirmed bookings: ${confirmedAssigned.length}`);
    
    // Check 3: Business-assigned confirmed bookings with incorrect visibility
    const problematic = confirmedAssigned.filter(b => b.responseVisibleToBusinessOnly === false);
    console.log(`Problematic bookings (confirmed + visible to customer): ${problematic.length}`);
    
    if (problematic.length > 0) {
      console.log('\n--- PROBLEMATIC BOOKINGS ---');
      problematic.forEach((b, index) => {
        console.log(`${index + 1}. ID: ${b._id}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   Response Visible to Customer: ${!b.responseVisibleToBusinessOnly}`);
        console.log(`   Therapist Responded: ${b.therapistResponded}`);
        console.log(`   Confirmed By: ${b.confirmedBy}`);
        console.log(`   Created: ${b.createdAt}`);
        console.log('');
      });
    }
    
    // Check 4: All confirmed bookings regardless of assignment
    const allConfirmed = await Booking.find({ status: 'confirmed' });
    console.log(`Total confirmed bookings (all): ${allConfirmed.length}`);
    
    // Check 5: Confirmed bookings visible to customers
    const visibleToCustomers = allConfirmed.filter(b => !b.responseVisibleToBusinessOnly);
    console.log(`Confirmed bookings visible to customers: ${visibleToCustomers.length}`);
    
    // Check 6: Recent bookings (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBookings = await Booking.find({ 
      createdAt: { $gte: oneDayAgo },
      assignedByAdmin: true,
      status: 'confirmed'
    });
    
    console.log(`\nRecent business-assigned confirmed bookings (last 24h): ${recentBookings.length}`);
    if (recentBookings.length > 0) {
      console.log('--- RECENT BOOKINGS ---');
      recentBookings.forEach((b, index) => {
        console.log(`${index + 1}. ID: ${b._id}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   Response Visible to Business Only: ${b.responseVisibleToBusinessOnly}`);
        console.log(`   Therapist Responded: ${b.therapistResponded}`);
        console.log(`   Created: ${b.createdAt}`);
        console.log('');
      });
    }
    
    // Check 7: Check for any bookings confirmed by therapists
    const therapistConfirmed = await Booking.find({ 
      confirmedBy: { $exists: true, $ne: null },
      confirmedBy: { $not: { $regex: /^business-/ } }
    });
    
    console.log(`Bookings confirmed by therapists (not business): ${therapistConfirmed.length}`);
    if (therapistConfirmed.length > 0) {
      console.log('--- THERAPIST-CONFIRMED BOOKINGS ---');
      therapistConfirmed.forEach((b, index) => {
        console.log(`${index + 1}. ID: ${b._id}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   Response Visible to Business Only: ${b.responseVisibleToBusinessOnly}`);
        console.log(`   Confirmed By: ${b.confirmedBy}`);
        console.log(`   Assigned by Admin: ${b.assignedByAdmin}`);
        console.log('');
      });
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

comprehensiveVisibilityCheck();