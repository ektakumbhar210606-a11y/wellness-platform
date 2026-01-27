import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel, { IService } from '@/models/Service';
import ServiceCategoryModel from '@/models/ServiceCategory';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';

// Simple JWT verification (for demo purposes)
// In production, use a proper JWT library like 'jsonwebtoken'
function verifyToken(token: string, secret: string): any {
  try {
    // For demo purposes, we'll just decode the payload
    // In production, use a proper JWT library
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // In a real implementation, you would verify the signature here
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decodedToken: any;
    try {
      decodedToken = verifyToken(token, process.env.JWT_SECRET || 'fallback_secret_key');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch the user from the database to verify their role
    const user = await UserModel.findById(decodedToken.id || decodedToken.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user has the 'Provider' or 'Business' role
    if (user.role.toLowerCase() !== 'business' && user.role.toLowerCase() !== 'provider') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { serviceCategoryId, price, duration, description, images, teamMembers, therapists } = body;

    // Validate required fields
    if (!serviceCategoryId || !price || !duration || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceCategoryId, price, duration, and description are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof serviceCategoryId !== 'string' || typeof description !== 'string' || 
        typeof price !== 'number' || typeof duration !== 'number' ||
        (therapists && !Array.isArray(therapists))) {
      return NextResponse.json(
        { error: 'Invalid data types: serviceCategoryId and description must be strings; price and duration must be numbers; therapists must be an array' },
        { status: 400 }
      );
    }

    // Validate price and duration
    if (price < 0 || duration < 1) {
      return NextResponse.json(
        { error: 'Price must be non-negative and duration must be at least 1 minute' },
        { status: 400 }
      );
    }

    // Find the business associated with the user
    const business = await BusinessModel.findOne({ owner: user._id });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Verify service category exists and is active
    const serviceCategory = await ServiceCategoryModel.findById(serviceCategoryId);
    if (!serviceCategory || !serviceCategory.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive service category' },
        { status: 400 }
      );
    }

    // Create new service
    const newService = new ServiceModel({
      business: business._id,
      serviceCategory: serviceCategoryId,
      price,
      duration,
      description,
      therapists: therapists || [], // Assign therapists if provided
      teamMembers: teamMembers || [] // Also assign team members if provided
    });

    const createdService = await newService.save();

    // Populate service category name
    const populatedService = await ServiceModel.findById(createdService._id)
      .populate('serviceCategory', 'name');

    return NextResponse.json(
      { 
        message: 'Service created successfully', 
        service: {
          id: populatedService._id.toString(),
          serviceCategory: {
            id: populatedService.serviceCategory._id.toString(),
            name: populatedService.serviceCategory.name
          },
          price: populatedService.price,
          duration: populatedService.duration,
          description: populatedService.description,
          therapists: populatedService.therapists || [],
          createdAt: populatedService.createdAt,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating service:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}