// Test script for therapist reviews API endpoint
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testTherapistReviewsAPI() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database successfully');

    // Import models
    const Review = require('./models/Review');
    const Therapist = require('./models/Therapist');
    const User = require('./models/User');
    const Service = require('./models/Service');
    const Booking = require('./models/Booking');

    // Find a test therapist
    console.log('\nFinding test therapist...');
    const therapist = await Therapist.findOne({}).populate('user');
    if (!therapist) {
      console.log('No therapist found in database');
      return;
    }

    console.log(`Found therapist: ${therapist.fullName || therapist.user?.name || 'Unknown'} (ID: ${therapist._id})`);

    // Get therapist's user ID for testing
    const therapistUserId = therapist.user._id;
    console.log(`Therapist User ID: ${therapistUserId}`);

    // Check existing reviews for this therapist
    console.log('\nChecking existing reviews...');
    const existingReviews = await Review.find({ therapist: therapist._id })
      .populate('customer', 'name')
      .populate('service', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${existingReviews.length} reviews for this therapist:`);
    existingReviews.forEach((review, index) => {
      console.log(`${index + 1}. Rating: ${review.rating}/5`);
      console.log(`   Customer: ${review.customer?.name || 'Unknown'}`);
      console.log(`   Service: ${review.service?.name || 'Unknown'}`);
      console.log(`   Comment: ${review.comment || 'No comment'}`);
      console.log(`   Date: ${review.createdAt.toLocaleDateString()}`);
      console.log('---');
    });

    // Display therapist statistics
    console.log('\nTherapist Statistics:');
    console.log(`Average Rating: ${therapist.averageRating || 0}`);
    console.log(`Total Reviews: ${therapist.totalReviews || 0}`);

    // Test the API endpoint logic
    console.log('\nTesting API endpoint logic...');
    
    // Simulate the API endpoint logic
    const reviews = await Review.find({ therapist: therapist._id })
      .populate({
        path: 'customer',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'service',
        select: 'name',
        model: 'Service'
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`API would return ${reviews.length} reviews`);

    // Transform reviews data
    const formattedReviews = reviews.map(review => ({
      rating: review.rating,
      comment: review.comment,
      customerName: review.customer?.name || 'Anonymous Customer',
      serviceName: review.service?.name || 'Unknown Service',
      createdAt: review.createdAt
    }));

    console.log('\nFormatted reviews for API response:');
    formattedReviews.forEach((review, index) => {
      console.log(`${index + 1}. Rating: ${review.rating}/5`);
      console.log(`   Customer: ${review.customerName}`);
      console.log(`   Service: ${review.serviceName}`);
      console.log(`   Date: ${review.createdAt.toLocaleDateString()}`);
      if (review.comment) {
        console.log(`   Comment: "${review.comment}"`);
      }
      console.log('---');
    });

    console.log('\n✅ API endpoint test completed successfully');
    console.log('The endpoint should work correctly with the following response structure:');
    console.log(JSON.stringify({
      success: true,
      data: {
        reviews: formattedReviews.slice(0, 2), // Show first 2 as example
        therapist: {
          averageRating: parseFloat((therapist.averageRating || 0).toFixed(2)),
          totalReviews: therapist.totalReviews || 0
        }
      }
    }, null, 2));

  } catch (error) {
    console.error('Error testing therapist reviews API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

// Run the test
testTherapistReviewsAPI();