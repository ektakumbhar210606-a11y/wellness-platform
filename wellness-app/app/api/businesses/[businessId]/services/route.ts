import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '../../../../../models/Service';
import BusinessModel from '../../../../../models/Business';
import jwt from 'jsonwebtoken';
import UserModel from '../../../../../models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    console.log('API called with businessId:', businessId);
    await connectToDatabase();
    console.log('Connected to database');

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

    // Fetch services for this business
    const services = await ServiceModel.find({ business: businessId }).select('-__v');

    // Return the services
    return Response.json(
      services.map((service: any) => ({
        _id: service._id,
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration,
        category: service.serviceCategory,
        status: service.status
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching business services:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}