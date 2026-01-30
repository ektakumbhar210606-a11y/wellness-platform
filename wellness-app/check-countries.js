const { connectToDatabase } = require('./lib/db');
const BusinessModel = require('./models/Business').default;

async function checkCountries() {
  try {
    await connectToDatabase();
    
    // Get all distinct countries
    const countries = await BusinessModel.distinct('address.country', { status: 'active' });
    console.log('Available countries:', countries);
    
    // Get all businesses with their country and city info
    const businesses = await BusinessModel.find({ status: 'active' }, {
      name: 1,
      'address.country': 1,
      'address.city': 1
    });
    
    console.log('\nBusinesses by country:');
    const countryCityMap = new Map();
    
    businesses.forEach(business => {
      const country = business.address?.country || 'Unknown';
      const city = business.address?.city || 'Unknown';
      
      if (!countryCityMap.has(country)) {
        countryCityMap.set(country, new Set());
      }
      countryCityMap.get(country).add(city);
    });
    
    countryCityMap.forEach((cities, country) => {
      console.log(`${country}: [${Array.from(cities).join(', ')}]`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCountries();