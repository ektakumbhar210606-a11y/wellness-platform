// Test script to verify review creation fix
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testReviewCreationFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Import models
    const ReviewModel = require('./models/Review').default;
    const BookingModel = require('./models/Booking').default;
    const TherapistModel = require('./models/Therapist').default;
    
    // Find a sample booking
    const booking = await BookingModel.findOne({}).populate('therapist');
    if (!booking) {
      console.log('No bookings found');
      return;
    }
    
    console.log('Sample booking:');
    console.log('- Booking therapist ID (Therapist document):', booking.therapist._id);
    console.log('- Booking therapist user ID (User document):', booking.therapist.user);
    
    // Check if there are existing reviews with wrong therapist reference
    const reviewsWithTherapistId = await ReviewModel.find({
      therapist: booking.therapist._id
    });
    
    console.log(`\nReviews with therapist document ID (WRONG): ${reviewsWithTherapistId.length}`);
    
    const reviewsWithUserId = await ReviewModel.find({
      therapist: booking.therapist.user
    });
    
    console.log(`Reviews with user ID (CORRECT): ${reviewsWithUserId.length}`);
    
    // Test the fix by creating a new review (if no existing correct ones)
    if (reviewsWithUserId.length === 0 && reviewsWithTherapistId.length > 0) {
      console.log('\nFixing existing reviews...');
      // Update existing reviews to use user ID instead of therapist ID
      const result = await ReviewModel.updateMany(
        { therapist: booking.therapist._id },
        { $set: { therapist: booking.therapist.user } }
      );
      console.log(`Updated ${result.modifiedCount} reviews`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testReviewCreationFix();