import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Mimic exactly what the service API is doing
    const services = await ServiceModel.find({ business: "697adb77510320abd78b03f6" })
      .populate('therapists', 'fullName user business experience skills availabilityStatus email phoneNumber professionalTitle bio certifications licenseNumber weeklyAvailability areaOfExpertise')
      .select('-__v');
    
    // Return the exact same format as the service API
    return Response.json(
      services.map((service: any) => ({
        _id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.serviceCategory,
        status: service.status,
        therapists: service.therapists ? (service.therapists as any[]).map((therapist: any) => {
          return {
            _id: therapist._id,
            firstName: therapist.fullName || '',
            lastName: '',
            name: therapist.fullName || 'Unknown Therapist',
            specialty: therapist.professionalTitle || 'General Therapist',
            expertise: therapist.areaOfExpertise || [],
            availability: therapist.weeklyAvailability || {},
            status: therapist.availabilityStatus || 'active',
            profileImage: null
          };
        }) : []
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}