// Test script to verify search API with location filters
async function testSearchAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('=== Testing Search API with Location Filters ===\n');
    
    // Test 1: Search without filters
    console.log('1. Search without filters:');
    let response = await fetch(`${baseUrl}/api/businesses/search`);
    let data = await response.json();
    console.log(`Found ${data.data.businesses.length} businesses`);
    console.log(`Available locations: ${data.data.filters.locations.slice(0, 5).join(', ')}...`);
    console.log(`Available service types: ${data.data.filters.serviceTypes.join(', ')}`);
    console.log();
    
    // Test 2: Search with country filter
    console.log('2. Search with country filter (USA):');
    response = await fetch(`${baseUrl}/api/businesses/search?country=USA`);
    data = await response.json();
    console.log(`Found ${data.data.businesses.length} businesses in USA`);
    console.log(`Available states in USA: ${data.data.filters.states.slice(0, 5).join(', ')}...`);
    console.log(`Available cities in USA: ${data.data.filters.cities.slice(0, 5).join(', ')}...`);
    console.log();
    
    // Test 3: Search with country and state filter
    console.log('3. Search with country and state filter (USA, California):');
    response = await fetch(`${baseUrl}/api/businesses/search?country=USA&state=California`);
    data = await response.json();
    console.log(`Found ${data.data.businesses.length} businesses in California`);
    console.log(`Available cities in California: ${data.data.filters.cities.join(', ')}`);
    console.log();
    
    // Test 4: Search with full location filter
    console.log('4. Search with full location filter (USA, California, Los Angeles):');
    response = await fetch(`${baseUrl}/api/businesses/search?country=USA&state=California&city=Los Angeles`);
    data = await response.json();
    console.log(`Found ${data.data.businesses.length} businesses in Los Angeles`);
    console.log();
    
    // Test 5: Search with India filter
    console.log('5. Search with India filter:');
    response = await fetch(`${baseUrl}/api/businesses/search?country=India`);
    data = await response.json();
    console.log(`Found ${data.data.businesses.length} businesses in India`);
    console.log(`Available states in India: ${data.data.filters.states.join(', ')}`);
    console.log();
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testSearchAPI();