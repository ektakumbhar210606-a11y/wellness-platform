import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel from '../../../../../models/Booking';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate and authorize customer users
 */
async function requireCustomerAuth(request: NextRequest) {
  try {
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

    // Check user role - allow both 'Customer' and 'customer' for backward compatibility
    if (decoded.role.toLowerCase() !== 'customer') {
      return {
        authenticated: false,
        error: 'Access denied. Customer role required',
        status: 403
      };
    }

    // Get user to verify existence (connection already established by POST handler)
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

export async function POST(req: NextRequest) {
  try {
    // Connect to database first (only once)
    await connectToDatabase();
    
    // Authenticate and authorize customer user
    const authResult = await requireCustomerAuth(req);
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
    let body;
    try {
      body = await req.json();
      console.log('📥 Request body received:', body);
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return Response.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }
    
    const { selectedFields = [] } = body;
    console.log('Selected fields from client:', selectedFields);

    // Validate selected fields is an array
    if (!Array.isArray(selectedFields)) {
      return Response.json(
        { 
          success: false, 
          error: 'selectedFields must be an array' 
        },
        { status: 400 }
      );
    }

    // Validate selected fields
    const allowedFields = [
      'totalBookings',
      'completedBookings',
      'cancelledBookings',
      'totalSpent',
      'totalDiscountUsed',
      'mostBookedService',
      'bookings',
      'monthlyBookings',
      'serviceHistory'
    ];

    const invalidFields = selectedFields.filter((field: string) => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return Response.json(
        { 
          success: false, 
          error: `Invalid fields: ${invalidFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Get customer bookings
    const customerId = decoded.id;
    
    // Validate customer ID
    if (!require('mongoose').Types.ObjectId.isValid(customerId)) {
      return Response.json(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const mongoose = require('mongoose');
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Get all bookings for this customer
    const bookings = await BookingModel.find({ customer: customerObjectId })
      .populate('service', 'name price')
      .populate('therapist', 'fullName')
      .sort({ createdAt: -1 });

    // Generate report based on selected fields
    const reportData: any = {};

    // Calculate basic statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    const totalSpent = bookings.reduce((sum, booking) => {
      const price = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
      return sum + price;
    }, 0);
    
    console.log('💰 Calculated totalSpent:', totalSpent);
    console.log('Sample booking prices:', bookings.slice(0, 3).map(b => ({
      serviceName: b.service?.name,
      finalPrice: b.finalPrice,
      originalPrice: b.originalPrice,
      servicePrice: b.service?.price,
      status: b.status
    })));
    
    const totalDiscountUsed = bookings.reduce((sum, booking) => {
      return sum + (booking.rewardDiscountAmount || booking.discountApplied || 0);
    }, 0);

    // Find most booked service
    const serviceCount: Record<string, number> = {};
    bookings.forEach(booking => {
      const serviceName = booking.service?.name || 'Unknown Service';
      serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
    });

    let mostBookedService: string | null = null;
    let maxCount = 0;
    Object.entries(serviceCount).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostBookedService = name;
      }
    });

    console.log('Selected fields:', selectedFields);
    console.log('Total bookings found:', bookings.length);
    
    // Include ONLY the exact fields requested - no auto-additions
    
    // Include basic stats if requested
    if (selectedFields.includes('totalBookings')) {
      reportData.totalBookings = totalBookings;
      console.log('✅ Added totalBookings:', totalBookings);
    }
    if (selectedFields.includes('completedBookings')) {
      reportData.completedBookings = completedBookings;
      console.log('✅ Added completedBookings:', completedBookings);
    }
    if (selectedFields.includes('cancelledBookings')) {
      reportData.cancelledBookings = cancelledBookings;
      console.log('✅ Added cancelledBookings:', cancelledBookings);
    }
    if (selectedFields.includes('totalSpent')) {
      reportData.totalSpent = totalSpent;
      console.log('💰 Added totalSpent:', totalSpent);
    }
    if (selectedFields.includes('totalDiscountUsed')) {
      reportData.totalDiscountUsed = totalDiscountUsed;
      console.log('🎁 Added totalDiscountUsed:', totalDiscountUsed);
    }
    if (selectedFields.includes('mostBookedService')) {
      reportData.mostBookedService = mostBookedService;
      console.log('⭐ Added mostBookedService:', mostBookedService);
    }

    // Include detailed bookings data if requested
    if (selectedFields.includes('bookings') || selectedFields.includes('totalBookings')) {
      reportData.bookings = bookings.map((b, index) => {
        // Safely parse dates with fallbacks
        let appointmentDate: Date | null = null;
        if (b.appointmentDate) {
          appointmentDate = new Date(b.appointmentDate);
          if (isNaN(appointmentDate.getTime())) {
            appointmentDate = null;
          }
        }
        
        let createdDate: Date | null = null;
        if (b.createdAt) {
          createdDate = new Date(b.createdAt);
          if (isNaN(createdDate.getTime())) {
            createdDate = new Date();
          }
        } else {
          createdDate = new Date();
        }
        
        // Get service price from multiple sources for accuracy
        const servicePrice = b.service?.price || 0;
        const finalPrice = b.finalPrice || b.originalPrice || servicePrice || 0;
        
        const bookingData = {
          _id: b._id.toString(),
          serviceName: b.service?.name || 'Unknown Service',
          therapistName: b.therapist?.fullName || 'Unknown Therapist',
          date: appointmentDate ? appointmentDate.toISOString() : createdDate.toISOString(),
          appointmentDate: appointmentDate ? appointmentDate.toISOString() : null,
          createdAt: createdDate.toISOString(),
          time: b.time || 'N/A',
          status: b.status || 'pending',
          finalPrice: finalPrice,
          originalPrice: b.originalPrice || servicePrice || 0,
          discountApplied: !!(b.rewardDiscountApplied || b.discountApplied),
          discountAmount: b.rewardDiscountAmount || b.discountApplied || 0,
          paymentStatus: b.paymentStatus || 'pending',
          notes: b.notes || '',
        };
        
        if (index < 3) {
          console.log(`Sample booking ${index} (COMPREHENSIVE):`, bookingData);
        }
        
        return bookingData;
      });
      console.log('Added COMPREHENSIVE bookings array with length:', reportData.bookings.length);
    }

    // Calculate monthly booking trend if requested
    if (selectedFields.includes('monthlyBookings')) {
      const monthlyData: Record<string, { bookings: number; spent: number }> = {};
      
      bookings.forEach(booking => {
        // Safely parse createdAt date
        let createdDate: Date;
        if (booking.createdAt) {
          createdDate = new Date(booking.createdAt);
          if (isNaN(createdDate.getTime())) {
            createdDate = new Date();
          }
        } else {
          createdDate = new Date();
        }
        
        const month = createdDate.toISOString().slice(0, 7); // YYYY-MM
        
        if (!monthlyData[month]) {
          monthlyData[month] = { bookings: 0, spent: 0 };
        }
        
        monthlyData[month].bookings += 1;
        monthlyData[month].spent += booking.finalPrice || 0;
      });

      // Convert to array format
      reportData.monthlyBookings = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, bookings: data.bookings, spent: data.spent }))
        .sort((a, b) => b.month.localeCompare(a.month));
      
      console.log('📊 Added monthlyBookings array with length:', reportData.monthlyBookings.length);
    }

    // Calculate service history if requested
    if (selectedFields.includes('serviceHistory')) {
      const serviceHistory: Record<string, { 
        serviceName: string;
        bookings: number;
        totalSpent: number;
        lastBooking: string;
      }> = {};

      console.log('🔍 Calculating service history for', bookings.length, 'bookings');
      
      bookings.forEach((booking, index) => {
        const serviceName = booking.service?.name || 'Unknown Service';
        
        // Debug first 3 bookings to see price data
        if (index < 3) {
          console.log(`Booking ${index}:`, {
            serviceName,
            finalPrice: booking.finalPrice,
            originalPrice: booking.originalPrice,
            servicePrice: booking.service?.price,
            status: booking.status
          });
        }
        
        if (!serviceHistory[serviceName]) {
          serviceHistory[serviceName] = {
            serviceName,
            bookings: 0,
            totalSpent: 0,
            lastBooking: booking.createdAt?.toISOString() || new Date().toISOString()
          };
        }
        
        serviceHistory[serviceName].bookings += 1;
        
        // Use multiple fallback sources for price
        const price = booking.finalPrice || booking.originalPrice || booking.service?.price || 0;
        serviceHistory[serviceName].totalSpent += price;
        
        if (index < 3) {
          console.log(`Added ${price} to service ${serviceName}, total now: ${serviceHistory[serviceName].totalSpent}`);
        }
        
        // Update last booking date if this is more recent
        const bookingDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
        const lastBookingDate = new Date(serviceHistory[serviceName].lastBooking);
        if (bookingDate > lastBookingDate) {
          serviceHistory[serviceName].lastBooking = bookingDate.toISOString();
        }
      });

      // Convert to array format
      reportData.serviceHistory = Object.values(serviceHistory)
        .sort((a, b) => b.bookings - a.bookings);
      
      console.log('🏢 Added serviceHistory array with length:', reportData.serviceHistory.length);
      console.log('Service history summary:', reportData.serviceHistory.map((s: any) => ({
        serviceName: s.serviceName,
        bookings: s.bookings,
        totalSpent: s.totalSpent
      })));
    }

    // If no specific fields selected but we have data, include all detailed reports
    if (selectedFields.length === 0) {
      reportData.totalBookings = totalBookings;
      reportData.completedBookings = completedBookings;
      reportData.cancelledBookings = cancelledBookings;
      reportData.totalSpent = totalSpent;
      reportData.totalDiscountUsed = totalDiscountUsed;
      reportData.mostBookedService = mostBookedService;
      
      reportData.bookings = bookings.map(b => ({
        _id: b._id.toString(),
        serviceName: b.service?.name || 'Unknown Service',
        therapistName: b.therapist?.fullName || 'Unknown Therapist',
        date: b.appointmentDate || b.createdAt,
        time: b.time || 'N/A',
        status: b.status,
        finalPrice: b.finalPrice || 0,
        discountApplied: !!(b.rewardDiscountApplied || b.discountApplied),
      }));
      
      const monthlyData: Record<string, { bookings: number; spent: number }> = {};
      bookings.forEach(booking => {
        const month = new Date(booking.createdAt || Date.now()).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { bookings: 0, spent: 0 };
        }
        monthlyData[month].bookings += 1;
        monthlyData[month].spent += booking.finalPrice || 0;
      });
      
      reportData.monthlyBookings = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, bookings: data.bookings, spent: data.spent }))
        .sort((a, b) => b.month.localeCompare(a.month));
      
      const serviceHistory: Record<string, any> = {};
      bookings.forEach(booking => {
        const serviceName = booking.service?.name || 'Unknown Service';
        if (!serviceHistory[serviceName]) {
          serviceHistory[serviceName] = {
            serviceName,
            bookings: 0,
            totalSpent: 0,
            lastBooking: booking.createdAt?.toISOString() || new Date().toISOString()
          };
        }
        serviceHistory[serviceName].bookings += 1;
        serviceHistory[serviceName].totalSpent += booking.finalPrice || 0;
      });
      
      reportData.serviceHistory = Object.values(serviceHistory)
        .sort((a, b) => b.bookings - a.bookings);
    }

    console.log('Final report data keys:', Object.keys(reportData));
    console.log('Report generation complete. Success:', true);

    return Response.json({
      success: true,
      message: 'Custom customer report generated successfully',
      data: reportData
    });

  } catch (error: unknown) {
    console.error('❌ Error generating custom customer report:', error);
    console.error('Stack trace:', (error instanceof Error) ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
    console.error('Returning error message:', errorMessage);
    
    return Response.json(
      { 
        success: false, 
        error: errorMessage,
        details: (error instanceof Error) ? error.toString() : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
