// Test script to verify location data functionality
const {
  getAllCountries,
  getStatesForCountry,
  getCitiesForState,
  getCountryCode,
  getCountryName
} = require('./app/utils/locationData');

console.log('=== Location Data Test ===\n');

// Test 1: Get all countries
console.log('1. All Countries (A-Z):');
const countries = getAllCountries();
console.log(`Total countries: ${countries.length}`);
console.log('First 10 countries:', countries.slice(0, 10));
console.log('Last 5 countries:', countries.slice(-5));
console.log();

// Test 2: Get states for specific countries
console.log('2. States for major countries:');
const testCountries = ['United States', 'India', 'Canada', 'United Kingdom'];
testCountries.forEach(country => {
  const states = getStatesForCountry(country);
  console.log(`${country}: ${states.length} states`);
  if (states.length > 0) {
    console.log(`  Sample states: ${states.slice(0, 5).join(', ')}`);
  }
  console.log();
});

// Test 3: Get cities for specific state-country combinations
console.log('3. Cities for specific locations:');
const testLocations = [
  { country: 'United States', state: 'California' },
  { country: 'India', state: 'Maharashtra' },
  { country: 'Canada', state: 'Ontario' }
];

testLocations.forEach(({ country, state }) => {
  const cities = getCitiesForState(country, state);
  console.log(`${country} - ${state}: ${cities.length} cities`);
  if (cities.length > 0) {
    console.log(`  Cities: ${cities.join(', ')}`);
  }
  console.log();
});

// Test 4: Country code conversion
console.log('4. Country code conversion:');
const countryConversions = [
  'United States',
  'United Kingdom', 
  'India',
  'Canada'
];

countryConversions.forEach(country => {
  const code = getCountryCode(country);
  const name = getCountryName(code);
  console.log(`${country} -> ${code} -> ${name}`);
});

console.log('\n=== Test Complete ===');