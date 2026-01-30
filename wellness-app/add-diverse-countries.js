const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addDiverseCountries() {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    // Connect to MongoDB using the environment variable
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness-platform';
    const client = new MongoClient(uri);
    
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessesCollection = db.collection('businesses');
    
    // Define diverse countries to add
    const diverseCountries = [
      { name: "Africa Wellness Center", country: "South Africa", city: "Cape Town", state: "Western Cape" },
      { name: "India Spa Resort", country: "India", city: "Mumbai", state: "Maharashtra" },
      { name: "New Zealand Retreat", country: "New Zealand", city: "Auckland", state: "Auckland Region" },
      { name: "Brazil Natural Therapy", country: "Brazil", city: "São Paulo", state: "São Paulo" },
      { name: "Japan Wellness Clinic", country: "Japan", city: "Tokyo", state: "Tokyo" },
      { name: "France Luxury Spa", country: "France", city: "Paris", state: "Île-de-France" },
      { name: "Australia Relaxation Center", country: "Australia", city: "Sydney", state: "New South Wales" },
      { name: "Germany Holistic Health", country: "Germany", city: "Berlin", state: "Berlin" },
      { name: "Canada Wellness Hub", country: "Canada", city: "Toronto", state: "Ontario" },
      { name: "Mexico Resort Spa", country: "Mexico", city: "Cancun", state: "Quintana Roo" },
      { name: "Italy Beauty Sanctuary", country: "Italy", city: "Rome", state: "Lazio" },
      { name: "China Traditional Medicine", country: "China", city: "Shanghai", state: "Shanghai" }
    ];

    // Prepare business documents
    const businessDocs = diverseCountries.map((countryData, index) => ({
      name: countryData.name,
      description: `Wellness services in ${countryData.city}, ${countryData.country}`,
      serviceType: "wellness",
      serviceName: "Relaxation Therapy",
      address: {
        street: `${index + 123} Wellness Street`,
        city: countryData.city,
        state: countryData.state,
        zipCode: `${index + 10000}`,
        country: countryData.country
      },
      phone: `+${index + 1}-${index + 1234567890}`,
      email: `contact${index}@${countryData.country.toLowerCase().replace(/\s+/g, '')}.com`,
      openingTime: "09:00",
      closingTime: "19:00",
      businessHours: {
        Monday: { open: "09:00", close: "19:00", closed: false },
        Tuesday: { open: "09:00", close: "19:00", closed: false },
        Wednesday: { open: "09:00", close: "19:00", closed: false },
        Thursday: { open: "09:00", close: "19:00", closed: false },
        Friday: { open: "09:00", close: "20:00", closed: false },
        Saturday: { open: "10:00", close: "18:00", closed: false },
        Sunday: { open: "10:00", close: "17:00", closed: false }
      },
      status: "active",
      createdAt: new Date()
    }));

    // Insert the new businesses
    const result = await businessesCollection.insertMany(businessDocs);
    console.log(`Inserted ${result.insertedCount} new businesses with diverse countries`);
    
    // Get all distinct countries to verify
    const allCountries = await businessesCollection.distinct('address.country', { status: 'active' });
    console.log('All countries in database (sorted):', allCountries.sort());
    
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error adding diverse countries:', error);
  }
}

addDiverseCountries();