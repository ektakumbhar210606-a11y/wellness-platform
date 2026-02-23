import mongoose from 'mongoose';
import { connectToDatabase } from './lib/db';
import ReviewModel from './models/Review';
import BookingModel from './models/Booking';

async function fixReviewTherapistReferences() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get all reviews
    const reviews = await ReviewModel.find({}).populate('bookingId');
    console.log(`Found ${reviews.length} reviews`);

    let fixedCount = 0;
    
    for (const review of reviews) {
      // If the review has a booking reference, check if the therapist ID matches
      if (review.bookingId && review.bookingId.therapist) {
        const bookingTherapistUserId = review.bookingId.therapist.user;
        
        // If the review's therapist field doesn't match the booking's therapist user ID
        if (review.therapist.toString() !== bookingTherapistUserId.toString()) {
          console.log(`Fixing review ${review._id}:`);
          console.log(`  Old therapist ID: ${review.therapist}`);
          console.log(`  Correct therapist user ID: ${bookingTherapistUserId}`);
          
          // Update the review to use the correct therapist user ID
          await ReviewModel.findByIdAndUpdate(review._id, {
            therapist: bookingTherapistUserId
          });
          
          fixedCount++;
        }
      }
    }
    
    console.log(`\nFixed ${fixedCount} reviews with incorrect therapist references`);

  } catch (error) {
    console.error('Error fixing reviews:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixReviewTherapistReferences();