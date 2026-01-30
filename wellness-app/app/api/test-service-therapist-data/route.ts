import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';
import BusinessModel from '@/models/Business';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Force model registration by accessing them
    console.log('Registering models...');
    console.log('ServiceModel name:', ServiceModel.modelName);
    console.log('TherapistModel name:', TherapistModel.modelName);
    console.log('BusinessModel name:', BusinessModel.modelName);
    
    // Get all services with their therapists
    const services = await ServiceModel.find({}).populate('therapists').populate('business');
    
    // Check services with assigned therapists
    const servicesWithTherapists = await ServiceModel.find({ 
      therapists: { $exists: true, $ne: [] } 
    }).populate('therapists');
    
    return Response.json({
      message: 'Service-therapist relationship data',
      totalServices: services.length,
      servicesWithTherapists: servicesWithTherapists.length,
      allServices: services.map(service => ({
        id: service._id.toString(),
        name: service.name,
        business: service.business ? service.business.name : null,
        therapistCount: service.therapists ? service.therapists.length : 0,
        therapists: service.therapists ? service.therapists.map((t: any) => ({
          id: t._id.toString(),
          firstName: t.firstName,
          lastName: t.lastName,
          fullName: `${t.firstName} ${t.lastName}`
        })) : []
      })),
      servicesWithTherapistsList: servicesWithTherapists.map(service => ({
        id: service._id.toString(),
        name: service.name,
        therapistCount: service.therapists.length,
        therapists: service.therapists.map((t: any) => ({
          id: t._id.toString(),
          firstName: t.firstName,
          lastName: t.lastName,
          fullName: `${t.firstName} ${t.lastName}`
        }))
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