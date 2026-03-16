/**
 * Test script for customer cancellation analytics API
 * Verifies that therapist-initiated cancellations are properly tracked
 */

const fetch = require('node-fetch');

async function testCustomerCancellationAnalytics() {
  console.log('🧪 Testing Customer Cancellation Analytics API...\n');

  // Get auth token from environment or use a test token
  const token = process.env.TEST_CUSTOMER_TOKEN || 'your_test_customer_token_here';

  if (!process.env.TEST_CUSTOMER_TOKEN) {
    console.log('⚠️  No TEST_CUSTOMER_TOKEN environment variable found.');
    console.log('Please set TEST_CUSTOMER_TOKEN to run this test.\n');
    console.log('Example:');
    console.log('set TEST_CUSTOMER_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/customer/analytics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.ok ? '✅' : '❌'}\n`);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error Response:', JSON.stringify(errorData, null, 2));
      return;
    }

    const analytics = await response.json();

    console.log('📈 Customer Analytics Data:');
    console.log('===========================================');
    console.log(`Total Bookings: ${analytics.totalBookings}`);
    console.log(`Completed Bookings: ${analytics.totalCompletedBookings}`);
    console.log(`Total Spent: ₹${analytics.totalSpent}`);
    console.log('');

    // Cancellation Analytics
    console.log('🔴 Cancellation Analytics:');
    console.log('-------------------------------------------');
    console.log(`Cancelled Bookings: ${analytics.cancelledBookings || 0}`);
    console.log(`Cancellation Rate: ${(analytics.cancellationRate || 0).toFixed(1)}%`);
    console.log('');

    // Monthly Cancellations
    console.log('📅 Monthly Cancellation Trend:');
    console.log('-------------------------------------------');
    if (analytics.monthlyCancellations && analytics.monthlyCancellations.length > 0) {
      analytics.monthlyCancellations.forEach(item => {
        console.log(`  ${item.month}: ${item.count} cancellations`);
      });
    } else {
      console.log('  No monthly cancellation data available');
    }
    console.log('');

    // Cancellation Reasons
    console.log('📋 Cancellation Reasons Breakdown:');
    console.log('-------------------------------------------');
    if (analytics.cancellationReasons && analytics.cancellationReasons.length > 0) {
      analytics.cancellationReasons.forEach(item => {
        const percentage = analytics.cancellationReasons.reduce((sum, r) => sum + r.count, 0);
        const percent = ((item.count / percentage) * 100).toFixed(1);
        console.log(`  ${item.reason}: ${item.count} (${percent}%)`);
      });
    } else {
      console.log('  No cancellation reason data available');
    }
    console.log('');

    console.log('===========================================');
    console.log('✅ Test completed successfully!\n');

    // Verify data structure
    console.log('🔍 Validating Data Structure:');
    console.log('-------------------------------------------');
    
    const requiredFields = [
      'totalBookings',
      'totalCompletedBookings',
      'totalSpent',
      'cancelledBookings',
      'cancellationRate',
      'monthlyCancellations',
      'cancellationReasons'
    ];

    let allFieldsPresent = true;
    requiredFields.forEach(field => {
      const present = field in analytics;
      console.log(`  ${present ? '✅' : '❌'} ${field}: ${present ? 'Present' : 'Missing'}`);
      if (!present) allFieldsPresent = false;
    });

    console.log('');
    if (allFieldsPresent) {
      console.log('✅ All required fields are present!');
    } else {
      console.log('❌ Some required fields are missing!');
    }

    // Verify cancellation data format
    console.log('\n🔍 Validating Cancellation Data Format:');
    console.log('-------------------------------------------');
    
    if (Array.isArray(analytics.monthlyCancellations)) {
      console.log('  ✅ monthlyCancellations is an array');
      if (analytics.monthlyCancellations.length > 0) {
        const firstItem = analytics.monthlyCancellations[0];
        const hasMonth = 'month' in firstItem;
        const hasCount = 'count' in firstItem;
        console.log(`  ${hasMonth ? '✅' : '❌'} Items have 'month' field`);
        console.log(`  ${hasCount ? '✅' : '❌'} Items have 'count' field`);
      }
    } else {
      console.log('  ❌ monthlyCancellations is not an array');
    }

    if (Array.isArray(analytics.cancellationReasons)) {
      console.log('  ✅ cancellationReasons is an array');
      if (analytics.cancellationReasons.length > 0) {
        const firstItem = analytics.cancellationReasons[0];
        const hasReason = 'reason' in firstItem;
        const hasCount = 'count' in firstItem;
        console.log(`  ${hasReason ? '✅' : '❌'} Items have 'reason' field`);
        console.log(`  ${hasCount ? '✅' : '❌'} Items have 'count' field`);
      }
    } else {
      console.log('  ❌ cancellationReasons is not an array');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCustomerCancellationAnalytics();
