import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import Business from '../../../../models/Business';
import User from '../../../../models/User';

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

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
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
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user has the 'Business' role
    if (user.role !== 'Business') {
      return NextResponse.json(
        { error: 'Only users with Business role can create business profiles' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, address, openingTime, closingTime } = body;

    // Validate required fields
    if (!name || !address || !openingTime || !closingTime) {
      return NextResponse.json(
        { error: 'Business name, address, opening time, and closing time are required' },
        { status: 400 }
      );
    }

    // Validate address fields
    if (
      !address.street || 
      !address.city || 
      !address.state || 
      !address.zipCode || 
      !address.country
    ) {
      return NextResponse.json(
        { error: 'Address must include street, city, state, zipCode, and country' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeFormatRegex.test(openingTime) || !timeFormatRegex.test(closingTime)) {
      return NextResponse.json(
        { error: 'Opening time and closing time must be in HH:MM format (24-hour)' },
        { status: 400 }
      );
    }

    // Check if a business with the same name already exists
    const existingBusiness = await Business.findOne({ name });
    if (existingBusiness) {
      return NextResponse.json(
        { error: 'A business with this name already exists' },
        { status: 409 }
      );
    }

    // Create new business profile
    const newBusiness = new Business({
      owner: user._id,
      name,
      address,
      openingTime,
      closingTime,
      status: 'active' // Default status
    });

    // Save the business to the database
    const savedBusiness = await newBusiness.save();

    // Return success response
    return NextResponse.json(
      {
        message: 'Business profile created successfully',
        business: {
          id: savedBusiness._id,
          owner: savedBusiness.owner,
          name: savedBusiness.name,
          address: savedBusiness.address,
          openingTime: savedBusiness.openingTime,
          closingTime: savedBusiness.closingTime,
          status: savedBusiness.status,
          createdAt: savedBusiness.createdAt,
          updatedAt: savedBusiness.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Business creation error:', error);

    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key error (MongoDB error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A business with this name already exists' },
        { status: 409 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}