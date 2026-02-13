import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import Business from '../../../../models/Business';
import User from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

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

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (verificationError: unknown) {
      // Handle different types of JWT errors
      if (verificationError instanceof Error) {
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
        }
      }
      return NextResponse.json(
        { error: 'Authentication failed. Invalid token.' },
        { status: 401 }
      );
    }

    // Extract user information from the decoded token
    const userId = (decoded as JwtPayload).id;

    // For onboarding purposes, allow users to create a business regardless of initial role
    // The user role will be updated after successful business creation
    // Check if the user already has a business to prevent duplicates
    // This also serves as a way to identify if onboarding is already complete

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { business_name, description, service_type, service_name, address, opening_time, closing_time, businessHours, status, phone, email, currency } = body;

    // Validate required fields
    if (!business_name || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name and address are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof business_name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid data type: business_name must be a string' },
        { status: 400 }
      );
    }

    // Import Business model
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Check if a business with the same owner already exists
    const existingBusiness = await Business.findOne({ owner: userId });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'A business already exists for this owner. Each owner can only have one business.' },
        { status: 409 }
      );
    }

    // Convert businessHours array to the expected object format
    const formattedBusinessHours: Record<string, { open?: string; close?: string; closed: boolean }> = {};
    if (Array.isArray(businessHours) && businessHours.length > 0) {
      businessHours.forEach((hour: {day: string; openingTime: string; closingTime: string; closed: boolean}) => {
        const day = hour.day.charAt(0).toUpperCase() + hour.day.slice(1); // Capitalize day
        formattedBusinessHours[day] = {
          open: hour.openingTime,
          close: hour.closingTime,
          closed: hour.closed || false
        };
      });
    }

    // Create and save the new business document
    const newBusiness = new Business({
      owner: userId,
      name: business_name.trim(),
      description: description || '', // Use description if provided
      serviceType: service_type || 'massage', // Default to massage if not provided
      serviceName: service_name || '', // Use service name if provided
      phone: phone || '',
      email: email || '',
      address: address, // Assuming address is an object with street, city, state, zipCode, country
      openingTime: opening_time || '09:00',
      closingTime: closing_time || '17:00',
      businessHours: formattedBusinessHours, // Store the formatted business hours
      status: status || 'active', // Default to active status
      currency: currency || (address.country === 'India' ? 'INR' : 'USD') // Set currency based on country, default to USD
    });

    const savedBusiness = await newBusiness.save();
    
    // Update user role to Business after successful business creation
    const userModule = await import('@/models/User');
    const User = userModule.default;
    await User.findByIdAndUpdate(userId, { role: 'Business' });

    // Return the created business document (excluding sensitive information)
    return NextResponse.json(
      {
        id: savedBusiness._id,
        owner: savedBusiness.owner,
        name: savedBusiness.name,
        serviceType: savedBusiness.serviceType,
        serviceName: savedBusiness.serviceName,
        address: savedBusiness.address,
        openingTime: savedBusiness.openingTime,
        closingTime: savedBusiness.closingTime,
        status: savedBusiness.status,
        createdAt: savedBusiness.createdAt,
        updatedAt: savedBusiness.updatedAt
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating business:', error);

    // Import Business model to check for validation errors
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Handle validation errors from Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      const messages: Record<string, string> = {};
      for (const field in (error as any).errors) {
        messages[field] = (error as any).errors[field].message;
      }
      return NextResponse.json(
        { error: 'Validation error', details: messages },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'A business with this owner already exists' },
        { status: 409 }
      );
    }

    // Handle different types of errors appropriately
    if (error instanceof Error && error.name === 'CastError') {
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