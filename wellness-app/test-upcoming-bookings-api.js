// Test script to verify the upcoming appointments API
// This is for testing purposes only

const testApi = async () => {
  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/customer/bookings/upcoming';
  
  // Replace with a valid JWT token from a logged-in customer
  const token = 'YOUR_JWT_TOKEN_HERE';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}?page=1&limit=10`, {
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
      console.log('- success: boolean');
      console.log('- data.bookings: array of booking objects');
      console.log('- data.pagination: object with page, limit, total, totalPages');
      console.log('\nBooking object structure:');
      console.log('- id: string');
      console.log('- service: { id, name, price, duration, description }');
      console.log('- therapist: { id, fullName, professionalTitle }');
      console.log('- business: { id, name }');
      console.log('- date: Date object');
      console.log('- time: string (HH:MM format)');
      console.log('- status: string');
      console.log('- createdAt: Date object');
      console.log('- updatedAt: Date object');
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Uncomment to run test
// testApi();