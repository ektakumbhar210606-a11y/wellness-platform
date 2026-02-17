// Test the booking details API endpoint
const testBookingDetailsAPI = async () => {
  const baseUrl = 'http://localhost:3001';
  const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual JWT token
  
  try {
    console.log('Testing booking details API...');
    
    // First get a list of bookings to get a valid booking ID
    const bookingsResponse = await fetch(`${baseUrl}/api/customer/bookings?page=1&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const bookingsData = await bookingsResponse.json();
    
    if (bookingsResponse.ok && bookingsData.success && bookingsData.data.bookings.length > 0) {
      const bookingId = bookingsData.data.bookings[0].id;
      console.log('Testing with booking ID:', bookingId);
      
      // Test the booking details endpoint
      const detailsResponse = await fetch(`${baseUrl}/api/customer/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Details API Status:', detailsResponse.status);
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        console.log('✅ Success! Booking details:', detailsData);
      } else {
        const errorData = await detailsResponse.json();
        console.log('❌ Error response:', errorData);
      }
    } else {
      console.log('No bookings found or error fetching bookings');
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Run the test
testBookingDetailsAPI();