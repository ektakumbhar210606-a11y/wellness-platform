import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import TherapistModel from '../../../models/Therapist';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find all therapist profiles
    const therapists = await TherapistModel.find({});
    const result = therapists.map(therapist => ({
      id: therapist._id.toString(),
      fullName: therapist.fullName,
      userId: therapist.user,
      weeklyAvailability: therapist.weeklyAvailability,
      skills: therapist.skills
    }));
    
    return Response.json({
      success: true,
      count: result.length,
      therapists: result
    });
  } catch (error: any) {
    console.error('Error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}