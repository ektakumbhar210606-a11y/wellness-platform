import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all services with their therapists
    const services = await ServiceModel.find({}).populate('therapists').populate('business');
    
    // Get all therapists
    const therapists = await TherapistModel.find({});
    
    // Check services with assigned therapists
    const servicesWithTherapists = await ServiceModel.find({ 
      therapists: { $exists: true, $ne: [] } 
    }).populate('therapists');
    
    // Helper function to format therapist data
    const formatTherapist = (therapist: any) => ({
      id: therapist._id,
      firstName: therapist.firstName,
      lastName: therapist.lastName
    });
    
    // Helper function to format service data
    const formatService = (service: any) => ({
      id: service._id,
      name: service.name,
      business: service.business ? service.business.name : null,
      therapistCount: service.therapists ? service.therapists.length : 0,
      therapistIds: service.therapists ? service.therapists.map((t: any) => t._id) : [],
      therapists: service.therapists ? service.therapists.map(formatTherapist) : []
    });
    
    return Response.json({
      message: 'Service-therapist relationship data',
      totalServices: services.length,
      totalTherapists: therapists.length,
      servicesWithTherapists: servicesWithTherapists.length,
      allServices: services.map(formatService),
      servicesWithTherapistsList: servicesWithTherapists.map(service => ({
        id: service._id,
        name: service.name,
        therapistCount: service.therapists.length,
        therapists: service.therapists.map(formatTherapist)
      }))
    });
  } catch (error) {
    console.error('Error fetching service-therapist relationship data:', error);
    return Response.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}