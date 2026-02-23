// Simple direct API test
const http = require('http');

function testAPIEndpoint(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`Testing: ${path}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response:`, JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Raw response:`, data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error testing ${path}:`, error);
      reject(error);
    });

    req.end();
  });
}

// You'll need to replace this with a valid business user token
const BUSINESS_TOKEN = 'YOUR_BUSINESS_TOKEN_HERE';

async function runTests() {
  try {
    console.log('=== Business API Tests ===\n');
    
    // Test business therapists endpoint
    await testAPIEndpoint('/api/business/therapists', BUSINESS_TOKEN);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test business reviews endpoint
    await testAPIEndpoint('/api/business/reviews', BUSINESS_TOKEN);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test with therapist filter
    await testAPIEndpoint('/api/business/reviews?therapistId=TEST_ID', BUSINESS_TOKEN);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();