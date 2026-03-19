import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import * as jwt from 'jsonwebtoken';
import TherapistModel from '../../../../../models/Therapist';
// Import models to ensure they're registered with mongoose before service uses them
import '../../../../../models/Booking';
import '../../../../../models/Service';
import '../../../../../models/User';
// Dynamic import for CommonJS module
let generateExcel: any;

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate requests
 */
async function requireAuth(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
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

    const User = (await import('../../../../../models/User')).default;
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
 * POST /api/reports/therapist/excel - Generate Excel from custom report data
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Dynamically import the Excel generator (CommonJS module)
    if (!generateExcel) {
      const excelModule = await import('../../../../../utils/excelGenerator');
      generateExcel = excelModule.generateExcel;
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

    // Check role-based access
    if (userRole !== 'therapist') {
      return NextResponse.json(
        { error: 'Access denied. Therapist role required' },
        { status: 403 }
      );
    }

    // Parse request body to get custom report data
    const body = await request.json();
    const { reportData: customReportData } = body;

    if (!customReportData || typeof customReportData !== 'object') {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Verify therapist ownership
    const therapist = await TherapistModel.findOne({ user: userId });
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Generate Excel
    const excelBuffer = await generateExcel(customReportData, 'therapist');

    // Return Excel file as downloadable file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="custom_therapist_report_${Date.now()}.xlsx"`
      },
      status: 200
    });

  } catch (error) {
    console.error('Error in custom Excel generation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
