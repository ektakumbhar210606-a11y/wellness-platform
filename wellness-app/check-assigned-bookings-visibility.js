// Test script to check if assigned bookings are visible in business dashboard
const checkAssignedBookingsVisibility = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('=== Checking Assigned Bookings Visibility ===\n');
    
    // First, let's see what bookings exist in the database
    console.log('1. Checking all bookings in database...');
    const allBookingsResponse = await fetch(`${baseUrl}/api/test-all-therapists`);
    const allBookingsData = await allBookingsResponse.json();
    console.log('Total bookings in database:', allBookingsData.bookings?.length || 0);
    
    if (allBookingsData.bookings && allBookingsData.bookings.length > 0) {
      console.log('\nAll bookings:');
      allBookingsData.bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Customer: ${booking.customerName} | Service: ${booking.serviceName} | Status: ${booking.status} | Assigned: ${booking.assignedByAdmin || false} | Therapist: ${booking.therapistName || 'None'}`);
      });
    }
    
    // Now test the business API endpoint that the frontend uses
    console.log('\n2. Testing business bookings API (requires valid token)...');
    console.log('This test requires a valid business JWT token to run properly.');
    console.log('Please replace "YOUR_BUSINESS_TOKEN_HERE" with a valid token.\n');
    
    // This would be the actual test with a real token
    const token = 'YOUR_BUSINESS_TOKEN_HERE'; // Replace with actual token
    
    if (token !== 'YOUR_BUSINESS_TOKEN_HERE') {
      console.log('Testing with provided token...');
      
      // Test pending bookings (what the frontend requests)
      const pendingResponse = await fetch(`${baseUrl}/api/bookings/business?status=pending`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pending bookings API status:', pendingResponse.status);
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('Pending bookings returned:', pendingData.data?.length || 0);
        
        if (pendingData.data && pendingData.data.length > 0) {
          console.log('\nPending bookings from API:');
          pendingData.data.forEach((booking, index) => {
            console.log(`${index + 1}. ${booking.service?.name} - ${booking.customer?.name || booking.customer?.firstName} - Status: ${booking.status} - Assigned: ${booking.assignedByAdmin} - Therapist: ${booking.therapist?.fullName || 'None'}`);
          });
          
          // Count how many are assigned vs unassigned
          const assignedCount = pendingData.data.filter(b => b.assignedByAdmin).length;
          const unassignedCount = pendingData.data.filter(b => !b.assignedByAdmin).length;
          console.log(`\nSummary: ${assignedCount} assigned, ${unassignedCount} unassigned`);
        }
      } else {
        const errorData = await pendingResponse.json();
        console.log('API Error:', errorData.error || 'Unknown error');
      }
    } else {
      console.log('Skipping API test - no valid token provided');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('\nTo fix visibility issues:');
    console.log('1. Ensure assignedByAdmin field is properly set when bookings are assigned');
    console.log('2. Verify the business API includes assigned bookings in pending results');
    console.log('3. Check that frontend is not filtering out assigned bookings');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

checkAssignedBookingsVisibility();