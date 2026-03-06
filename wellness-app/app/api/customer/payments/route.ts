import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PaymentModel, { PaymentStatus } from '@/models/Payment';
import BookingModel from '@/models/Booking';
import UserModel from '@/models/User';
import { requireCustomerAuth } from '@/lib/middleware/authMiddleware';

/**
 * GET /api/customer/payments
 * Fetch all payment records for the authenticated customer
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Number of results per page (default: 20)
 * - status: Filter by payment status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== Customer Payments API ===');
    console.log('Request URL:', request.url);
    
    // Authenticate customer user
    const authResult = await requireCustomerAuth(request);
    console.log('Auth result:', authResult);
    
    if (!authResult.authenticated) {
      console.error('Authentication failed:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const userId = authResult.user!.id;
    console.log('Authenticated user ID:', userId);

    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statusFilter = searchParams.get('status');

    // Validate pagination parameters
    const skip = Math.max(0, (page - 1) * limit);
    const validLimit = Math.min(Math.max(1, limit), 100);

    // Build query to find all bookings for this customer
    const bookingQuery = { customer: userId };
    
    // Find all bookings for this customer
    const customerBookings = await BookingModel.find(bookingQuery).select('_id');
    const bookingIds = customerBookings.map((booking) => booking._id);

    if (bookingIds.length === 0) {
      // No bookings found, return empty payments
      return NextResponse.json({
        success: true,
        data: {
          payments: [],
          pagination: {
            page: 1,
            limit: validLimit,
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Build payment query
    const paymentQuery: any = {
      booking: { $in: bookingIds }
    };

    // Add status filter if provided
    if (statusFilter && Object.values(PaymentStatus).includes(statusFilter as PaymentStatus)) {
      paymentQuery.status = statusFilter;
    }

    // Fetch payments with populated booking data
    const payments = await PaymentModel.find(paymentQuery)
      .populate({
        path: 'booking',
        select: 'service date time status finalPrice originalPrice rewardDiscountApplied therapist'
      })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(validLimit);

    // Manually populate service, therapist, and business data for each payment
    const populatedPayments = await Promise.all(
      payments.map(async (payment) => {
        const booking = payment.booking as any;
        if (!booking) return payment;

        // Populate service if it exists
        if (booking.service) {
          const ServiceModel = (await import('@/models/Service')).default;
          const service = await ServiceModel.findById(booking.service);
          
          if (service) {
            (booking as any).service = service;
            
            // Populate business from service
            const BusinessModel = (await import('@/models/Business')).default;
            const business = await BusinessModel.findById(service.business);
            (booking as any).business = business;
          }
        }

        // Populate therapist if it exists
        if (booking.therapist) {
          const TherapistModel = (await import('@/models/Therapist')).default;
          const therapist = await TherapistModel.findById(booking.therapist);
          (booking as any).therapist = therapist;
        }

        return payment;
      })
    );

    // Get total count for pagination
    const total = await PaymentModel.countDocuments(paymentQuery);

    // Format payments for response
    const formattedPayments = populatedPayments.map((payment) => {
      const booking = payment.booking as any;
      const service = booking?.service;
      const therapist = booking?.therapist;
      const business = booking?.business;

      return {
        id: payment._id.toString(),
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        advancePaid: payment.advancePaid,
        remainingAmount: payment.remainingAmount,
        paymentType: payment.paymentType,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        booking: booking ? {
          id: booking._id.toString(),
          service: service ? {
            id: service._id.toString(),
            name: service.name,
            price: service.price,
            duration: service.duration,
            description: service.description
          } : null,
          therapist: therapist ? {
            id: therapist._id.toString(),
            fullName: therapist.fullName,
            professionalTitle: therapist.professionalTitle
          } : null,
          business: business ? {
            id: business._id.toString(),
            name: business.name,
            currency: business.currency,
            address: business.address
          } : null,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          finalPrice: booking.finalPrice,
          originalPrice: booking.originalPrice,
          rewardDiscountApplied: booking.rewardDiscountApplied
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit: validLimit,
          total,
          totalPages: Math.ceil(total / validLimit)
        }
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
