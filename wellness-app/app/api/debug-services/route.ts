import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all services with detailed logging
    const services = await ServiceModel.find({}).populate('serviceCategory');
    
    const debugInfo = services.map(service => ({
      id: service._id.toString(),
      name: service.name,
      nameType: typeof service.name,
      nameExists: service.name !== undefined,
      serviceCategory: service.serviceCategory ? {
        id: service.serviceCategory._id.toString(),
        name: (service.serviceCategory as any).name
      } : null,
      price: service.price,
      duration: service.duration,
      description: service.description,
      rawDocument: {
        ...service.toObject(),
        _id: service._id.toString()
      }
    }));
    
    return NextResponse.json({
      message: 'Service debug information',
      count: services.length,
      services: debugInfo,
      schema: ServiceModel.schema.obj
    });
    
  } catch (error: unknown) {
    console.error('Debug services error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}