const testTherapistBookings = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace this with a valid therapist JWT token
  const token = 'YOUR_THERAPIST_JWT_TOKEN_HERE';
  
  try {
    console.log('Testing therapist assigned bookings API...');
    
    const response = await fetch(`${baseUrl}/api/therapist/bookings/assigned`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Response:', data);
      console.log('\nExpected structure:');
      console.log('- success: boolean');
      console.log('- data.bookings: array of booking objects');
      console.log('- data.pagination: { page, limit, total, totalPages }');
      console.log('\nBooking object structure:');
      console.log('- id: string');
      console.log('- customer: { id, firstName, lastName, email, phone }');
      console.log('- service: { id, name, price, duration, description }');
      console.log('- business: { id, name }');
      console.log('- date: Date');
      console.log('- time: string');
      console.log('- status: string');
      console.log('- notes: string (optional)');
      console.log('- createdAt: Date');
      console.log('- updatedAt: Date');
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testTherapistBookings();