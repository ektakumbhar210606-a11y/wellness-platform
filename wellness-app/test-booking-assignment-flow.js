const testBookingAssignmentFlow = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace these with valid JWT tokens
  const businessToken = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
  const therapistToken = 'YOUR_THERAPIST_JWT_TOKEN_HERE';
  
  try {
    console.log('=== Testing Booking Assignment Flow ===\n');
    
    // Step 1: Get a therapist ID (you'll need to find an actual therapist ID)
    console.log('1. Testing therapist bookings API (before assignment)...');
    const therapistResponse = await fetch(`${baseUrl}/api/therapist/bookings/assigned`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${therapistToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const therapistData = await therapistResponse.json();
    console.log('Therapist bookings response:', therapistData);
    
    // Step 2: Try to assign a booking (you'll need actual bookingId and therapistId)
    console.log('\n2. Testing booking assignment...');
    const assignResponse = await fetch(`${baseUrl}/api/bookings/assign-to-therapist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${businessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: 'ACTUAL_BOOKING_ID_HERE',
        therapistId: 'ACTUAL_THERAPIST_ID_HERE'
      })
    });
    
    const assignData = await assignResponse.json();
    console.log('Assignment response:', assignData);
    
    // Step 3: Check therapist bookings again
    console.log('\n3. Testing therapist bookings API (after assignment)...');
    const therapistResponse2 = await fetch(`${baseUrl}/api/therapist/bookings/assigned`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${therapistToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const therapistData2 = await therapistResponse2.json();
    console.log('Therapist bookings after assignment:', therapistData2);
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

// Run the test
testBookingAssignmentFlow();