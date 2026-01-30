const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serenity_db');
    console.log('Connected to database');
    
    const Service = require('./models/Service').default;
    const Therapist = require('./models/Therapist').default;
    const Business = require('./models/Business').default;
    
    // Find all services and their therapists
    console.log('\n=== Services and their therapists ===');
    const services = await Service.find({}).populate('therapists').populate('business');
    services.forEach(service => {
      console.log(`Service: ${service.name} (ID: ${service._id})`);
      console.log(`  Business: ${service.business ? service.business.name : 'No business'}`);
      console.log(`  Therapists assigned: ${service.therapists ? service.therapists.length : 0}`);
      if (service.therapists && service.therapists.length > 0) {
        service.therapists.forEach(therapist => {
          console.log(`    - ${therapist.firstName} ${therapist.lastName} (ID: ${therapist._id})`);
        });
      }
      console.log('');
    });
    
    // Find all therapists
    console.log('=== All therapists ===');
    const therapists = await Therapist.find({});
    therapists.forEach(therapist => {
      console.log(`${therapist.firstName} ${therapist.lastName} (ID: ${therapist._id})`);
    });
    
    // Find all businesses
    console.log('\n=== All businesses ===');
    const businesses = await Business.find({});
    businesses.forEach(business => {
      console.log(`${business.name} (ID: ${business._id})`);
    });
    
    await mongoose.connection.close();
    console.log('\nTest completed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testData();