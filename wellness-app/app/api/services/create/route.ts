import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ServiceModel, { IService } from '@/models/Service';
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
<<<<<<< HEAD
    const { name, price, duration, description, category, images, therapists } = body;
=======
    const { name, price, duration, description, category, images, teamMembers, therapists } = body;
>>>>>>> 6f4583a58e916cd58870586ef9a22dc9a9e57a53

    // Validate required fields
    if (!name || !price || !duration || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, duration, and description are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof name !== 'string' || typeof description !== 'string' || 
        typeof price !== 'number' || typeof duration !== 'number' ||
        (category && typeof category !== 'string') ||
        (therapists && !Array.isArray(therapists))) {
      return NextResponse.json(
        { error: 'Invalid data types: name, description, and category must be strings; price and duration must be numbers; therapists must be an array' },
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

    // Create new service
    const newService = new ServiceModel({
      business: business._id,
      name,
      price,
      duration,
      description,
      category: category || undefined, // Optional field
<<<<<<< HEAD
      therapists: therapists || [] // Optional field
=======
      therapists: therapists || [], // Assign therapists if provided
>>>>>>> 6f4583a58e916cd58870586ef9a22dc9a9e57a53
    });

    const createdService = await newService.save();

    return NextResponse.json(
      { 
        message: 'Service created successfully', 
        service: {
          id: createdService._id.toString(),
          name: createdService.name,
          price: createdService.price,
          duration: createdService.duration,
          description: createdService.description,
          category: createdService.category,
          therapists: createdService.therapists || [],
          createdAt: createdService.createdAt,
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