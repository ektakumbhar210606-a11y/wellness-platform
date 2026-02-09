import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import BusinessModel from '../../../../models/Business';
import ServiceModel from '../../../../models/Service';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { cancelExpiredBookings } from '@/utils/cancelExpiredBookings';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
import NotificationService from '@/app/utils/notifications';
import { formatBookingId } from '@/utils/bookingIdFormatter';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize business users
 */
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
    } catch (err) {
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

export async function GET(req: NextRequest) {
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

    await connectToDatabase();

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Automatically cancel expired bookings before fetching current bookings
    // This ensures the business sees up-to-date booking statuses
    try {
      const cancellationResult = await cancelExpiredBookings();
      if (cancellationResult.cancelledCount > 0) {
        console.log(`Automatically cancelled ${cancellationResult.cancelledCount} expired bookings for business`);
      }
    } catch (error) {
      console.error('Error during automatic cancellation:', error);
      // Continue with the request even if automatic cancellation fails
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const includeAssigned = searchParams.get('includeAssigned') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // First get all services for this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map((service: any) => service._id);
    
    // Build query for bookings of these services
    // This ensures we get all bookings related to services offered by this business
    let query: any = { service: { $in: serviceIds } };
    
    // Add status filter if provided
    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      query.status = status;
    }
    
    // For default view (no status specified), query for both pending and rescheduled bookings
    // This ensures businesses can track all pending requests and rescheduled bookings
    // Both assigned and unassigned bookings should appear for proper business tracking
    if (status === 'pending' || (!status && !query.status)) {
      query.status = { $in: ['pending', 'rescheduled'] }; // Include both pending and rescheduled bookings
      console.log('Querying for all pending and rescheduled bookings (both assigned and unassigned)');
    }
    
    // Explicitly ensure that the query includes both assigned and unassigned bookings
    // This is critical to ensure assigned bookings remain visible in the business dashboard
    console.log(`Query constructed: ${JSON.stringify(query)}`);
    
    // Ensure that assigned bookings are included in the results
    // Both assignedByAdmin=true and assignedByAdmin=false bookings should appear
    // This is important because assigned bookings should remain visible to businesses
    console.log('Query will include all bookings for services belonging to this business, regardless of assignment status');
    
    // Log the final query to ensure it's correct
    console.log('Final query for business bookings:', JSON.stringify(query, null, 2));

    // Log the exact query being executed to ensure it's correct
    console.log('Executing query for bookings:', JSON.stringify(query, null, 2));
    
    // Enhanced query to ensure all relevant bookings are retrieved
    // This includes both assigned and unassigned bookings for the business's services
    console.log('Fetching bookings with query:', JSON.stringify(query, null, 2));
    
    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
      .populate({
        path: 'customer',
        select: 'name email phone'
      })
      .populate({
        path: 'service',
        select: 'name price duration description business'
      })
      .populate({
        path: 'therapist',
        select: 'fullName professionalTitle'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    // Additional verification: Make sure we're getting all expected bookings
    // If we're looking for pending bookings, also check if there are any assigned bookings that might be missed
    if (query.status === 'pending') {
      // Get count of all pending bookings for this business to make sure our query is accurate
      const totalCount = await BookingModel.countDocuments({
        service: { $in: serviceIds },
        status: 'pending'
      });
      
      console.log(`Expected up to ${limit} pending bookings (page ${page}), found ${bookings.length}, total available: ${totalCount}`);
      
      if (bookings.length < totalCount) {
        console.log(`Note: Pagination limiting results to ${limit} per page. Total pending bookings: ${totalCount}`);
      }
    }
      
    // DEBUG: Additional check to ensure assigned bookings are included
    // If we're querying for pending bookings, explicitly check for any missing assigned bookings
    if (query.status === 'pending') {
      // Find any pending bookings for this business's services that might have been missed
      const allPendingBookingsForBusiness = await BookingModel.find({
        service: { $in: serviceIds },
        status: 'pending'
      }).countDocuments();
      
      const allAssignedBookingsForBusiness = await BookingModel.find({
        service: { $in: serviceIds },
        status: 'pending',
        assignedByAdmin: true
      }).countDocuments();
      
      console.log(`DEBUG: Total pending bookings for business services: ${allPendingBookingsForBusiness}`);
      console.log(`DEBUG: Total assigned pending bookings for business services: ${allAssignedBookingsForBusiness}`);
      console.log(`DEBUG: Actually retrieved bookings: ${bookings.length}`);
    }

    console.log(`Business bookings API - Query:`, JSON.stringify(query, null, 2));
    console.log(`Found ${bookings.length} bookings`);
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.service?.name} - ${booking.customer?.name} - Status: ${booking.status} - Assigned: ${booking.assignedByAdmin} - Therapist: ${booking.therapist?.fullName || 'None'}`);
    });
    
    // Add explicit check for assigned bookings in the results
    const assignedBookings = bookings.filter(b => b.assignedByAdmin);
    const unassignedBookings = bookings.filter(b => !b.assignedByAdmin);
    console.log(`Breakdown: ${assignedBookings.length} assigned, ${unassignedBookings.length} unassigned`);

    // For each booking, if customer doesn't have phone, try to get from associated Customer profile
    for (const booking of bookings) {
      if (!booking.customer.phone) {
        // Import Customer model here
        const CustomerModel = (await import('@/models/Customer')).default;
        const customerProfile = await CustomerModel.findOne({ user: booking.customer._id }).select('phoneNumber');
        if (customerProfile && customerProfile.phoneNumber) {
          (booking.customer as any).phone = customerProfile.phoneNumber;
        }
      }
    }

    // Manually populate business data for each service to include currency information
    for (const booking of bookings) {
      if (booking.service && (booking.service as any).business) {
        try {
          const BusinessModel = (await import('@/models/Business')).default;
          const business = await BusinessModel.findById((booking.service as any).business)
            .select('name address currency')
            .lean();
          
          if (business) {
            (booking.service as any).business = {
              id: business._id.toString(),
              name: business.name,
              address: business.address,
              currency: business.currency
            };
          } else {
            (booking.service as any).business = null;
          }
        } catch (error) {
          console.error('Error populating business data for booking:', booking._id, error);
          (booking.service as any).business = null;
        }
      }
    }

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);
    
    // Log additional info about what we're retrieving
    console.log(`Retrieved ${bookings.length} bookings out of ${total} total matching records`);
    console.log(`Page: ${page}, Limit: ${limit}, Skip: ${(page - 1) * limit}`);

    // Format the bookings for the response
    // For business dashboard, show the original request information for communication with customers
    // but also provide current state information for context
    const formattedBookings = bookings.map(booking => ({
      id: booking._id.toString(),
      displayId: formatBookingId(booking._id.toString()),
      customer: {
        id: (booking.customer as any)._id.toString(),
        name: (booking.customer as any).name,
        email: (booking.customer as any).email,
        phone: (booking.customer as any).phone,
        firstName: (booking.customer as any).name.split(' ')[0] || (booking.customer as any).name,
        lastName: (booking.customer as any).name.split(' ').slice(1).join(' ') || ''
      },
      service: {
        id: (booking.service as any)._id.toString(),
        name: (booking.service as any).name,
        price: (booking.service as any).price,
        duration: (booking.service as any).duration,
        description: (booking.service as any).description
      },
      therapist: {
        id: (booking.therapist as any)._id.toString(),
        fullName: (booking.therapist as any).fullName,
        professionalTitle: (booking.therapist as any).professionalTitle
      },
      // Show original request date/time for business communication with customers
      date: booking.originalDate ? booking.originalDate : booking.date,
      time: booking.originalTime ? booking.originalTime : booking.time,
      // Current date/time for reference (in case of rescheduling)
      currentDate: booking.date,
      currentTime: booking.time,
      duration: booking.duration || (booking.service as any).duration,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      originalDate: booking.originalDate ? new Date(booking.originalDate) : null,
      originalTime: booking.originalTime || null,
      // Flag to indicate if this booking has been rescheduled
      hasBeenRescheduled: !!booking.originalDate || !!booking.originalTime
    }));

    return Response.json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: formattedBookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching business bookings:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const { bookingId, status, notes } = body;

    // Validate required fields
    if (!bookingId || !status) {
      return Response.json(
        { success: false, error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['confirmed', 'cancelled'].includes(status)) {
      return Response.json(
        { success: false, error: 'Status must be either confirmed or cancelled' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(bookingId)) {
      return Response.json(
        { success: false, error: 'Invalid booking ID format' },
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

    // Find the booking
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if the booking belongs to a service of this business
    const service = await ServiceModel.findById(booking.service);
    if (!service || service.business.toString() !== business._id.toString()) {
      return Response.json(
        { success: false, error: 'Booking does not belong to your business' },
        { status: 403 }
      );
    }



    // Check if booking can be updated (only pending bookings can be confirmed/cancelled)
    if (booking.status !== 'pending') {
      return Response.json(
        { success: false, error: 'Only pending bookings can be confirmed or cancelled' },
        { status: 400 }
      );
    }

    // Update booking status
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Track who performed the action and when
    if (status === 'confirmed') {
      updateData.confirmedBy = decoded.id;
      updateData.confirmedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledBy = decoded.id;
      updateData.cancelledAt = new Date();
    }
    
    // Mark that therapist has responded (business confirming or cancelling the booking)
    updateData.therapistResponded = true;
    
    // For rescheduled bookings, ensure we preserve the original date/time information
    // This maintains the distinction between the original customer request and current state
    if (booking.originalDate || booking.originalTime) {
      // This is a rescheduled booking, preserve original information
      updateData.notificationDestination = 'customer'; // Business actions on rescheduled bookings go to customers
    } else {
      // This is an original request, business actions go to customers by default
      updateData.notificationDestination = 'customer';
    }

    const updatedBooking = await BookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true }
    )
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .populate({
      path: 'service',
      select: 'name price duration description'
    })
    .populate({
      path: 'therapist',
      select: 'fullName professionalTitle'
    });

    // Release the slot by updating the therapist's availability back to available if booking was cancelled
    if (status === 'cancelled' && updatedBooking) {
      const slotDate = new Date(booking.date);
      const availabilitySlot = await TherapistAvailabilityModel.findOne({
        therapist: booking.therapist,
        date: {
          $gte: new Date(slotDate.setHours(0, 0, 0, 0)), // Start of the day
          $lt: new Date(slotDate.setHours(23, 59, 59, 999)) // End of the day
        },
        startTime: { $lte: booking.time }, // Slot starts at or before the requested time
        endTime: { $gt: booking.time },    // Slot ends after the requested time
      });

      if (availabilitySlot) {
        // Update the availability slot back to available
        availabilitySlot.status = TherapistAvailabilityStatus.Available;
        await availabilitySlot.save();
      }
    }
    
    // Split the full name into first and last name
    let firstName = '';
    let lastName = '';
    if (updatedBooking && updatedBooking.customer && (updatedBooking.customer as any).name) {
      const nameParts = (updatedBooking.customer as any).name.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Handle phone number - try to get from Customer model if not in User model
    let phoneNumber = (updatedBooking!.customer as any).phone;
    if (!phoneNumber) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: (updatedBooking!.customer as any)._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }
    
    // If customer doesn't have phone, try to get from associated Customer profile
    if (updatedBooking && !phoneNumber) {
      const CustomerModel = (await import('@/models/Customer')).default;
      const customerProfile = await CustomerModel.findOne({ user: updatedBooking.customer._id }).select('phoneNumber');
      if (customerProfile && customerProfile.phoneNumber) {
        phoneNumber = customerProfile.phoneNumber;
      }
    }
    
    // Send notification based on notification destination
    try {
      const notificationService = new NotificationService();
      const action = status === 'confirmed' ? 'confirm' : 'cancel';
      await notificationService.sendBookingNotification(bookingId, action);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with response even if notification fails
    }
    
    return Response.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: {
        id: updatedBooking._id.toString(),
        customer: {
          id: (updatedBooking.customer as any)._id.toString(),
          name: (updatedBooking.customer as any).name,
          email: (updatedBooking.customer as any).email,
          phone: phoneNumber,
          firstName: firstName,
          lastName: lastName
        },
        service: {
          id: (updatedBooking.service as any)._id.toString(),
          name: (updatedBooking.service as any).name,
          price: (updatedBooking.service as any).price,
          duration: (updatedBooking.service as any).duration,
          description: (updatedBooking.service as any).description
        },
        therapist: {
          id: (updatedBooking.therapist as any)._id.toString(),
          fullName: (updatedBooking.therapist as any).fullName,
          professionalTitle: (updatedBooking.therapist as any).professionalTitle
        },
        date: updatedBooking.date,
        time: updatedBooking.time,
        duration: updatedBooking.duration || (updatedBooking.service as any).duration,
        originalDate: updatedBooking.originalDate ? new Date(updatedBooking.originalDate) : null,
        originalTime: updatedBooking.originalTime || null,
        status: updatedBooking.status,
        notes: updatedBooking.notes,
        createdAt: updatedBooking.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error updating booking:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}