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
    const body = await req.json();
    const { selectedFields = [] } = body;

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
    
    // Smart field inclusion with automatic related data
    console.log('\n🔍 Processing fields with smart auto-inclusion...');
    
    // Always include detailed bookings data for comprehensive analysis
    const shouldIncludeDetailedBookings = 
      selectedFields.includes('bookings') ||
      selectedFields.includes('totalBookings') ||
      selectedFields.includes('completedBookings') ||
      selectedFields.includes('cancelledBookings') ||
      selectedFields.includes('totalSpent') ||
      selectedFields.includes('totalDiscountUsed') ||
      selectedFields.includes('monthlyBookings') ||
      selectedFields.includes('serviceHistory');
    
    if (shouldIncludeDetailedBookings && !reportData.bookings) {
      reportData.bookings = bookings.map((b, index) => {
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
        
        if (index < 2) {
          console.log(`📚 Sample booking ${index}:`, { 
            serviceName: bookingData.serviceName, 
            status: bookingData.status,
            finalPrice: bookingData.finalPrice 
          });
        }
        
        return bookingData;
      });
      console.log('📚 Added COMPREHENSIVE bookings array:', reportData.bookings.length, 'bookings');
    }
    
    // Include basic stats if requested
    if (selectedFields.includes('totalBookings')) {
      reportData.totalBookings = totalBookings;
      console.log('✅ Added totalBookings:', totalBookings);
      
      // Auto-include breakdown for context
      if (!selectedFields.includes('completedBookings')) {
        reportData.completedBookings = completedBookings;
        console.log('➕ Auto-added completedBookings:', completedBookings);
      }
      if (!selectedFields.includes('cancelledBookings')) {
        reportData.cancelledBookings = cancelledBookings;
        console.log('➕ Auto-added cancelledBookings:', cancelledBookings);
      }
    }
    if (selectedFields.includes('completedBookings')) {
      reportData.completedBookings = completedBookings;
      console.log('✅ Added completedBookings:', completedBookings);
      
      // Auto-include total for context
      if (!selectedFields.includes('totalBookings')) {
        reportData.totalBookings = totalBookings;
        console.log('➕ Auto-added totalBookings:', totalBookings);
      }
    }
    if (selectedFields.includes('cancelledBookings')) {
      reportData.cancelledBookings = cancelledBookings;
      console.log('✅ Added cancelledBookings:', cancelledBookings);
      
      // Auto-include total for context
      if (!selectedFields.includes('totalBookings')) {
        reportData.totalBookings = totalBookings;
        console.log('➕ Auto-added totalBookings:', totalBookings);
      }
    }
    if (selectedFields.includes('totalSpent')) {
      reportData.totalSpent = totalSpent;
      console.log('💰 Added totalSpent:', totalSpent);
      
      // Auto-include discount info
      if (!selectedFields.includes('totalDiscountUsed')) {
        reportData.totalDiscountUsed = totalDiscountUsed;
        console.log('➕ Auto-added totalDiscountUsed:', totalDiscountUsed);
      }
    }
    if (selectedFields.includes('totalDiscountUsed')) {
      reportData.totalDiscountUsed = totalDiscountUsed;
      console.log('🎁 Added totalDiscountUsed:', totalDiscountUsed);
      
      // Auto-include spent for context
      if (!selectedFields.includes('totalSpent')) {
        reportData.totalSpent = totalSpent;
        console.log('➕ Auto-added totalSpent:', totalSpent);
      }
    }
    if (selectedFields.includes('mostBookedService')) {
      reportData.mostBookedService = mostBookedService;
      console.log('⭐ Added mostBookedService:', mostBookedService);
      
      // Auto-include service history
      if (!selectedFields.includes('serviceHistory')) {
        reportData.serviceHistory = serviceHistory;
        console.log('➕ Auto-added serviceHistory:', serviceHistory.length, 'services');
      }
    }
    if (selectedFields.includes('serviceHistory')) {
      reportData.serviceHistory = serviceHistory;
      console.log('🏢 Added serviceHistory:', serviceHistory.length, 'services');
      
      // Auto-include most booked
      if (!selectedFields.includes('mostBookedService')) {
        reportData.mostBookedService = mostBookedService;
        console.log('➕ Auto-added mostBookedService:', mostBookedService);
      }
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
      
      console.log('Added monthlyBookings array with length:', reportData.monthlyBookings.length);
    }

    // Calculate service history if requested
    if (selectedFields.includes('serviceHistory')) {
      const serviceHistory: Record<string, { 
        serviceName: string;
        bookings: number;
        totalSpent: number;
        lastBooking: string;
      }> = {};

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
      
      console.log('Added serviceHistory array with length:', reportData.serviceHistory.length);
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
    console.error('Error generating custom customer report:', error);
    return Response.json(
      { 
        success: false, 
        error: (error instanceof Error) ? error.message : 'Failed to generate custom report' 
      },
      { status: 500 }
    );
  }
}
