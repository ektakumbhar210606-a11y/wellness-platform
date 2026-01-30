const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serenity_db');
    console.log('Connected to database');
    
    const Service = require('./models/Service');
    const Therapist = require('./models/Therapist');
    
    // Find all services and their therapists
    console.log('\n=== Services and their assigned therapists ===');
    const services = await Service.find({}).populate('therapists').populate('business');
    services.forEach(service => {
      console.log(`\nService: ${service.name} (ID: ${service._id})`);
      console.log(`  Business: ${service.business ? service.business.name : 'No business'}`);
      console.log(`  Therapists assigned: ${service.therapists ? service.therapists.length : 0}`);
      if (service.therapists && service.therapists.length > 0) {
        service.therapists.forEach(therapist => {
          console.log(`    - ${therapist.firstName} ${therapist.lastName} (ID: ${therapist._id})`);
        });
      } else {
        console.log('    - No therapists assigned');
      }
    });
    
    // Check if there are any services with therapists assigned
    const servicesWithTherapists = await Service.find({ 
      therapists: { $exists: true, $ne: [] } 
    }).populate('therapists');
    
    console.log('\n=== Services with assigned therapists ===');
    if (servicesWithTherapists.length > 0) {
      servicesWithTherapists.forEach(service => {
        console.log(`\nService: ${service.name} (ID: ${service._id})`);
        console.log(`  Therapists: ${service.therapists.length}`);
        service.therapists.forEach(therapist => {
          console.log(`    - ${therapist.firstName} ${therapist.lastName} (ID: ${therapist._id})`);
        });
      });
    } else {
      console.log('No services found with assigned therapists');
    }
    
    await mongoose.connection.close();
    console.log('\nTest completed');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testData();