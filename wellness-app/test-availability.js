const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import the Therapist model
const TherapistModel = require('./models/Therapist');

async function testAvailability() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find a therapist profile
    const therapist = await TherapistModel.findOne({}).lean();
    if (therapist) {
      console.log('Therapist found:');
      console.log('Full Name:', therapist.fullName);
      console.log('Weekly Availability:', therapist.weeklyAvailability);
    } else {
      console.log('No therapist found');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error:', error);
  }
}

testAvailability();