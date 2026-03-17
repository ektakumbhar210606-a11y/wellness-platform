import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import * as jwt from 'jsonwebtoken';
import reportService from '../../../../services/reportService';
// Import models to ensure they're registered with mongoose before service uses them
import '../../../../models/Booking';
import '../../../../models/Service';
import '../../../../models/Therapist';

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
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

    const user = await import('../../../../models/User').then(m => m.default.findById(decoded.id));
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
 * GET /api/reports/customer - Get customer report
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

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

    console.log('Customer Report API - User ID:', userId);

    // Get report data
    console.log('Calling reportService.getCustomerReport...');
    const reportData = await reportService.getCustomerReport(userId);
    console.log('Report data received:', reportData);

    return NextResponse.json({
      success: true,
      message: 'Customer report generated successfully',
      data: reportData
    }, { status: 200 });

  } catch (error) {
    console.error('Error in customer report API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
