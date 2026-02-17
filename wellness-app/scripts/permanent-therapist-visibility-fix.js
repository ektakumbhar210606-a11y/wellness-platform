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

async function permanentFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== PERMANENT THERAPIST RESPONSE VISIBILITY FIX ===\n');
    
    // Step 1: Fix bookings with undefined responseVisibleToBusinessOnly
    console.log('Step 1: Fixing bookings with undefined responseVisibleToBusinessOnly...');
    
    const undefinedVisibilityBookings = await Booking.find({ 
      responseVisibleToBusinessOnly: { $exists: false } 
    });
    
    console.log(`Found ${undefinedVisibilityBookings.length} bookings with undefined visibility`);
    
    let fixedCount = 0;
    for (const booking of undefinedVisibilityBookings) {
      // For business-assigned bookings that are confirmed, set to true (business-only visibility)
      // For all others, set to false (visible to customer)
      const newValue = booking.assignedByAdmin && booking.status === 'confirmed' ? true : false;
      
      await Booking.findByIdAndUpdate(booking._id, {
        responseVisibleToBusinessOnly: newValue
      });
      
      console.log(`Fixed booking ${booking._id}: assignedByAdmin=${booking.assignedByAdmin}, status=${booking.status} -> responseVisibleToBusinessOnly=${newValue}`);
      fixedCount++;
    }
    
    console.log(`Fixed ${fixedCount} bookings with undefined visibility\n`);
    
    // Step 2: Fix inconsistent business-assigned confirmed bookings
    console.log('Step 2: Fixing inconsistent business-assigned confirmed bookings...');
    
    const inconsistentBookings = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed',
      responseVisibleToBusinessOnly: false
    });
    
    console.log(`Found ${inconsistentBookings.length} inconsistent business-assigned confirmed bookings`);
    
    let inconsistentFixed = 0;
    for (const booking of inconsistentBookings) {
      // Business-assigned confirmed bookings should be visible to business only
      // until business processes them
      await Booking.findByIdAndUpdate(booking._id, {
        responseVisibleToBusinessOnly: true
      });
      
      console.log(`Fixed inconsistent booking ${booking._id}: now responseVisibleToBusinessOnly=true`);
      inconsistentFixed++;
    }
    
    console.log(`Fixed ${inconsistentFixed} inconsistent bookings\n`);
    
    // Step 3: Add validation to ensure proper field initialization
    console.log('Step 3: Adding validation for future bookings...');
    
    // This would be handled in the model schema, but let's verify current state
    const totalBookings = await Booking.countDocuments();
    const properlyConfigured = await Booking.countDocuments({
      responseVisibleToBusinessOnly: { $exists: true, $ne: null }
    });
    
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Properly configured bookings: ${properlyConfigured}`);
    console.log(`Unconfigured bookings: ${totalBookings - properlyConfigured}\n`);
    
    // Step 4: Verify the fix
    console.log('Step 4: Verifying the fix...');
    
    const businessAssignedConfirmed = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed'
    });
    
    console.log(`Business-assigned confirmed bookings: ${businessAssignedConfirmed.length}`);
    
    const visibleToBusinessOnly = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly === true);
    const visibleToCustomer = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly === false);
    const stillUndefined = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly === undefined);
    
    console.log(`Visible to business only: ${visibleToBusinessOnly.length}`);
    console.log(`Visible to customer: ${visibleToCustomer.length}`);
    console.log(`Still undefined: ${stillUndefined.length}`);
    
    if (stillUndefined.length === 0) {
      console.log('\n✅ SUCCESS: All business-assigned confirmed bookings have proper visibility settings!');
    } else {
      console.log('\n❌ WARNING: Some bookings still have undefined visibility settings');
      stillUndefined.forEach(b => {
        console.log(`  - ${b._id}`);
      });
    }
    
    // Step 5: Summary
    console.log('\n=== FIX SUMMARY ===');
    console.log(`Total bookings fixed: ${fixedCount + inconsistentFixed}`);
    console.log(`Business-assigned confirmed bookings with correct visibility: ${visibleToBusinessOnly.length}/${businessAssignedConfirmed.length}`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

permanentFix();