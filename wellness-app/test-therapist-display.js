const mongoose = require('mongoose');

async function testTherapistDisplay() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/serenity_db');
    console.log('Connected to database');
    
    // Import models
    const Service = require('./models/Service').default;
    const Therapist = require('./models/Therapist').default;
    
    // Find a service with therapists assigned
    const service = await Service.findOne({ therapists: { $exists: true, $ne: [] } })
      .populate('therapists');
    
    if (!service) {
      console.log('No service with assigned therapists found');
      return;
    }
    
    console.log('Service:', service.name);
    console.log('Therapists assigned:', service.therapists.length);
    
    service.therapists.forEach((therapist, index) => {
      console.log(`Therapist ${index + 1}:`);
      console.log('  Full Name:', therapist.fullName);
      console.log('  First Name:', therapist.firstName);
      console.log('  Last Name:', therapist.lastName);
      console.log('  Professional Title:', therapist.professionalTitle);
      console.log('  Available Fields:', Object.keys(therapist.toObject()));
      console.log('---');
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testTherapistDisplay();