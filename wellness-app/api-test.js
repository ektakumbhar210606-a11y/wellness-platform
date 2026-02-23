// Simple API test to check if business reviews endpoint works
const http = require('http');

// Test the business reviews API endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/business/reviews',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-test-token-here' // You'll need to replace this with a valid token
  }
};

console.log('Testing business reviews API endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();