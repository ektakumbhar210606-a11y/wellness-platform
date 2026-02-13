import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BusinessModel from '@/models/Business';
import ServiceModel from '@/models/Service';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/User';
import { calculateTimeSlots } from '@/app/utils/slotCalculator';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize customer
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');

    if (!businessId) {
      return Response.json(
        { success: false, error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!serviceId) {
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Fetch business details to get working hours
    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return Response.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Fetch service details to get duration
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get business working hours (assuming they're stored in a businessHours field)
    // If businessHours is not available, we'll use default hours
    let businessStartTime = "09:00"; // Default start time
    let businessEndTime = "18:00";   // Default end time
    
    if (business.businessHours && Object.keys(business.businessHours).length > 0) {
      // Assuming we're getting the current day's hours
      const dayOfWeek = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      const dayHours = (business.businessHours as Record<string, any>)[dayOfWeek]; // Cast to any to access properties dynamically
      
      if (dayHours && dayHours.open && dayHours.close) {
        businessStartTime = dayHours.open;
        businessEndTime = dayHours.close;
      }
    } else if (business.openingTime && business.closingTime) {
      // Fallback to old fields if businessHours is not available
      businessStartTime = business.openingTime;
      businessEndTime = business.closingTime;
    }

    // Get service duration in minutes
    const serviceDuration = service.duration || 60; // Default to 60 minutes if not specified

    // Fixed break duration
    const breakDuration = 15; // 15 minutes

    // Generate time slots using the utility function
    const timeSlots = calculateTimeSlots(
      businessStartTime,
      businessEndTime,
      serviceDuration,
      breakDuration
    );

    return Response.json({
      success: true,
      data: timeSlots
    });

  } catch (error: unknown) {
    console.error('Error generating booking slots:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to authenticate and authorize customer users
 */
async function requireCustomerAuth(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return {
        authenticated: false,
        error: 'Authentication token required',
        status: 401
      };
    }

    // Verify token
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (verificationError: unknown) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Get user from database
    const user = await UserModel.findById((decoded as jwt.JwtPayload).id);
    if (!user) {
      return {
        authenticated: false,
        error: 'User not found',
        status: 404
      };
    }

    // Check user role - allow both 'Customer' and 'customer' for backward compatibility
    const userRole = user.role.toLowerCase();
    if (userRole !== 'customer') {
      return {
        authenticated: false,
        error: 'Access denied. Customer account required.',
        status: 403
      };
    }

    return {
      authenticated: true,
      user: user
    };
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

