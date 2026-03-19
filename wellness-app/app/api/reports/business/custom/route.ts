import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import BookingModel from '../../../../../models/Booking';
import BusinessModel from '../../../../../models/Business';
import ServiceModel from '../../../../../models/Service';
import TherapistModel from '../../../../../models/Therapist';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';

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
    const { selectedFields = [] } = body;

    // Validate selected fields
    const allowedFields = [
      'totalServices',
      'totalTherapists',
      'totalBookings',
      'completedBookings',
      'cancelledBookings',
      'totalRevenue',
      'mostBookedService',
      'topTherapist',
      'monthlyRevenue'
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

    // Find business owned by authenticated user
    const business = await BusinessModel.findOne({ owner: decoded.id });
    if (!business) {
      return Response.json(
        { success: false, error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Generate report based on selected fields
    const reportData: any = {};

    // Get all services for this business
    const services = await ServiceModel.find({ business: business._id });
    const serviceIds = services.map(s => s._id);

    // Get all bookings for this business's services
    const bookings = await BookingModel.find({ 
      service: { $in: serviceIds }
    })
      .populate('therapist', 'fullName')
      .populate('customer', 'name')
      .populate('service', 'name price duration description')
      .sort({ createdAt: -1 });

    // Calculate totalServices if requested
    if (selectedFields.includes('totalServices')) {
      reportData.totalServices = services.length;
      // Include detailed service data
      reportData.services = services.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        price: s.price,
        duration: s.duration,
        description: s.description,
      }));
    }

    // Calculate totalTherapists if requested
    if (selectedFields.includes('totalTherapists')) {
      const uniqueTherapists = new Set(
        bookings.map(b => b.therapist?._id?.toString()).filter(Boolean)
      );
      // Also count therapists associated with this business
      const therapistCount = await TherapistModel.countDocuments({ 
        associatedBusinesses: { $elemMatch: { businessId: business._id } }
      });
      reportData.totalTherapists = Math.max(uniqueTherapists.size, therapistCount);
      
      // Include detailed therapist data - get ALL therapists associated with business
      const allBusinessTherapists = await TherapistModel.find({
        associatedBusinesses: { $elemMatch: { businessId: business._id } }
      }).select('fullName specialization areaOfExpertise');
      
      // Map booking counts
      const therapistBookings: Record<string, number> = {};
      bookings.forEach(booking => {
        const therapistId = booking.therapist?._id?.toString();
        if (therapistId) {
          therapistBookings[therapistId] = (therapistBookings[therapistId] || 0) + 1;
        }
      });
      
      reportData.therapists = allBusinessTherapists.map(t => ({
        _id: t._id.toString(),
        name: t.fullName || 'Unknown',
        specialization: t.areaOfExpertise?.join(', ') || t.specialization || 'Not specified',
        totalBookings: therapistBookings[t._id.toString()] || 0,
      }));
    }

    // Calculate booking statistics if requested
    if (selectedFields.includes('totalBookings') || 
        selectedFields.includes('completedBookings') || 
        selectedFields.includes('cancelledBookings')) {
      reportData.totalBookings = bookings.length;
      reportData.completedBookings = bookings.filter(b => b.status === 'completed').length;
      reportData.cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      // Include detailed booking data - ensure all fields are populated
      reportData.bookings = bookings.map(b => {
        const serviceDoc = b.service as any;
        const customerDoc = b.customer as any;
        const therapistDoc = b.therapist as any;
        
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
            createdDate = new Date(); // Current date as fallback
          }
        } else {
          createdDate = new Date();
        }
        
        return {
          _id: b._id.toString(),
          serviceName: serviceDoc?.name || 'Unknown Service',
          customerName: customerDoc?.name || 'Unknown Customer',
          therapistName: therapistDoc?.fullName || 'Unknown Therapist',
          date: appointmentDate ? appointmentDate.toISOString() : createdDate.toISOString(),
          status: b.status || 'pending',
          finalPrice: b.finalPrice || 0,
        };
      });
    }

    // Calculate totalRevenue if requested
    if (selectedFields.includes('totalRevenue')) {
      reportData.totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, booking) => sum + (booking.finalPrice || 0), 0);
      
      // Include revenue by service analysis
      const serviceRevenue: Record<string, { bookings: number; revenue: number }> = {};
      bookings
        .filter(b => b.status === 'completed')
        .forEach(booking => {
          const serviceName = (booking.service as any)?.name || 'Unknown Service';
          if (!serviceRevenue[serviceName]) {
            serviceRevenue[serviceName] = { bookings: 0, revenue: 0 };
          }
          serviceRevenue[serviceName].bookings += 1;
          serviceRevenue[serviceName].revenue += booking.finalPrice || 0;
        });
      
      reportData.revenueByService = Object.entries(serviceRevenue).map(([serviceName, data]) => ({
        serviceName,
        bookings: data.bookings,
        revenue: data.revenue,
      })).sort((a, b) => b.revenue - a.revenue);
    }

    // Find mostBookedService if requested
    if (selectedFields.includes('mostBookedService')) {
      const serviceCount: Record<string, number> = {};
      for (const booking of bookings) {
        const service = await ServiceModel.findById(booking.service);
        const serviceName = service?.name || 'Unknown Service';
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      }

      let mostBookedService: string | null = null;
      let maxCount = 0;
      Object.entries(serviceCount).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostBookedService = name;
        }
      });
      reportData.mostBookedService = mostBookedService;
    }

    // Find topTherapist if requested
    if (selectedFields.includes('topTherapist')) {
      const therapistCount: Record<string, number> = {};
      bookings.forEach(booking => {
        const therapistId = booking.therapist?._id?.toString();
        if (therapistId) {
          therapistCount[therapistId] = (therapistCount[therapistId] || 0) + 1;
        }
      });

      let topTherapistId: string | null = null;
      let topTherapistName: string | null = null;
      let maxTherapistBookings = 0;
      
      for (const [therapistId, count] of Object.entries(therapistCount)) {
        if (count > maxTherapistBookings) {
          maxTherapistBookings = count;
          topTherapistId = therapistId;
          const therapist = await TherapistModel.findById(therapistId);
          topTherapistName = therapist?.fullName || 'Unknown Therapist';
        }
      }

      reportData.topTherapist = {
        id: topTherapistId,
        name: topTherapistName,
        bookings: maxTherapistBookings
      };
    }

    // Calculate monthlyRevenue if requested
    if (selectedFields.includes('monthlyRevenue')) {
      const monthlyRevenue: Record<string, number> = {};
      bookings
        .filter(b => b.status === 'completed')
        .forEach(booking => {
          // Safely parse createdAt date
          let createdDate: Date;
          if (booking.createdAt) {
            createdDate = new Date(booking.createdAt);
            if (isNaN(createdDate.getTime())) {
              createdDate = new Date(); // Fallback to current date
            }
          } else {
            createdDate = new Date();
          }
          
          const month = createdDate.toISOString().slice(0, 7); // YYYY-MM
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (booking.finalPrice || 0);
        });

      // Convert to array format
      reportData.monthlyRevenue = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => b.month.localeCompare(a.month));
    }

    // If no specific fields selected but we have data, include all detailed reports
    if (selectedFields.length === 0) {
      reportData.services = services.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        price: s.price,
        duration: s.duration,
        description: s.description,
      }));
      
      const therapistBookings: Record<string, number> = {};
      bookings.forEach(booking => {
        const therapistId = booking.therapist?._id?.toString();
        if (therapistId) {
          therapistBookings[therapistId] = (therapistBookings[therapistId] || 0) + 1;
        }
      });
      
      const therapistDetails = await TherapistModel.find({
        _id: { $in: Object.keys(therapistBookings) }
      }).select('fullName specialization');
      
      reportData.therapists = therapistDetails.map(t => ({
        _id: t._id.toString(),
        name: t.fullName,
        specialization: t.specialization,
        totalBookings: therapistBookings[t._id.toString()] || 0,
      }));
      
      reportData.bookings = bookings.map(b => ({
        _id: b._id.toString(),
        serviceName: (b.service as any)?.name || 'Unknown Service',
        customerName: (b.customer as any)?.name || 'Unknown Customer',
        therapistName: (b.therapist as any)?.fullName || 'Unknown Therapist',
        date: b.appointmentDate || b.createdAt,
        status: b.status,
        finalPrice: b.finalPrice || 0,
      }));
      
      const serviceRevenue: Record<string, { bookings: number; revenue: number }> = {};
      bookings
        .filter(b => b.status === 'completed')
        .forEach(booking => {
          const serviceName = (booking.service as any)?.name || 'Unknown Service';
          if (!serviceRevenue[serviceName]) {
            serviceRevenue[serviceName] = { bookings: 0, revenue: 0 };
          }
          serviceRevenue[serviceName].bookings += 1;
          serviceRevenue[serviceName].revenue += booking.finalPrice || 0;
        });
      
      reportData.revenueByService = Object.entries(serviceRevenue).map(([serviceName, data]) => ({
        serviceName,
        bookings: data.bookings,
        revenue: data.revenue,
      })).sort((a, b) => b.revenue - a.revenue);
    }

    return Response.json({
      success: true,
      message: 'Custom business report generated successfully',
      data: reportData
    });

  } catch (error: unknown) {
    console.error('Error generating custom business report:', error);
    return Response.json(
      { 
        success: false, 
        error: (error instanceof Error) ? error.message : 'Failed to generate custom report' 
      },
      { status: 500 }
    );
  }
}
