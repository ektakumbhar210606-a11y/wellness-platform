const testAssignedBookingsData = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace this with a valid business JWT token
  const token = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
  
  try {
    console.log('=== Testing Assigned Bookings Data Fetching ===\n');
    
    console.log('Making request to:', `${baseUrl}/api/business/assigned-bookings`);
    console.log('With token:', token ? 'Token provided' : 'NO TOKEN');
    
    const response = await fetch(`${baseUrl}/api/business/assigned-bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log('Content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('\nResponse data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('\n✅ API call successful');
        console.log('Success:', data.success);
        if (data.data) {
          console.log('Bookings count:', data.data.bookings?.length || 0);
          console.log('Summary:', data.data.summary);
          console.log('Pagination:', data.data.pagination);
          
          // Check the structure of the first booking if available
          if (data.data.bookings && data.data.bookings.length > 0) {
            const firstBooking = data.data.bookings[0];
            console.log('\nFirst booking structure:');
            console.log('- ID:', firstBooking.id);
            console.log('- Customer:', firstBooking.customer);
            console.log('- Service:', firstBooking.service);
            console.log('- Therapist:', firstBooking.therapist);
            console.log('- Date:', firstBooking.date);
            console.log('- Time:', firstBooking.time);
            console.log('- Status:', firstBooking.status);
            console.log('- Original Date:', firstBooking.originalDate);
            console.log('- Original Time:', firstBooking.originalTime);
            console.log('- Rescheduled At:', firstBooking.rescheduledAt);
            console.log('- Confirmed At:', firstBooking.confirmedAt);
            console.log('- Cancelled At:', firstBooking.cancelledAt);
          }
        }
      } else {
        console.log('\n❌ API call failed');
        console.log('Error:', data.error);
      }
    } else {
      const text = await response.text();
      console.log('\nNon-JSON response:');
      console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testAssignedBookingsData();