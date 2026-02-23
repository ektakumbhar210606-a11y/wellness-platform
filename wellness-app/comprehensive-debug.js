const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const BusinessModel = require('./models/Business').default;
const TherapistModel = require('./models/Therapist').default;
const ReviewModel = require('./models/Review').default;

async function comprehensiveDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('=== COMPREHENSIVE DEBUG FOR BUSINESS REVIEWS ===\n');

    // 1. Check all businesses
    console.log('1. ALL BUSINESSES:');
    const businesses = await BusinessModel.find({}).select('_id owner name');
    if (businesses.length === 0) {
      console.log('❌ No businesses found in database');
      return;
    }
    
    businesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (ID: ${business._id})`);
    });

    // 2. Check all therapists and their associations
    console.log('\n2. ALL THERAPISTS AND ASSOCIATIONS:');
    const allTherapists = await TherapistModel.find({}).populate('user').select('_id user fullName associatedBusinesses');
    if (allTherapists.length === 0) {
      console.log('❌ No therapists found in database');
      return;
    }
    
    allTherapists.forEach((therapist, index) => {
      console.log(`   ${index + 1}. ${therapist.fullName || 'No name'} (ID: ${therapist._id})`);
      console.log(`      User ID: ${therapist.user?._id}`);
      console.log(`      Associated Businesses: ${therapist.associatedBusinesses?.length || 0}`);
      therapist.associatedBusinesses?.forEach((assoc, i) => {
        console.log(`        - Business: ${assoc.businessId} (Status: ${assoc.status})`);
      });
    });

    // 3. Check all reviews
    console.log('\n3. ALL REVIEWS:');
    const allReviews = await ReviewModel.find({}).populate('therapist customer service');
    if (allReviews.length === 0) {
      console.log('❌ No reviews found in database');
      return;
    }
    
    allReviews.forEach((review, index) => {
      console.log(`   ${index + 1}. Review for therapist: ${review.therapist?._id}`);
      console.log(`      Therapist User ID in review: ${review.therapist?._id}`);
      console.log(`      Customer: ${review.customer?.firstName || 'Unknown'}`);
      console.log(`      Rating: ${review.rating}`);
    });

    // 4. For each business, test the exact query logic
    console.log('\n4. BUSINESS-SPECIFIC TESTS:');
    for (const business of businesses) {
      console.log(`\n--- Testing Business: ${business.name} ---`);
      
      // Get approved therapists for this business (current approach)
      const approvedTherapists = await TherapistModel.find({
        'associatedBusinesses.businessId': business._id,
        'associatedBusinesses.status': 'approved'
      }).select('user');
      
      console.log(`Approved therapists: ${approvedTherapists.length}`);
      const therapistUserIds = approvedTherapists.map(t => t.user);
      console.log(`Therapist User IDs:`, therapistUserIds);
      
      // Find reviews for these therapists
      const reviews = await ReviewModel.find({
        therapist: { $in: therapistUserIds }
      }).populate('therapist customer service');
      
      console.log(`Reviews found: ${reviews.length}`);
      reviews.forEach((review, index) => {
        console.log(`   ${index + 1}. Review for User ID: ${review.therapist?._id}`);
        console.log(`      Therapist name: ${review.therapist?.fullName || 'Unknown'}`);
      });
      
      // Test with therapist IDs (old approach)
      const therapistIds = await TherapistModel.find({
        'associatedBusinesses.businessId': business._id,
        'associatedBusinesses.status': 'approved'
      }).select('_id');
      
      const oldApproachIds = therapistIds.map(t => t._id);
      const oldReviews = await ReviewModel.find({
        therapist: { $in: oldApproachIds }
      });
      
      console.log(`Old approach (therapist IDs) found: ${oldReviews.length} reviews`);
    }

    // 5. Check specific relationships
    console.log('\n5. RELATIONSHIP VERIFICATION:');
    const sampleTherapist = allTherapists[0];
    if (sampleTherapist) {
      console.log(`Sample therapist: ${sampleTherapist.fullName}`);
      console.log(`Sample therapist User ID: ${sampleTherapist.user?._id}`);
      
      // Find reviews for this specific therapist
      const therapistReviews = await ReviewModel.find({
        therapist: sampleTherapist.user._id
      });
      console.log(`Reviews for this therapist's User ID: ${therapistReviews.length}`);
      
      // Check if any reviews exist with therapist ID instead of user ID
      const wrongReviews = await ReviewModel.find({
        therapist: sampleTherapist._id
      });
      console.log(`Reviews with therapist ID (wrong): ${wrongReviews.length}`);
    }

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

comprehensiveDebug();