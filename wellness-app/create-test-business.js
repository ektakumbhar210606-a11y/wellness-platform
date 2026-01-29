const axios = require('axios');

async function createTestBusinessProfile() {
  try {
    // Login to get the token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'provider@test.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token);
    
    // Create a business profile
    const businessData = {
      business_name: 'Test Business',
      description: 'This is a test business for testing the update profile functionality',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      phone: '+1234567890',
      email: 'business@test.com',
      businessHours: {
        Monday: { open: '09:00', close: '17:00', closed: false },
        Tuesday: { open: '09:00', close: '17:00', closed: false },
        Wednesday: { open: '09:00', close: '17:00', closed: false },
        Thursday: { open: '09:00', close: '17:00', closed: false },
        Friday: { open: '09:00', close: '17:00', closed: false },
        Saturday: { open: '10:00', close: '16:00', closed: false },
        Sunday: { closed: true }
      }
    };
    
    const businessResponse = await axios.post('http://localhost:3000/api/businesses/create', businessData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Business profile created successfully:', businessResponse.data);
  } catch (error) {
    console.error('Error creating business profile:', error.response?.data || error.message);
  }
}

createTestBusinessProfile();