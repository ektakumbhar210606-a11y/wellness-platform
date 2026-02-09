import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BusinessModel from '@/models/Business';
import ServiceModel from '@/models/Service';
import TherapistModel from '@/models/Therapist';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/User';
import { generateSlots } from '@/app/utils/generateSlots';
import { checkTherapistAvailability } from '@/app/utils/checkTherapistAvailability';
import BookingModel, { BookingStatus } from '@/models/Booking';

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
    const therapistId = searchParams.get('therapistId');
    const dateString = searchParams.get('date');

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

    if (!therapistId) {
      return Response.json(
        { success: false, error: 'Therapist ID is required' },
        { status: 400 }
      );
    }

    if (!dateString) {
      return Response.json(
        { success: false, error: 'Date is required' },
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

    // Fetch therapist details to get weekly availability
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Parse the date string to a JavaScript Date object
    const selectedDate = new Date(dateString);

    // Get business working hours
    let businessOpenTime = "09:00"; // Default start time
    let businessCloseTime = "18:00";   // Default end time
    
    if (business.businessHours && Object.keys(business.businessHours).length > 0) {
      // Get the day of the week from the selected date
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = daysOfWeek[selectedDate.getDay()];
      
      const dayHours = business.businessHours[dayOfWeek];
      
      if (dayHours && dayHours.open && dayHours.close) {
        businessOpenTime = dayHours.open;
        businessCloseTime = dayHours.close;
      }
    } else if (business.openingTime && business.closingTime) {
      // Fallback to old fields if businessHours is not available
      businessOpenTime = business.openingTime;
      businessCloseTime = business.closingTime;
    }

    // Get service duration in minutes
    const serviceDuration = service.duration || 60; // Default to 60 minutes if not specified

    // Generate slots using the utility function
    const rawSlots = generateSlots(
      businessOpenTime,
      businessCloseTime,
      serviceDuration,
      15 // 15-minute breaks
    );

    // Check availability for each slot using the therapist availability checker
    const slotsWithAvailability = rawSlots.map(async (slot) => {
      const isAvailableFromTherapist = checkTherapistAvailability(
        slot.startTime,
        slot.endTime,
        therapist.weeklyAvailability,
        selectedDate
      );
      
      // Check if there's already a pending or confirmed booking for this slot
      const conflictingBooking = await BookingModel.findOne({
        therapist: therapistId,
        date: {
          $gte: new Date(selectedDate.setHours(0, 0, 0, 0)), // Start of the day
          $lt: new Date(selectedDate.setHours(23, 59, 59, 999)) // End of the day
        },
        time: slot.startTime,
        $or: [
          { status: BookingStatus.Pending },
          { status: BookingStatus.Confirmed },
          { status: BookingStatus.Rescheduled }
        ]
      });
      
      // A slot is truly available if it's available in therapist's schedule AND no conflicting booking exists
      const isAvailable = isAvailableFromTherapist && !conflictingBooking;
      
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable,
        status: conflictingBooking ? conflictingBooking.status : 'available'
      };
    });
    
    // Wait for all slot availability checks to complete
    const resolvedSlots = await Promise.all(slotsWithAvailability);

    return Response.json({
      success: true,
      data: resolvedSlots
    });

  } catch (error: any) {
    console.error('Error fetching available booking slots:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (err) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Get user from database
    const user = await UserModel.findById(decoded.id);
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
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}