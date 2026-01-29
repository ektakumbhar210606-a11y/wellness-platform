// Test script to check business data structure
const testBusinessData = async () => {
  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/businesses/my-business';
  
  // You'll need to replace this with a valid JWT token from a logged-in provider
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzM4YjQyYzNmNDU0YTA4MjU2OWQ2YjgiLCJlbWFpbCI6ImpvaG4xMjNAZ21haWwuY29tIiwicm9sZSI6IkJ1c2luZXNzIiwiaWF0IjoxNzM3NTk1MjQ1LCJleHAiOjE3Mzc2ODE2NDV9.5J8X9vKQ8Z8X9vKQ8Z8X9vKQ8Z8X9vKQ8Z8X9vKQ8Z8';
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('Business data structure:');
      console.log('- ownerName:', data.data.ownerName);
      console.log('- business_name:', data.data.business_name);
      console.log('- email:', data.data.email);
      console.log('- phone:', data.data.phone);
      console.log('- description:', data.data.description);
      console.log('- address:', data.data.address);
      console.log('- businessHours:', data.data.businessHours);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testBusinessData();