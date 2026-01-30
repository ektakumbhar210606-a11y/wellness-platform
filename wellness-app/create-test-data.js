const { connectToDatabase } = require('./lib/db');
const BusinessModel = require('./models/Business').default;

async function createTestData() {
  try {
    await connectToDatabase();
    
    // Create businesses with different countries and cities
    const testData = [
      {
        name: "Spa Retreat Canada",
        description: "Luxury spa services in Toronto",
        serviceType: "spa",
        serviceName: "Full Body Massage",
        address: {
          street: "123 Wellness Ave",
          city: "Toronto",
          state: "Ontario",
          zipCode: "M5V 2T6",
          country: "Canada"
        },
        phone: "416-555-0123",
        email: "info@sparetreat.ca",
        openingTime: "09:00",
        closingTime: "20:00",
        status: "active"
      },
      {
        name: "London Wellness Center",
        description: "Premium wellness services in London",
        serviceType: "wellness",
        serviceName: "Aromatherapy Session",
        address: {
          street: "456 Health St",
          city: "London",
          state: "England",
          zipCode: "SW1A 1AA",
          country: "United Kingdom"
        },
        phone: "+44-20-7946-0958",
        email: "hello@londonwellness.co.uk",
        openingTime: "08:00",
        closingTime: "19:00",
        status: "active"
      },
      {
        name: "Sydney Massage Therapy",
        description: "Professional massage therapy in Sydney",
        serviceType: "massage",
        serviceName: "Deep Tissue Massage",
        address: {
          street: "789 Relaxation Blvd",
          city: "Sydney",
          state: "NSW",
          zipCode: "2000",
          country: "Australia"
        },
        phone: "+61-2-9876-5432",
        email: "bookings@sydneymassage.com.au",
        openingTime: "10:00",
        closingTime: "18:00",
        status: "active"
      },
      {
        name: "Paris Beauty Spa",
        description: "Elegant spa treatments in Paris",
        serviceType: "spa",
        serviceName: "Facial Treatment",
        address: {
          street: "321 Luxe Street",
          city: "Paris",
          state: "Île-de-France",
          zipCode: "75001",
          country: "France"
        },
        phone: "+33-1-2345-6789",
        email: "reservations@parisbeauty.fr",
        openingTime: "09:30",
        closingTime: "21:00",
        status: "active"
      }
    ];

    // Check if businesses already exist
    const existingBusinesses = await BusinessModel.countDocuments({ 
      name: { $in: testData.map(b => b.name) } 
    });

    if (existingBusinesses === 0) {
      await BusinessModel.insertMany(testData);
      console.log('Test data created successfully!');
    } else {
      console.log('Test data already exists.');
    }

    // Verify the data
    const countries = await BusinessModel.distinct('address.country', { status: 'active' });
    console.log('Available countries:', countries.sort());
    
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

createTestData();