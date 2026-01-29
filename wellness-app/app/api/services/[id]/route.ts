import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel from '@/models/Service';
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if the user has the 'provider' or 'business' role
    if (user.role.toLowerCase() !== 'business' && user.role.toLowerCase() !== 'provider') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const serviceId = (await params).id;

    // Find the business associated with the user
    const business = await BusinessModel.findOne({ owner: user._id });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Find and delete the service if it belongs to the user's business
    const deletedService = await ServiceModel.findOneAndDelete({
      _id: serviceId,
      business: business._id
    });

    if (!deletedService) {
      return NextResponse.json(
        { error: 'Service not found or does not belong to your business' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Service deleted successfully' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting service:', error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if the user has the 'provider' or 'business' role
    if (user.role.toLowerCase() !== 'business' && user.role.toLowerCase() !== 'provider') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const serviceId = (await params).id;

    // Find the business associated with the user
    const business = await BusinessModel.findOne({ owner: user._id });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Find the service if it belongs to the user's business
    const service = await ServiceModel.findOne({
      _id: serviceId,
      business: business._id
    }).populate('serviceCategory', 'name');

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or does not belong to your business' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        service: {
          id: service._id.toString(),
          serviceCategory: service.serviceCategory ? {
            id: service.serviceCategory._id.toString(),
            name: service.serviceCategory.name
          } : null,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          createdAt: service.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching service:', error);
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if the user has the 'provider' or 'business' role
    if (user.role.toLowerCase() !== 'business' && user.role.toLowerCase() !== 'provider') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const serviceId = (await params).id;

    // Parse request body
    const body = await req.json();
    const { serviceCategoryId, name, price, duration, description, therapists } = body;

    // Find the business associated with the user
    const business = await BusinessModel.findOne({ owner: user._id });
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Validate required fields if they are provided
    if (serviceCategoryId !== undefined && typeof serviceCategoryId !== 'string') {
      return NextResponse.json(
        { error: 'Service category ID must be a string' },
        { status: 400 }
      );
    }

    if (price !== undefined && typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Price must be a number' },
        { status: 400 }
      );
    }

    if (duration !== undefined && typeof duration !== 'number') {
      return NextResponse.json(
        { error: 'Duration must be a number' },
        { status: 400 }
      );
    }

    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name must be a string' },
        { status: 400 }
      );
    }



    if (therapists !== undefined && !Array.isArray(therapists)) {
      return NextResponse.json(
        { error: 'Therapists must be an array' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Verify service category exists and is active if provided
    if (serviceCategoryId !== undefined) {
      const serviceCategory = await ServiceCategoryModel.findById(serviceCategoryId);
      if (!serviceCategory || !serviceCategory.isActive) {
        return NextResponse.json(
          { error: 'Invalid or inactive service category' },
          { status: 400 }
        );
      }
      updateData.serviceCategory = serviceCategoryId;
    }
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;
    if (name !== undefined) updateData.name = name;
    if (therapists !== undefined) updateData.therapists = therapists;
    
    const updatedService = await ServiceModel.findOneAndUpdate(
      { _id: serviceId, business: business._id },
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedService) {
      return NextResponse.json(
        { error: 'Service not found or does not belong to your business' },
        { status: 404 }
      );
    }

    // Populate service category name
    const populatedService = await ServiceModel.findById(updatedService._id)
      .populate('serviceCategory', 'name');

    return NextResponse.json(
      { 
        message: 'Service updated successfully',
        service: {
          id: populatedService._id.toString(),
          serviceCategory: populatedService.serviceCategory ? {
            id: populatedService.serviceCategory._id.toString(),
            name: populatedService.serviceCategory.name
          } : null,
          name: populatedService.name,
          price: populatedService.price,
          duration: populatedService.duration,
          description: populatedService.description,
          therapists: populatedService.therapists || [],
          createdAt: populatedService.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating service:', error);
    
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