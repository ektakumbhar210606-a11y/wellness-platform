// Test script to login customer and test dashboard APIs
// This is for testing purposes only

const testCustomerDashboard = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // 1. Login to get JWT token
    console.log('1. Logging in customer...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test.customer@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // 2. Test dashboard stats API
    console.log('\n2. Testing dashboard stats API...');
    const statsResponse = await fetch(`${baseUrl}/api/customer/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Dashboard Stats API Response:', statsData);
      console.log('Expected structure:');
      console.log('- appointments:', statsData.appointments, '(number)');
      console.log('- upcomingAppointments:', statsData.upcomingAppointments, '(number)');
      console.log('- servicesUsed:', statsData.servicesUsed, '(number)');
      console.log('- avgRating:', statsData.avgRating, '(number 0-5)');
    } else {
      console.error('❌ Dashboard Stats API Error:', statsData);
    }
    
    // 3. Test upcoming appointments API
    console.log('\n3. Testing upcoming appointments API...');
    const bookingsResponse = await fetch(`${baseUrl}/api/customer/bookings/upcoming?page=1&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const bookingsData = await bookingsResponse.json();
    
    if (bookingsResponse.ok) {
      console.log('✅ Upcoming Appointments API Response:', bookingsData);
      if (bookingsData.success && bookingsData.data?.bookings) {
        console.log('Number of upcoming appointments:', bookingsData.data.bookings.length);
        bookingsData.data.bookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. ${booking.service?.name || 'Unknown Service'} - ${booking.date} at ${booking.time}`);
        });
      }
    } else {
      console.error('❌ Upcoming Appointments API Error:', bookingsData);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testCustomerDashboard();