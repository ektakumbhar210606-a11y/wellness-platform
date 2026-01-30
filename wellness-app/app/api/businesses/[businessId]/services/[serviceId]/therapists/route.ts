import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '../../../../../../../models/Service';
import TherapistModel from '../../../../../../../models/Therapist';
import BusinessModel from '../../../../../../../models/Business';
import jwt from 'jsonwebtoken';
import UserModel from '../../../../../../../models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string; serviceId: string } }
) {
  try {
    await connectToDatabase();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (err) {
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

    const { businessId, serviceId } = params;

    // Validate businessId and serviceId
    if (!businessId || !serviceId) {
      return Response.json(
        { message: 'Business ID and Service ID are required' },
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
    
    if (!therapistIds || therapistIds.length === 0) {
      // Return empty array if no therapists are assigned to this service
      return Response.json([], { status: 200 });
    }

    // Fetch the therapists that are assigned to this service
    const therapists = await TherapistModel.find({
      '_id': { $in: therapistIds }
    }).select('firstName lastName specialty expertise availability status profileImage');

    // Return the therapists
    return Response.json(
      therapists.map(therapist => ({
        _id: therapist._id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        name: `${therapist.firstName} ${therapist.lastName}`,
        specialty: therapist.specialty || 'General Therapist',
        expertise: therapist.expertise || [],
        availability: therapist.availability || {},
        status: therapist.status || 'active',
        profileImage: therapist.profileImage
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching therapists for service:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}