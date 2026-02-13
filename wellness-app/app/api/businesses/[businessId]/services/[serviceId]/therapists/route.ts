import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';
import TherapistModel, { ITherapist } from '@/models/Therapist';
import BusinessModel from '@/models/Business';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/User';
import type { JwtPayload } from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; serviceId: string }> }
) {
  try {
    console.log('API Route - Raw params promise:', params);
    const awaitedParams = await params;
    console.log('API Route - Awaited params:', awaitedParams);
    const { businessId, serviceId } = awaitedParams;

    await connectToDatabase();

    // Force model registration by accessing them
    console.log('Registering models...');
    console.log('ServiceModel name:', ServiceModel.modelName);
    console.log('TherapistModel name:', TherapistModel.modelName);
    console.log('BusinessModel name:', BusinessModel.modelName);

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError: unknown) {
      return Response.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user to verify existence
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return Response.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Log the received parameters for debugging
    console.log('API Route - Received params:', { businessId, serviceId });
    console.log('API Route - businessId:', businessId);
    console.log('API Route - serviceId:', serviceId);
    
    // Log the extracted parameters
    console.log('API Route - Extracted businessId:', businessId);
    console.log('API Route - Extracted serviceId:', serviceId);

    // Validate businessId and serviceId
    console.log('API Route - Pre-validation check:');
    console.log('  businessId:', businessId);
    console.log('  serviceId:', serviceId);
    console.log('  businessId type:', typeof businessId);
    console.log('  serviceId type:', typeof serviceId);
    console.log('  businessId length:', businessId ? businessId.length : 'undefined');
    console.log('  serviceId length:', serviceId ? serviceId.length : 'undefined');
    console.log('  businessId is truthy:', !!businessId);
    console.log('  serviceId is truthy:', !!serviceId);
    
    if (!businessId || !serviceId) {
      console.log('API Route - Validation failed: businessId=', businessId, 'serviceId=', serviceId);
      return Response.json(
        { 
          message: 'Business ID and Service ID are required',
          businessId: businessId,
          serviceId: serviceId,
          businessIdType: typeof businessId,
          serviceIdType: typeof serviceId,
          businessIdLength: businessId ? businessId.length : undefined,
          serviceIdLength: serviceId ? serviceId.length : undefined
        },
        { status: 400 }
      );
    }
    
    // Additional validation for string types and empty values
    if (typeof businessId !== 'string' || businessId.trim() === '') {
      console.log('API Route - Business ID validation failed');
      return Response.json(
        { 
          message: 'Business ID must be a non-empty string',
          businessId: businessId,
          businessIdType: typeof businessId
        },
        { status: 400 }
      );
    }
    
    if (typeof serviceId !== 'string' || serviceId.trim() === '') {
      console.log('API Route - Service ID validation failed');
      return Response.json(
        { 
          message: 'Service ID must be a non-empty string',
          serviceId: serviceId,
          serviceIdType: typeof serviceId
        },
        { status: 400 }
      );
    }

    // Check if the business exists
    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return Response.json(
        { message: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if the service exists and belongs to the business
    const service = await ServiceModel.findOne({ 
      _id: serviceId, 
      business: businessId 
    });

    if (!service) {
      return Response.json(
        { message: 'Service not found for this business' },
        { status: 404 }
      );
    }

    // Get therapist IDs from the service
    const therapistIds = service.therapists || [];
    
    console.log('API Route - Service therapist IDs:', therapistIds);
    console.log('API Route - Service therapist IDs type:', Array.isArray(therapistIds) ? 'array' : typeof therapistIds);
    console.log('API Route - Service therapist IDs length:', therapistIds.length);
    
    if (!therapistIds || therapistIds.length === 0) {
      console.log('API Route - No therapists assigned to this service');
      // Return empty array if no therapists are assigned to this service
      return Response.json([], { status: 200 });
    }

    // Fetch the therapists that are assigned to this service
    console.log('API Route - Fetching therapists with IDs:', therapistIds);
    const therapists = await TherapistModel.find({
      '_id': { $in: therapistIds }
    }).select('fullName user business experience skills availabilityStatus email phoneNumber professionalTitle bio certifications licenseNumber weeklyAvailability areaOfExpertise');
    
    console.log('API Route - Found therapists:', therapists.map((t: ITherapist) => ({
      id: t._id,
      fullName: t.fullName,
      professionalTitle: t.professionalTitle
    })));
    console.log('API Route - Found therapists count:', therapists.length);

    // Return the therapists
    return Response.json(
      therapists.map((therapist: ITherapist) => ({
        _id: therapist._id,
        firstName: therapist.fullName || '',
        lastName: '',
        name: therapist.fullName || 'Unknown Therapist',
        specialty: therapist.professionalTitle || 'General Therapist',
        expertise: therapist.areaOfExpertise || [],
        availability: therapist.weeklyAvailability || {},
        status: therapist.availabilityStatus || 'active',
        profileImage: null
      })),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching therapists for service:', error);
    return Response.json(
      { message: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}