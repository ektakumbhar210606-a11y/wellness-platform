import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { IBusiness } from '../../../../models/Business'; // Added for updateData type

/**
 * PUT endpoint to update an existing business
 * Protected by authentication
 */
export async function PUT(request: NextRequest) {
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

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { business_name, description, service_type, service_name, address, opening_time, closing_time, businessHours, status, phone, email, website, currency } = body;

    // Import Business model
    const businessModule = await import('@/models/Business');
    const Business = businessModule.default;

    // Find the business owned by this user
    const business = await Business.findOne({ owner: userId });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    // Prepare update object with only provided fields
    const updateData: Partial<IBusiness> = {};

    if (business_name) updateData.name = business_name.trim();
    if (description !== undefined) updateData.description = description;
    if (service_type !== undefined) updateData.serviceType = service_type;
    if (service_name !== undefined) updateData.serviceName = service_name;
    if (address) updateData.address = address;
    if (opening_time) updateData.openingTime = opening_time;
    if (closing_time) updateData.closingTime = closing_time;
    if (status) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (currency !== undefined) updateData.currency = currency;

    // Convert businessHours array to the expected object format
    if (businessHours) {
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
      updateData.businessHours = formattedBusinessHours;
    }

    // Update the business document
    const updatedBusiness = await Business.findOneAndUpdate(
      { owner: userId },
      { $set: updateData }, // Use $set to update only provided fields
      { new: true, runValidators: true } // Return updated document and run validations
    );

    if (!updatedBusiness) {
      return NextResponse.json(
        { error: 'Failed to update business' },
        { status: 500 }
      );
    }

    // Return the updated business document (excluding sensitive information)
    return NextResponse.json({
      id: updatedBusiness._id,
      owner: updatedBusiness.owner,
      name: updatedBusiness.name,
      description: updatedBusiness.description,
      serviceType: updatedBusiness.serviceType,
      serviceName: updatedBusiness.serviceName,
      phone: updatedBusiness.phone,
      email: updatedBusiness.email,
      website: updatedBusiness.website,
      address: updatedBusiness.address,
      openingTime: updatedBusiness.openingTime,
      closingTime: updatedBusiness.closingTime,
      businessHours: updatedBusiness.businessHours,
      status: updatedBusiness.status,
      currency: updatedBusiness.currency,
      createdAt: updatedBusiness.createdAt,
      updatedAt: updatedBusiness.updatedAt
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating business:', error);

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

    // Handle different types of errors appropriately
    if (error instanceof Error && (error as any).name === 'CastError') {
      // Invalid user ID format
      return NextResponse.json(
        { error: 'Invalid ID format' },
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