import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../../lib/db';
import * as jwt from 'jsonwebtoken';
import reportService from '../../../../../../services/reportService';
import BusinessModel from '../../../../../../models/Business';
import TherapistModel from '../../../../../../models/Therapist';
// Import models to ensure they're registered with mongoose before service uses them
import '../../../../../../models/Booking';
import '../../../../../../models/Service';
import '../../../../../../models/User';
// Dynamic import for CommonJS module
let generatePDF: any;

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate requests
 * Supports both Authorization header and query parameter token
 */
async function requireAuth(request: NextRequest) {
  try {
    // Try to get token from Authorization header first
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    // If not in header, try query parameter (for direct browser downloads)
    if (!token) {
      const searchParams = request.nextUrl.searchParams;
      token = searchParams.get('token') || undefined;
    }
    
    if (!token) {
      return {
        authenticated: false,
        error: 'Authentication token required',
        status: 401
      };
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (verificationError) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    const User = (await import('../../../../../../models/User')).default;
    const user = await User.findById(decoded.id);
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
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

/**
 * GET /api/reports/download/:type/pdf - Download PDF report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    await connectToDatabase();

    // Dynamically import the PDF generator (CommonJS module)
    if (!generatePDF) {
      const pdfModule = await import('../../../../../../utils/pdfGenerator');
      generatePDF = pdfModule.generatePDF;
    }

    // Authenticate the request
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const userId = user.id;
    const userRole = user.role.toLowerCase();
    const resolvedParams = await params;
    const type = resolvedParams.type;

    console.log('PDF Download - User ID:', userId, 'Role:', userRole, 'Type:', type);

    // Validate report type
    if (!type || !['customer', 'business', 'therapist'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Must be customer, business, or therapist' },
        { status: 400 }
      );
    }

    // Check role-based access
    if (type === 'customer' && userRole !== 'customer') {
      return NextResponse.json(
        { error: 'Access denied. Customer role required' },
        { status: 403 }
      );
    }
    if (type === 'business' && userRole !== 'business') {
      return NextResponse.json(
        { error: 'Access denied. Business role required' },
        { status: 403 }
      );
    }
    if (type === 'therapist' && userRole !== 'therapist') {
      return NextResponse.json(
        { error: 'Access denied. Therapist role required' },
        { status: 403 }
      );
    }

    let reportData: any;
    let title = '';

    // Get report data based on type
    if (type === 'customer') {
      console.log('Calling getCustomerReport with userId:', userId);
      try {
        reportData = await reportService.getCustomerReport(userId);
        console.log('Customer report data received:', JSON.stringify(reportData, null, 2));
      } catch (serviceError) {
        console.error('Error in getCustomerReport:', serviceError);
        throw serviceError;
      }
      title = 'Customer Report';
    } else if (type === 'business') {
      const business = await BusinessModel.findOne({ owner: userId });
      if (!business) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
      reportData = await reportService.getBusinessReport(business._id.toString());
      title = 'Business Report';
    } else if (type === 'therapist') {
      const therapist = await TherapistModel.findOne({ user: userId });
      if (!therapist) {
        return NextResponse.json(
          { error: 'Therapist profile not found' },
          { status: 404 }
        );
      }
      reportData = await reportService.getTherapistReport(therapist._id.toString());
      title = 'Therapist Report';
    }

    // Generate PDF using puppeteer
    const pdfBuffer = await generatePDF(reportData, type, title);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_report_${Date.now()}.pdf"`
      },
      status: 200
    });

  } catch (error) {
    console.error('Error in PDF download API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
