import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import TherapistModel from '../../../models/Therapist';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find a therapist profile
    const therapist = await TherapistModel.findOne({ fullName: 'bhavika' });
    if (therapist) {
      console.log('Therapist found:', therapist.fullName);
      
      // Set skills if not already set
      if (!therapist.skills || therapist.skills.length === 0) {
        therapist.skills = ['Massage Therapy'];
      }
      
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
      
      return Response.json({
        success: true,
        message: 'Weekly availability updated successfully'
      });
    } else {
      return Response.json({
        success: false,
        message: 'No therapist found with name bhavika'
      });
    }
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}