const { connectToDatabase } = require('./lib/db');
const BusinessModel = require('./models/Business');
const TherapistModel = require('./models/Therapist');
const ReviewModel = require('./models/Review');
const mongoose = require('mongoose');

async function testBusinessReviewsFix() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Find a business with therapists
    const business = await BusinessModel.findOne({}).populate('owner');
    if (!business) {
      console.log('No business found in database');
      return;
    }
    console.log(`\nTesting business: ${business.name}`);

    // Find therapists associated with this business
    const therapists = await TherapistModel.find({
      'associatedBusinesses.businessId': business._id,
      'associatedBusinesses.status': 'approved'
    }).populate('user');
    
    console.log(`Found ${therapists.length} approved therapists for this business:`);
    therapists.forEach(t => {
      console.log(`- ${t.fullName || t.user?.firstName || 'Unknown'} (User ID: ${t.user?._id})`);
    });

    if (therapists.length === 0) {
      console.log('No approved therapists found for this business');
      return;
    }

    // Get user IDs of approved therapists
    const therapistUserIds = therapists.map(t => t.user._id);
    console.log(`\nTherapist User IDs:`, therapistUserIds);

    // Find reviews for these therapists
    const reviews = await ReviewModel.find({
      therapist: { $in: therapistUserIds }
    }).populate('therapist customer service');
    
    console.log(`\nFound ${reviews.length} reviews for business therapists:`);
    reviews.forEach(review => {
      const therapist = therapists.find(t => t.user._id.toString() === review.therapist._id.toString());
      console.log(`- Review for therapist: ${therapist?.fullName || review.therapist?.firstName || 'Unknown'}`);
      console.log(`  Customer: ${review.customer?.firstName || 'Unknown'}`);
      console.log(`  Service: ${review.service?.name || 'Unknown'}`);
      console.log(`  Rating: ${review.rating}`);
      console.log(`  Date: ${review.createdAt}`);
      console.log('---');
    });

    // Test the old vs new approach
    console.log('\n=== COMPARISON TEST ===');
    
    // Old approach (using therapist IDs) - should return 0 results
    const oldApproachTherapistIds = therapists.map(t => t._id);
    const oldResults = await ReviewModel.find({
      therapist: { $in: oldApproachTherapistIds }
    });
    console.log(`Old approach (therapist IDs): ${oldResults.length} reviews found`);
    
    // New approach (using user IDs) - should return the same results as above
    const newResults = await ReviewModel.find({
      therapist: { $in: therapistUserIds }
    });
    console.log(`New approach (user IDs): ${newResults.length} reviews found`);
    
    console.log(`Fix working: ${newResults.length > 0 && newResults.length === reviews.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testBusinessReviewsFix();