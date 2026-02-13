/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel, { BookingStatus } from '@/models/Booking';
import BusinessModel from '@/models/Business';
import TherapistModel, { IBusinessAssociation, ITherapist } from '@/models/Therapist';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
import UserModel, { IUser } from '@/models/User';
import ServiceModel, { IService } from '@/models/Service';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

async function requireBusinessAuth(request: NextRequest) {
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
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError: unknown) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Check user role - allow both 'Business' and 'business' for backward compatibility
    if (decoded.role.toLowerCase() !== 'business') {
      return {
        authenticated: false,
        error: 'Access denied. Business role required',
        status: 403
      };
    }

    // Get user to verify existence
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return {
        authenticated: false,
        error: 'User not found',
        status: 404
      };
    }

    return {
      authenticated: true,
      user: decoded
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: error.message || 'Internal server error',
      status: 500
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate and authorize business user
    const authResult = await requireBusinessAuth(req);
    if (!authResult.authenticated) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const decoded = authResult.user;
    if (!decoded) {
      return Response.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { bookingId, therapistId } = body;

    // Validate input
    if (!bookingId || !therapistId) {
      return Response.json(
        { success: false, error: 'Booking ID and Therapist ID are required' },
        { status: 400 }
      );
    }
    
    // Validate ObjectId format
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
    
    if (!isValidObjectId(bookingId) || !isValidObjectId(therapistId)) {
      return Response.json(
        { success: false, error: 'Invalid booking ID or therapist ID format' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Verify booking exists and belongs to this business (indirectly through associated services)
    const booking = await BookingModel.findById(bookingId)
      .populate('service')
      .populate('therapist');

    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify therapist exists and is associated with this business
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Check if therapist is associated with the business
    const isTherapistAssociated = therapist.associatedBusinesses?.some(
      (assoc: IBusinessAssociation) => 
        assoc.businessId.toString() === business._id.toString() && 
        assoc.status === 'approved'
    );

    if (!isTherapistAssociated) {
      return Response.json(
        { success: false, error: 'Therapist is not approved for this business' },
        { status: 400 }
      );
    }

    // Update booking to assign to the therapist
    console.log('Assigning booking:', {
      bookingId,
      therapistId,
      businessId: business._id,
      adminId: decoded.id
    });
    
    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { 
        therapist: therapistId,
        status: BookingStatus.Pending, // Reset status to pending for therapist approval
        assignedByAdmin: true, // Mark as assigned by admin
        assignedById: decoded.id, // Store the admin ID who assigned the booking
        therapistResponded: false, // Therapist has not responded yet
        notificationDestination: 'business' // Set notification destination to business for assigned bookings
      },
      { new: true, runValidators: true }
    ).populate('customer service therapist');
    
    console.log('Updated booking result:', {
      id: updatedBooking._id,
      therapist: updatedBooking.therapist,
      assignedByAdmin: updatedBooking.assignedByAdmin,
      assignedById: updatedBooking.assignedById,
      status: updatedBooking.status
    });

    if (!updatedBooking) {
      return Response.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Update the corresponding availability slot to mark it as "Booked"
    // Check if there's a corresponding availability slot to update
    const slotDate = new Date(updatedBooking.date);
    const availabilitySlot = await TherapistAvailabilityModel.findOne({
      therapist: therapistId,
      date: {
        $gte: new Date(slotDate.setHours(0, 0, 0, 0)), // Start of the day
        $lt: new Date(slotDate.setHours(23, 59, 59, 999)) // End of the day
      },
      startTime: { $lte: updatedBooking.time }, // Slot starts at or before the requested time
      endTime: { $gt: updatedBooking.time },    // Slot ends after the requested time
      status: TherapistAvailabilityStatus.Available // Slot must be available
    });

    if (availabilitySlot) {
      availabilitySlot.status = TherapistAvailabilityStatus.Booked;
      await availabilitySlot.save();
    }

    // Return success response with updated booking details
    return Response.json({
      success: true,
      message: 'Booking assigned to therapist successfully',
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as IUser)._id.toString(),
          firstName: (updatedBooking.customer as IUser).firstName,
          lastName: (updatedBooking.customer as IUser).lastName,
          email: (updatedBooking.customer as IUser).email,
          phone: (updatedBooking.customer as IUser).phone
        },
        service: {
          id: (updatedBooking.service as IService)._id.toString(),
          name: (updatedBooking.service as IService).name,
          price: (updatedBooking.service as IService).price,
          duration: (updatedBooking.service as IService).duration,
          description: (updatedBooking.service as IService).description
        },
        therapist: {
          id: (updatedBooking.therapist as ITherapist)._id.toString(),
          fullName: (updatedBooking.therapist as ITherapist).fullName,
          professionalTitle: (updatedBooking.therapist as ITherapist).professionalTitle
        },
        date: updatedBooking.date,
        time: updatedBooking.time,
        status: updatedBooking.status,
        createdAt: updatedBooking.createdAt
      }
    });

  } catch (error: unknown) {
    console.error('Error assigning booking to therapist:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}