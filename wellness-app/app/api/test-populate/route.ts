import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Find a service with therapists and populate them
    const service = await ServiceModel.findOne({ therapists: { $exists: true, $ne: [] } })
      .populate('therapists');
    
    if (!service) {
      return Response.json({ message: 'No service with therapists found' });
    }
    
    return Response.json({
      serviceId: service._id,
      serviceName: service.name,
      therapistCount: service.therapists.length,
      therapists: service.therapists.map((therapist: any) => ({
        id: therapist._id,
        fullName: therapist.fullName,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        professionalTitle: therapist.professionalTitle
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}