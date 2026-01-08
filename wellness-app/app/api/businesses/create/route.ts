import { NextRequest, NextResponse } from 'next/server';

/**
 * POST endpoint to create a new business
 * Protected by authentication and role-based authorization
 */
export async function POST(request: NextRequest) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('Authorization');

    // Check if authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access denied. No valid token provided.' },
        { status: 401 }
      );
    }

    // Extract the token from the header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Import jsonwebtoken dynamically and verify the token using the JWT secret
    const jwt = (await import('jsonwebtoken')).default;

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (verificationError: any) {
      // Handle different types of JWT errors
      if (verificationError.name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Token has expired. Please log in again.' },
          { status: 401 }
        );
      } else if (verificationError.name === 'JsonWebTokenError') {
        return NextResponse.json(
          { error: 'Invalid token. Access denied.' },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          { error: 'Authentication failed. Invalid token.' },
          { status: 401 }
        );
      }
    }

    // Extract user information from the decoded token
    const userId = decoded.userId;
    const userRole = decoded.role;

    // Check if the user has the 'Business' role
    if (userRole !== 'Business') {
      return NextResponse.json(
        { error: 'Access denied. Only business owners can create businesses.' },
        { status: 403 }
      );
    }

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { business_name, address, opening_time, closing_time } = body;

    // Validate required fields
    if (!business_name || !address || !opening_time || !closing_time) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, address, opening_time, closing_time are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof business_name !== 'string' || typeof opening_time !== 'string' || typeof closing_time !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data types: business_name, opening_time, and closing_time must be strings' },
        { status: 400 }
      );
    }

    // Import Business model
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;
    const { UserRole } = await import('@/models/User');

    // Check if a business with the same owner already exists
    const existingBusiness = await Business.findOne({ owner: userId });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'A business already exists for this owner. Each owner can only have one business.' },
        { status: 409 }
      );
    }

    // Create and save the new business document
    const newBusiness = new Business({
      owner: userId,
      name: business_name.trim(),
      address: address, // Assuming address is an object with street, city, state, zipCode, country
      openingTime: opening_time,
      closingTime: closing_time,
      status: 'active' // Default to active status
    });

    const savedBusiness = await newBusiness.save();

    // Return the created business document (excluding sensitive information)
    return NextResponse.json(
      {
        id: savedBusiness._id,
        owner: savedBusiness.owner,
        name: savedBusiness.name,
        address: savedBusiness.address,
        openingTime: savedBusiness.openingTime,
        closingTime: savedBusiness.closingTime,
        status: savedBusiness.status,
        createdAt: savedBusiness.createdAt,
        updatedAt: savedBusiness.updatedAt
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating business:', error);

    // Import Business model to check for validation errors
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages: Record<string, string> = {};
      for (const field in error.errors) {
        messages[field] = error.errors[field].message;
      }
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A business with this owner already exists' },
        { status: 409 }
      );
    }

    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
      // Invalid user ID format
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}