import axios from 'axios';

async function createTestProvider() {
  try {
    // First, try to login with existing credentials
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'provider@test.com',
      password: 'password123'
    });
    
    console.log('Login successful:', loginResponse.data);
    return;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('User does not exist, creating new user...');
      
      // Create a new user
      try {
        const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
          name: 'Test Provider',
          email: 'provider@test.com',
          password: 'password123',
          role: 'Business',
          business_name: 'Test Business',
          owner_full_name: 'Test Provider'
        });
        
        console.log('User created successfully:', registerResponse.data);
        
        // Login with the new user
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
          email: 'provider@test.com',
          password: 'password123'
        });
        
        console.log('Login successful:', loginResponse.data);
      } catch (registerError) {
        console.error('Error creating user:', registerError.response?.data || registerError.message);
      }
    } else {
      console.error('Error logging in:', error.response?.data || error.message);
    }
  }
}

createTestProvider();