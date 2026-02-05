// Simple test to verify business API is returning rescheduled bookings
const testBusinessApi = async () => {
  try {
    console.log('=== Testing Business API for Rescheduled Bookings ===\n');
    
    // You'll need to replace this with a valid business JWT token
    const token = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
    const baseUrl = 'http://localhost:3000';
    
    if (token === 'YOUR_BUSINESS_JWT_TOKEN_HERE') {
      console.log('❌ Please replace YOUR_BUSINESS_JWT_TOKEN_HERE with a valid business JWT token');
      console.log('You can get this from your browser\'s localStorage after logging in as a business user');
      return;
    }
    
    console.log('Testing OLD query (pending only):');
    const oldResponse = await fetch(`${baseUrl}/api/bookings/business?status=pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const oldData = await oldResponse.json();
    console.log(`OLD API Response - Status: ${oldResponse.status}`);
    console.log(`OLD API found ${oldData.data?.length || 0} bookings`);
    if (oldData.data) {
      console.log('OLD API bookings:');
      oldData.data.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.customer?.name || 'N/A'} - Status: ${booking.status}`);
      });
    }
    
    console.log('\nTesting NEW query (pending + rescheduled):');
    // Test what the API should return with our fix
    const newResponse = await fetch(`${baseUrl}/api/bookings/business`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const newData = await newResponse.json();
    console.log(`NEW API Response - Status: ${newResponse.status}`);
    console.log(`NEW API found ${newData.data?.length || 0} bookings`);
    if (newData.data) {
      console.log('NEW API bookings:');
      newData.data.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.customer?.name || 'N/A'} - Status: ${booking.status}`);
      });
      
      // Count by status
      const statusCount = {};
      newData.data.forEach(booking => {
        statusCount[booking.status] = (statusCount[booking.status] || 0) + 1;
      });
      
      console.log('\nStatus breakdown:');
      Object.keys(statusCount).forEach(status => {
        console.log(`  ${status}: ${statusCount[status]} bookings`);
      });
    }
    
    console.log('\n=== Test Complete ===');
    console.log('If the NEW API shows more bookings than the OLD API, especially with "rescheduled" status,');
    console.log('then the fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

testBusinessApi();