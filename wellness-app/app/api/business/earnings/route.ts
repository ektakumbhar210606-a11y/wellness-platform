import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import BookingModel from '../../../../models/Booking';
import ServiceModel from '../../../../models/Service';
import UserModel from '../../../../models/User';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import BusinessModel from '../../../../models/Business';
import { formatCurrency } from '@/utils/currencyFormatter';

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
    } catch (verificationError: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const paymentType = searchParams.get('type'); // 'half' or 'full'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate payment type parameter
    if (!paymentType || !['half', 'full'].includes(paymentType)) {
      return Response.json(
        { success: false, error: 'Invalid payment type. Must be "half" or "full"' },
        { status: 400 }
      );
    }

    // First get all services for this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map((service) => service._id);

    // Build query based on payment type
    let query: any = { 
      service: { $in: serviceIds },
      paymentStatus: paymentType === 'half' ? 'partial' : 'paid'
    };

    // For full payment bookings, we want to include both confirmed and completed bookings
    // since full payment can occur at confirmation time
    if (paymentType === 'full') {
      query.status = { $in: ['confirmed', 'completed'] };
    } else {
      query.status = 'confirmed';
    }

    // Fetch bookings with populated data
    const bookings = await BookingModel.find(query)
      .populate({
        path: 'customer',
        select: 'name firstName lastName email phone'  // Include all possible name fields
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

    // Manually populate business data for each service to include currency information
    for (const booking of bookings) {
      const service = booking.service as Record<string, unknown>;
      if (booking.service && service.business) {
        try {
          const businessPopulated = await BusinessModel.findById(service.business as Types.ObjectId)
            .select('name address currency')
            .lean();

          if (businessPopulated) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).business = {
              id: businessPopulated._id.toString(),
              name: businessPopulated.name,
              address: businessPopulated.address,
              currency: businessPopulated.currency
            };
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).business = undefined;
          }
        } catch (error: unknown) {
          console.error('Error populating business data for booking:', booking._id, error);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (service as any).business = undefined;
        }
      }
    }

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);
    
    // Calculate total earnings for this payment type
    const totalEarnings = bookings.reduce((sum, booking) => {
      const service = booking.service as any;
      return sum + (service?.price || 0);
    }, 0);

    // Format the bookings for the response
    const formattedBookings = bookings.map(booking => {
      // Handle customer data properly with comprehensive null checks
      const customerData = booking.customer;
      let customerName = 'N/A';
      let customerEmail = 'N/A';
      let customerPhone = 'N/A';
      let firstName = 'N/A';
      let lastName = 'N/A';
      let customerId = '';
      
      // Check if populate worked correctly
      if (customerData && typeof customerData === 'object') {
        customerName = customerData.name || 'N/A';
        customerEmail = customerData.email || 'N/A';
        customerPhone = customerData.phone || 'N/A';
        customerId = customerData._id ? customerData._id.toString() : '';
        
        // Prioritize firstName and lastName if they exist, otherwise use name field
        if (customerData.firstName || customerData.lastName) {
          firstName = customerData.firstName || 'N/A';
          lastName = customerData.lastName || '';
        } else if (customerName && customerName !== 'N/A' && typeof customerName === 'string') {
          // Split name into first and last name only if name is valid and not 'N/A'
          const nameParts = customerName.trim().split(/\s+/); // Split on any whitespace
          firstName = nameParts[0] || 'N/A';
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }
      } else {
        // Log that populate failed for debugging purposes
        console.log(`Warning: Customer populate failed for booking ${booking._id}, customer field:`, customerData);
        console.log(`Booking details: service=${booking.service}, customer field=${booking.customer}, customer ObjectId? ${typeof booking.customer}`);
      }
      
      return {
        id: booking._id.toString(),
        customer: {
          id: customerId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          firstName: firstName,
          lastName: lastName
        },
      service: {
        id: (booking.service as any)?._id?.toString() || '',
        name: (booking.service as any)?.name || 'N/A',
        price: (booking.service as any)?.price || 0,
        duration: (booking.service as any)?.duration || 0,
        description: (booking.service as any)?.description || '',
        currency: (booking.service as any)?.business?.currency || 'INR'
      },
      therapist: {
        id: (booking.therapist as any)?._id?.toString() || '',
        fullName: (booking.therapist as any)?.fullName || 'N/A',
        professionalTitle: (booking.therapist as any)?.professionalTitle || 'N/A'
      },
      date: booking.date,
      time: booking.time,
      duration: booking.duration || (booking.service as any)?.duration || 0,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      therapistPayoutStatus: booking.therapistPayoutStatus,
      notes: booking.notes,
      createdAt: booking.createdAt
    };
  });

    return Response.json({
      success: true,
      message: `Earnings data retrieved successfully for ${paymentType} payments`,
      data: formattedBookings,
      earnings: {
        totalAmount: totalEarnings,
        currency: business.currency || 'INR',
        formattedTotal: formatCurrency(totalEarnings, business.currency || 'INR')
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching business earnings:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}