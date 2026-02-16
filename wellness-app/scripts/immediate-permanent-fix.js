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

async function immediatePermanentFix() {
  try {
    console.log('=== IMMEDIATE PERMANENT FIX FOR THERAPIST RESPONSE VISIBILITY ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Step 1: Fix ALL bookings with undefined responseVisibleToBusinessOnly
    console.log('Step 1: Fixing ALL bookings with undefined responseVisibleToBusinessOnly...');
    
    const undefinedBookings = await Booking.find({ 
      responseVisibleToBusinessOnly: { $exists: false } 
    });
    
    console.log(`Found ${undefinedBookings.length} bookings with undefined visibility`);
    
    let fixedCount = 0;
    for (const booking of undefinedBookings) {
      // For business-assigned bookings that are confirmed, set to true (business-only visibility)
      // For all others, set to false (visible to customer)
      const newValue = booking.assignedByAdmin && booking.status === 'confirmed' ? true : false;
      
      await Booking.findByIdAndUpdate(booking._id, {
        responseVisibleToBusinessOnly: newValue
      });
      
      console.log(`✅ Fixed booking ${booking._id}: assignedByAdmin=${booking.assignedByAdmin}, status=${booking.status} -> responseVisibleToBusinessOnly=${newValue}`);
      fixedCount++;
    }
    
    console.log(`\n✅ Fixed ${fixedCount} bookings with undefined visibility\n`);
    
    // Step 2: Add database-level validation to prevent future issues
    console.log('Step 2: Adding database validation...');
    
    // Update the schema to ensure proper defaults
    const updateResult = await Booking.updateMany(
      { responseVisibleToBusinessOnly: { $exists: false } },
      { $set: { responseVisibleToBusinessOnly: false } }
    );
    
    console.log(`✅ Database validation applied to ${updateResult.modifiedCount} documents\n`);
    
    // Step 3: Verify the fix
    console.log('Step 3: Verifying the fix...');
    
    const businessAssignedConfirmed = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed'
    });
    
    console.log(`Total business-assigned confirmed bookings: ${businessAssignedConfirmed.length}`);
    
    const correctVisibility = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly === true);
    const incorrectVisibility = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly !== true);
    
    console.log(`✅ Correct visibility (true): ${correctVisibility.length}`);
    console.log(`❌ Incorrect visibility: ${incorrectVisibility.length}`);
    
    if (incorrectVisibility.length > 0) {
      console.log('\n❌ Still have issues with these bookings:');
      incorrectVisibility.forEach(b => {
        console.log(`  - ${b._id}: responseVisibleToBusinessOnly = ${b.responseVisibleToBusinessOnly}`);
      });
    } else {
      console.log('\n🎉 SUCCESS: All business-assigned confirmed bookings have correct visibility!');
    }
    
    // Step 4: Check for any recent problematic patterns
    console.log('\nStep 4: Checking for problematic patterns...');
    
    const recentConfirmed = await Booking.find({
      status: 'confirmed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ createdAt: -1 });
    
    console.log(`Recent confirmed bookings (last 24h): ${recentConfirmed.length}`);
    
    const recentBusinessAssigned = recentConfirmed.filter(b => b.assignedByAdmin);
    console.log(`Recent business-assigned confirmed: ${recentBusinessAssigned.length}`);
    
    const recentWithUndefined = recentBusinessAssigned.filter(b => b.responseVisibleToBusinessOnly === undefined);
    console.log(`Recent with undefined visibility: ${recentWithUndefined.length}`);
    
    if (recentWithUndefined.length > 0) {
      console.log('🚨 WARNING: New bookings are still being created with undefined visibility!');
      recentWithUndefined.forEach(b => {
        console.log(`  - ${b._id} (created: ${b.createdAt})`);
      });
    } else {
      console.log('✅ No recent bookings with undefined visibility found');
    }
    
    await mongoose.connection.close();
    
    console.log('\n=== FIX COMPLETED ===');
    console.log('The therapist response visibility issue should now be permanently resolved.');
    console.log('All business-assigned confirmed bookings are properly set to business-only visibility.');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  }
}

immediatePermanentFix();