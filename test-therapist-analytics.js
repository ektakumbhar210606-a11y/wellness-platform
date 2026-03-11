// Test script to verify therapist analytics API
const fetch = require('node-fetch');

async function testTherapistAnalytics() {
  try {
    // First, login as a therapist to get a token
   console.log('Logging in as therapist...');
    
   const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
     headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
       email: 'sunny2@gmail.com', // Replace with actual therapist email
        password: 'therapist123'   // Replace with actual password
      })
    });

    if (!loginResponse.ok) {
     console.error('Login failed. Please check credentials.');
     console.log('Login response:', await loginResponse.text());
      return;
    }

   const loginData = await loginResponse.json();
   const token = loginData.token;
   console.log('✓ Login successful, token received\n');

    // Now test the analytics endpoint
   console.log('Fetching therapist analytics...');
   const analyticsResponse = await fetch('http://localhost:3000/api/therapist/analytics', {
      method: 'GET',
     headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

   console.log('Analytics response status:', analyticsResponse.status);
    
    if (!analyticsResponse.ok) {
     console.error('Failed to fetch analytics');
     console.log('Error response:', await analyticsResponse.text());
      return;
    }

   const analyticsData = await analyticsResponse.json();
   console.log('✓ Analytics data fetched successfully\n');
   console.log('=== ANALYTICS DATA ===');
   console.log(JSON.stringify(analyticsData, null, 2));
    
    // Specifically check monthlyRatings
   console.log('\n=== MONTHLY RATINGS DATA ===');
   console.log('monthlyRatings:', JSON.stringify(analyticsData.data.monthlyRatings, null, 2));
   console.log('monthlyRatings length:', analyticsData.data.monthlyRatings.length);
    
    if (analyticsData.data.monthlyRatings && analyticsData.data.monthlyRatings.length > 0) {
     console.log('\n✓ SUCCESS: Monthly ratings data is available!');
     console.log('Sample data point:', analyticsData.data.monthlyRatings[0]);
    } else {
     console.log('\n⚠ WARNING: No monthly ratings data found');
     console.log('This could mean:');
     console.log('1. No reviews exist for this therapist yet');
     console.log('2. The fix is working but there\'s no data to display');
    }

  } catch (error) {
   console.error('Error testing analytics:', error.message);
  }
}

testTherapistAnalytics();
