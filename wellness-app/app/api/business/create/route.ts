import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import Business from '../../../../models/Business';
import User from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

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
    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as JwtPayload;
    } catch (verificationError: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
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

    // Check if the user has the 'Business' or 'business' role
    if (user.role.toLowerCase() !== 'business') {
      return NextResponse.json(
        { error: 'Only users with Business role can create business profiles' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, serviceType, address, openingTime, closingTime, businessHours } = body;

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

    // Prepare business hours
    const constFormattedBusinessHours: Record<string, { open?: string; close?: string; closed: boolean }> = {};
    if (businessHours) {
        Object.keys(businessHours).forEach(day => {
            const dayData = businessHours[day];
            constFormattedBusinessHours[day] = {
                open: dayData.open,
                close: dayData.close,
                closed: dayData.closed || false
            };
        });
    }

    // Create new business profile
    const newBusiness = new Business({
      owner: user._id,
      name,
      description,
      serviceType,
      address,
      openingTime,
      closingTime,
      businessHours: Object.keys(constFormattedBusinessHours).length > 0 ? constFormattedBusinessHours : undefined,
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
          description: savedBusiness.description,
          serviceType: savedBusiness.serviceType,
          address: savedBusiness.address,
          openingTime: savedBusiness.openingTime,
          closingTime: savedBusiness.closingTime,
          businessHours: savedBusiness.businessHours,
          status: savedBusiness.status,
          createdAt: savedBusiness.createdAt,
          updatedAt: savedBusiness.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Business creation error:', error);

    // Handle specific Mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as unknown as { errors: Record<string, { message: string }> }).errors).map(
        (err: { message: string }) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key error (MongoDB error)
    if (error instanceof Error && (error as { code?: number }).code === 11000) {
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