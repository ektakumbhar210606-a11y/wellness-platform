const { connectToDatabase } = require('./lib/db');
const BusinessModel = require('./models/Business');
const TherapistModel = require('./models/Therapist');
const ReviewModel = require('./models/Review');
const mongoose = require('mongoose');

async function debugReviewVisibility() {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    // Get all businesses
    const businesses = await BusinessModel.find({}).select('_id owner name therapists');
    console.log('\n=== BUSINESSES ===');
    businesses.forEach(business => {
      console.log(`Business: ${business.name} (ID: ${business._id})`);
      console.log(`Owner: ${business.owner}`);
      console.log(`Therapists:`, business.therapists || 'None');
      console.log('---');
    });

    // Get all therapists
    console.log('\n=== THERAPISTS ===');
    const therapists = await TherapistModel.find({}).select('_id user fullName associatedBusinesses');
    therapists.forEach(therapist => {
      console.log(`Therapist: ${therapist.fullName || 'No name'} (ID: ${therapist._id})`);
      console.log(`User ID: ${therapist.user}`);
      console.log(`Associated Businesses:`, therapist.associatedBusinesses || 'None');
      console.log('---');
    });

    // Get all reviews
    console.log('\n=== REVIEWS ===');
    const reviews = await ReviewModel.find({}).populate('therapist customer service').select('_id therapist customer service rating createdAt');
    reviews.forEach(review => {
      console.log(`Review ID: ${review._id}`);
      console.log(`Therapist: ${review.therapist?.fullName || review.therapist?._id || 'Unknown'}`);
      console.log(`Customer: ${review.customer?.firstName || review.customer?.name || 'Unknown'}`);
      console.log(`Service: ${review.service?.name || 'Unknown'}`);
      console.log(`Rating: ${review.rating}`);
      console.log(`Created: ${review.createdAt}`);
      console.log('---');
    });

    // Test the business reviews query logic
    console.log('\n=== BUSINESS REVIEWS QUERY TEST ===');
    if (businesses.length > 0) {
      const business = businesses[0];
      console.log(`Testing for business: ${business.name}`);
      
      // Get approved therapists for this business
      const approvedTherapists = await TherapistModel.find({
        'associatedBusinesses.businessId': business._id,
        'associatedBusinesses.status': 'approved'
      }).select('_id');
      
      console.log(`Approved therapists for business ${business._id}:`, approvedTherapists.map(t => t._id));
      
      const therapistIds = approvedTherapists.map(t => t._id);
      
      if (therapistIds.length > 0) {
        // Fetch reviews for these therapists
        const reviews = await ReviewModel.find({
          therapist: { $in: therapistIds }
        }).populate('therapist customer service');
        
        console.log(`Reviews found for business therapists:`, reviews.length);
        reviews.forEach(review => {
          console.log(`- Review for therapist ${review.therapist?.fullName || review.therapist?._id}`);
        });
      } else {
        console.log('No approved therapists found for this business');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

debugReviewVisibility();