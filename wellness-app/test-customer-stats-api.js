// Test script to verify the customer dashboard stats API
// This is for testing purposes only

const testApi = async () => {
  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/customer/dashboard/stats';
  
  // Replace with a valid JWT token from a logged-in customer
  const token = 'YOUR_JWT_TOKEN_HERE';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response:', data);
      console.log('Expected structure:');
      console.log('- appointments: number');
      console.log('- upcomingAppointments: number');
      console.log('- servicesUsed: number');
      console.log('- avgRating: number (0-5)');
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Uncomment to run test
// testApi();