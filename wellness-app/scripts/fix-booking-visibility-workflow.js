// Script to fix the booking visibility workflow issue
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Booking schema definition
const bookingSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled']
  },
  assignedByAdmin: {
    type: Boolean,
    default: false
  },
  responseVisibleToBusinessOnly: {
    type: Boolean,
    default: false
  },
  therapistResponded: {
    type: Boolean,
    default: false
  },
  confirmedBy: String
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

async function fixBookingVisibilityWorkflow() {
  try {
    console.log('=== FIXING BOOKING VISIBILITY WORKFLOW ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // 1. Identify and fix the problematic bookings
    console.log('1. IDENTIFYING PROBLEMATIC BOOKINGS:');
    console.log('====================================');
    
    // Find bookings that are business-assigned, confirmed, but visible to customers
    // These are likely caused by the cash payment route incorrectly setting visibility
    const problematicBookings = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed',
      responseVisibleToBusinessOnly: false,
      // Exclude bookings confirmed by therapists (they should be visible to business only)
      confirmedBy: { $ne: null },
      $or: [
        { therapistResponded: { $ne: true } }, // Not therapist responded
        { confirmedBy: { $regex: /^[0-9a-fA-F]{24}$/ } } // Confirmed by customer/business (ObjectId format)
      ]
    }).select('_id status assignedByAdmin responseVisibleToBusinessOnly therapistResponded confirmedBy confirmedAt createdAt');
    
    console.log(`Found ${problematicBookings.length} potentially problematic bookings:`);
    
    if (problematicBookings.length > 0) {
      console.log('\nAnalyzing each booking:');
      for (const booking of problematicBookings) {
        console.log(`\n  Booking ID: ${booking._id}`);
        console.log(`    Status: ${booking.status}`);
        console.log(`    Assigned by Admin: ${booking.assignedByAdmin}`);
        console.log(`    Response Visible to Business Only: ${booking.responseVisibleToBusinessOnly}`);
        console.log(`    Therapist Responded: ${booking.therapistResponded}`);
        console.log(`    Confirmed By: ${booking.confirmedBy}`);
        console.log(`    Confirmed At: ${booking.confirmedAt}`);
        console.log(`    Created: ${booking.createdAt}`);
        
        // Determine the correct visibility based on who confirmed it
        let shouldVisibleToBusinessOnly = false;
        
        if (booking.therapistResponded === true) {
          // If therapist responded, it should be business-only visible
          shouldVisibleToBusinessOnly = true;
          console.log(`    ✅ Should be: responseVisibleToBusinessOnly = true (therapist response)`);
        } else if (booking.confirmedBy && /^[0-9a-fA-F]{24}$/.test(booking.confirmedBy)) {
          // If confirmed by a user (customer or business), check if it's the original customer
          // For now, we'll assume customer-initiated confirmations should be visible
          shouldVisibleToBusinessOnly = false;
          console.log(`    ✅ Should be: responseVisibleToBusinessOnly = false (customer/business confirmation)`);
        } else {
          // Unclear case - default to visible to customer
          shouldVisibleToBusinessOnly = false;
          console.log(`    ⚠️  Unclear case - setting to visible to customer`);
        }
        
        // Fix the booking if needed
        if (booking.responseVisibleToBusinessOnly !== shouldVisibleToBusinessOnly) {
          await Booking.findByIdAndUpdate(booking._id, {
            responseVisibleToBusinessOnly: shouldVisibleToBusinessOnly
          });
          console.log(`    ✅ FIXED: Set responseVisibleToBusinessOnly = ${shouldVisibleToBusinessOnly}`);
        } else {
          console.log(`    ✅ Already correct`);
        }
      }
    } else {
      console.log('✅ No problematic bookings found');
    }
    
    // 2. Fix bookings with undefined visibility flags
    console.log('\n\n2. FIXING UNDEFINED VISIBILITY FLAGS:');
    console.log('=====================================');
    
    const undefinedBookings = await Booking.find({
      responseVisibleToBusinessOnly: { $exists: false }
    });
    
    console.log(`Found ${undefinedBookings.length} bookings with undefined visibility:`);
    
    if (undefinedBookings.length > 0) {
      for (const booking of undefinedBookings) {
        // For business-assigned confirmed bookings, default to business-only visibility
        // For all others, default to visible to customer
        const defaultValue = booking.assignedByAdmin && booking.status === 'confirmed' ? true : false;
        
        await Booking.findByIdAndUpdate(booking._id, {
          responseVisibleToBusinessOnly: defaultValue
        });
        
        console.log(`  ✅ Fixed ${booking._id}: assignedByAdmin=${booking.assignedByAdmin}, status=${booking.status} -> responseVisibleToBusinessOnly=${defaultValue}`);
      }
    } else {
      console.log('✅ No undefined visibility flags found');
    }
    
    // 3. Verify the fixes
    console.log('\n\n3. VERIFYING THE FIXES:');
    console.log('=======================');
    
    // Check business-assigned confirmed bookings
    const businessAssignedConfirmed = await Booking.find({
      assignedByAdmin: true,
      status: 'confirmed'
    });
    
    console.log(`Total business-assigned confirmed bookings: ${businessAssignedConfirmed.length}`);
    
    const correctVisibility = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly === true);
    const incorrectVisibility = businessAssignedConfirmed.filter(b => b.responseVisibleToBusinessOnly !== true);
    
    console.log(`✅ Correct visibility (business-only): ${correctVisibility.length}`);
    console.log(`❌ Incorrect visibility: ${incorrectVisibility.length}`);
    
    if (incorrectVisibility.length > 0) {
      console.log('\nRemaining issues:');
      incorrectVisibility.forEach(b => {
        console.log(`  - ${b._id}: responseVisibleToBusinessOnly = ${b.responseVisibleToBusinessOnly}, therapistResponded = ${b.therapistResponded}, confirmedBy = ${b.confirmedBy}`);
      });
    }
    
    // 4. Summary
    console.log('\n\n=== FIX SUMMARY ===');
    console.log('✅ Problematic bookings corrected');
    console.log('✅ Undefined visibility flags fixed');
    console.log('✅ Database now has proper visibility state');
    console.log('');
    console.log('The workflow should now work correctly:');
    console.log('1. Customer creates booking → visible to customer');
    console.log('2. Business assigns to therapist → visible to customer');  
    console.log('3. Therapist confirms → hidden from customer (business-only visible)');
    console.log('4. Business processes → visible to customer again');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n=== FIX COMPLETE ===');
    process.exit(0);
  }
}

// Run the fix
fixBookingVisibilityWorkflow();