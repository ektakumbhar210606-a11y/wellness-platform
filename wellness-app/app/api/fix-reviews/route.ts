import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import ReviewModel from '../../../models/Review';
import TherapistModel from '../../../models/Therapist';
// import BookingModel from '../../../models/Booking';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get all reviews
    const reviews = await ReviewModel.find({});
    console.log(`Found ${reviews.length} reviews`);

    // Get all therapists to map therapist IDs to user IDs
    const therapists = await TherapistModel.find({}).select('_id user');
    const therapistMap = new Map<string, any>();
    therapists.forEach((t: any) => {
      therapistMap.set(t._id.toString(), t.user);
    });
    
    console.log(`Found ${therapists.length} therapists`);

    let fixedCount = 0;
    let results = [];
    
    for (const review of reviews) {
      // Check if the review's therapist ID is actually a therapist ID (not user ID)
      const therapistUserId = therapistMap.get(review.therapist.toString());
      
      if (therapistUserId && therapistUserId.toString() !== review.therapist.toString()) {
        console.log(`Fixing review ${review._id}:`);
        console.log(`  Old therapist ID: ${review.therapist}`);
        console.log(`  Correct therapist user ID: ${therapistUserId}`);
        
        // Update the review to use the correct therapist user ID
        await ReviewModel.findByIdAndUpdate(review._id, {
          therapist: therapistUserId
        });
        
        results.push({
          reviewId: review._id,
          oldTherapistId: review.therapist,
          newTherapistId: therapistUserId
        });
        
        fixedCount++;
      }
    }
    
    console.log(`\nFixed ${fixedCount} reviews with incorrect therapist references`);

    return Response.json({
      success: true,
      message: `Fixed ${fixedCount} reviews`,
      details: results
    });

  } catch (error: any) {
    console.error('Error fixing reviews:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}