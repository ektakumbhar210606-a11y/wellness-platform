const testTherapistBusinessResponses = async () => {
  const baseUrl = 'http://localhost:3000';
  
  // You'll need to replace this with a valid therapist JWT token
  const token = 'YOUR_THERAPIST_JWT_TOKEN_HERE';
  
  try {
    console.log('Testing therapist business responses API...');
    
    const response = await fetch(`${baseUrl}/api/therapist/business-responses`, {
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
      console.log('- data: array of business response objects');
      console.log('- pagination: { currentPage, totalPages, totalBookings, hasNext, hasPrev }');
      console.log('\nBusiness response object structure:');
      console.log('- id: string');
      console.log('- customer: { id, firstName, lastName, email, phone }');
      console.log('- service: { id, name, price, duration, currency }');
      console.log('- business: { id, name }');
      console.log('- date: Date');
      console.log('- time: string');
      console.log('- status: string');
      console.log('- notes: string (optional)');
      console.log('- createdAt: Date');
      console.log('- updatedAt: Date');
      console.log('- confirmedBy: string');
      console.log('- confirmedAt: Date');
      console.log('- cancelledBy: string (optional)');
      console.log('- cancelledAt: Date (optional)');
      console.log('- rescheduledBy: string (optional)');
      console.log('- rescheduledAt: Date (optional)');
      console.log('- originalDate: Date (optional)');
      console.log('- originalTime: string (optional)');
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testTherapistBusinessResponses();