import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import the Therapist model
import TherapistModel from './models/Therapist.js';

async function setAvailability() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find a therapist profile
    const therapist = await TherapistModel.findOne({ fullName: 'bhavika' });
    if (therapist) {
      console.log('Therapist found:', therapist.fullName);
      
      // Set weekly availability
      therapist.weeklyAvailability = [
        { day: 'Monday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', available: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', available: false },
        { day: 'Sunday', available: false }
      ];
      
      // Save the updated profile
      await therapist.save();
      console.log('Weekly availability updated successfully');
      
      // Verify the update
      const updatedTherapist = await TherapistModel.findOne({ fullName: 'bhavika' }).lean();
      console.log('Updated weekly availability:', updatedTherapist.weeklyAvailability);
    } else {
      console.log('No therapist found with name bhavika');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error:', error);
  }
}

setAvailability();