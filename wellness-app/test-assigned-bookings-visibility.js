// Test script to verify assigned bookings visibility in business dashboard
const testAssignedBookingsVisibility = async () => {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('=== Testing Assigned Bookings Visibility ===\n');
    
    // Test the business bookings API endpoint
    console.log('1. Testing business bookings API endpoint...');
    
    // This would require a valid business JWT token
    const token = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
    
    if (token !== 'YOUR_BUSINESS_JWT_TOKEN_HERE') {
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
          
          if (assignedCount > 0) {
            console.log('✅ SUCCESS: Assigned bookings are visible in the business dashboard!');
          } else {
            console.log('⚠️  WARNING: No assigned bookings found in results');
          }
        }
      } else {
        const errorData = await pendingResponse.json();
        console.log('API Error:', errorData.error || 'Unknown error');
      }
    } else {
      console.log('Please replace "YOUR_BUSINESS_JWT_TOKEN_HERE" with a valid business token to run the full test.');
    }
    
    // Test the assign-to-therapist API to make sure it works correctly
    console.log('\n2. Testing assign-to-therapist functionality...');
    console.log('This requires valid booking and therapist IDs.');
    
    const assignToken = 'YOUR_BUSINESS_JWT_TOKEN_HERE';
    const testBookingId = 'TEST_BOOKING_ID';
    const testTherapistId = 'TEST_THERAPIST_ID';
    
    if (assignToken !== 'YOUR_BUSINESS_JWT_TOKEN_HERE' && 
        testBookingId !== 'TEST_BOOKING_ID' && 
        testTherapistId !== 'TEST_THERAPIST_ID') {
      
      const assignResponse = await fetch(`${baseUrl}/api/bookings/assign-to-therapist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${assignToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: testBookingId,
          therapistId: testTherapistId
        })
      });
      
      console.log('Assignment API status:', assignResponse.status);
      const assignResult = await assignResponse.json();
      console.log('Assignment result:', assignResult.success ? 'SUCCESS' : 'FAILED', '-', assignResult.message || assignResult.error);
    } else {
      console.log('Skipping assignment test - missing required parameters.');
    }
    
    console.log('\n=== Test Complete ===');
    console.log('\nExpected behavior after fixes:');
    console.log('✅ Assigned bookings should appear in the "Booking Requests" tab');
    console.log('✅ Assigned bookings should show "Assigned to Therapist" status tag');
    console.log('✅ Assigned bookings should show "Assigned by Admin" indicator under therapist name');
    console.log('✅ Businesses can still manage (confirm/cancel/reschedule) assigned bookings');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

testAssignedBookingsVisibility();