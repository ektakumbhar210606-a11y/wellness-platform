const axios = require('axios');

async function testApi() {
  try {
    // Login to get the token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'provider@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    // Test the services API
    const businessId = '697c4c5946a9978053166759';
    const servicesResponse = await axios.get(`http://localhost:3000/api/businesses/${businessId}/services`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Services API response:', servicesResponse.data);
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testApi();