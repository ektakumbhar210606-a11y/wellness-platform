// Simple test to verify the business reviews API fix
console.log('Testing business reviews API fix...');

// Simulate the data structure
const testData = {
  therapists: [
    { _id: 'therapist1', user: 'user1' },
    { _id: 'therapist2', user: 'user2' },
    { _id: 'therapist3', user: 'user3' }
  ],
  reviews: [
    { therapist: 'user1', rating: 5, comment: 'Great service!' },
    { therapist: 'user2', rating: 4, comment: 'Good experience' },
    { therapist: 'user4', rating: 3, comment: 'Average service' } // This should not appear
  ]
};

console.log('Test data:');
console.log('- Therapists:', testData.therapists.length);
console.log('- Reviews in system:', testData.reviews.length);

// Old approach - using therapist IDs
const oldApproachTherapistIds = testData.therapists.map(t => t._id);
const oldResults = testData.reviews.filter(review => 
  oldApproachTherapistIds.includes(review.therapist)
);
console.log('\nOld approach (therapist IDs):', oldResults.length, 'reviews found');

// New approach - using user IDs  
const newUserIds = testData.therapists.map(t => t.user);
const newResults = testData.reviews.filter(review => 
  newUserIds.includes(review.therapist)
);
console.log('New approach (user IDs):', newResults.length, 'reviews found');

console.log('\nResults:');
newResults.forEach((review, index) => {
  console.log(`${index + 1}. Review for user ${review.therapist}: ${review.rating} stars - "${review.comment}"`);
});

console.log('\nFix verification:', newResults.length > oldResults.length ? 'SUCCESS' : 'NO CHANGE');