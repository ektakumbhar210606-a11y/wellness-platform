import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import TherapistModel from '../../../models/Therapist';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find a therapist profile
    const therapist = await TherapistModel.findOne({}).lean();
    if (therapist) {
      return Response.json({
        success: true,
        fullName: therapist.fullName,
        weeklyAvailability: therapist.weeklyAvailability,
        skills: therapist.skills
      });
    } else {
      return Response.json({
        success: false,
        message: 'No therapist found'
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