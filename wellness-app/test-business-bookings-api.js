const testBusinessBookingsAPI = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace this with a valid business JWT token
  const token = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
  
  try {
    console.log('=== Testing Business Bookings API ===\n');
    
    // Test 1: Get all bookings for business
    console.log('1. Testing GET /api/bookings/business (all bookings)');
    const allResponse = await fetch(`${baseUrl}/api/bookings/business`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', allResponse.status);
    const allData = await allResponse.json();
    console.log('Total bookings:', allData.data?.length || 0);
    
    // Test 2: Get pending bookings
    console.log('\n2. Testing GET /api/bookings/business?status=pending');
    const pendingResponse = await fetch(`${baseUrl}/api/bookings/business?status=pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', pendingResponse.status);
    const pendingData = await pendingResponse.json();
    console.log('Pending bookings:', pendingData.data?.length || 0);
    
    if (pendingData.data && pendingData.data.length > 0) {
      console.log('\nPending bookings details:');
      pendingData.data.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.service?.name} - ${booking.customer?.name || booking.customer?.firstName} - assigned: ${booking.assignedByAdmin} - therapist: ${booking.therapist?.fullName || 'None'}`);
      });
    }
    
    // Test 3: Get confirmed bookings
    console.log('\n3. Testing GET /api/bookings/business?status=confirmed');
    const confirmedResponse = await fetch(`${baseUrl}/api/bookings/business?status=confirmed`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', confirmedResponse.status);
    const confirmedData = await confirmedResponse.json();
    console.log('Confirmed bookings:', confirmedData.data?.length || 0);
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

testBusinessBookingsAPI();