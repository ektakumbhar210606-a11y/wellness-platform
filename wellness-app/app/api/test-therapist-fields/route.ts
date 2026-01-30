import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TherapistModel from '@/models/Therapist';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all therapists and show their structure
    const therapists = await TherapistModel.find({});
    
    return Response.json({
      message: 'Therapist data structure',
      totalTherapists: therapists.length,
      therapists: therapists.map(t => ({
        id: t._id.toString(),
        firstName: t.firstName,
        lastName: t.lastName,
        fullName: t.fullName,
        user: t.user,
        business: t.business,
        allFields: Object.keys(t.toObject())
      }))
    });
  } catch (error) {
    console.error('Error fetching therapist data:', error);
    return Response.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}