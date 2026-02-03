// Test the actual therapist bookings API endpoint
const testTherapistBookingsAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace this with a valid therapist JWT token
  const token = 'YOUR_THERAPIST_JWT_TOKEN_HERE';
  
  try {
    console.log('=== Testing Therapist Bookings API ===\n');
    
    console.log('Making request to:', `${baseUrl}/api/therapist/bookings/assigned`);
    console.log('With token:', token ? 'Token provided' : 'NO TOKEN');
    
    const response = await fetch(`${baseUrl}/api/therapist/bookings/assigned`, {
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
          console.log('Pagination:', data.data.pagination);
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
testTherapistBookingsAPI();