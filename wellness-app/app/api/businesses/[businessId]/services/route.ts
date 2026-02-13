import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel, { IService } from '@/models/Service';
import BusinessModel from '@/models/Business';
import TherapistModel, { ITherapist } from '@/models/Therapist';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/User';
import type { JwtPayload } from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    console.log('API called with businessId:', businessId);
    await connectToDatabase();
    console.log('Connected to database');
    
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

    // Validate businessId
    if (!businessId) {
      return Response.json(
        { message: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Check if the business exists
    console.log('Looking for business with ID:', businessId.toString());
    const business = await BusinessModel.findById(businessId.toString());
    console.log('Business found:', business);
    if (!business) {
      console.log('Business not found in database');
      return Response.json(
        { message: 'Business not found' },
        { status: 404 }
      );
    }

    // Fetch services for this business with therapists populated
    const services = await ServiceModel.find({ business: businessId })
      .populate('therapists', 'fullName user business experience skills availabilityStatus email phoneNumber professionalTitle bio certifications licenseNumber weeklyAvailability areaOfExpertise')
      .select('-__v');

    // Return the services
    return Response.json(
      services.map((service: IService) => ({
        _id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.serviceCategory,
        businessCountry: business.address?.country, // Include business country for currency formatting
        therapists: service.therapists ? (service.therapists as ITherapist[]).map((therapist: ITherapist) => {
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
  } catch (error: unknown) {
    console.error('Error fetching business services:', error);
    return Response.json(
      { message: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}