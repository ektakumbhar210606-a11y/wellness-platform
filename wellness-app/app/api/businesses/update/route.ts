import { NextRequest, NextResponse } from 'next/server';

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
    const userId = decoded.id;

    // Connect to database
    const dbModule = await import('@/lib/db');
    await dbModule.connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { business_name, description, address, opening_time, closing_time, businessHours, status, phone, email, website } = body;

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
    const updateData: any = {};

    if (business_name) updateData.name = business_name.trim();
    if (description !== undefined) updateData.description = description;
    if (address) updateData.address = address;
    if (opening_time) updateData.openingTime = opening_time;
    if (closing_time) updateData.closingTime = closing_time;
    if (status) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;

    // Convert businessHours array to the expected object format
    if (businessHours) {
      let formattedBusinessHours: any = {};
      if (Array.isArray(businessHours) && businessHours.length > 0) {
        businessHours.forEach((hour: any) => {
          const day = hour.day.charAt(0).toUpperCase() + hour.day.slice(1); // Capitalize day
          formattedBusinessHours[day] = {
            open: hour.openingTime,
            close: hour.closingTime,
            closed: false
          };
        });
      }
      updateData.businessHours = formattedBusinessHours;
    }

    // Update the business document
    const updatedBusiness = await Business.findOneAndUpdate(
      { owner: userId },
      { ...updateData },
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
      phone: updatedBusiness.phone,
      email: updatedBusiness.email,
      website: updatedBusiness.website,
      address: updatedBusiness.address,
      openingTime: updatedBusiness.openingTime,
      closingTime: updatedBusiness.closingTime,
      businessHours: updatedBusiness.businessHours,
      status: updatedBusiness.status,
      createdAt: updatedBusiness.createdAt,
      updatedAt: updatedBusiness.updatedAt
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating business:', error);

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

    // Handle different types of errors appropriately
    if (error.name === 'CastError') {
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