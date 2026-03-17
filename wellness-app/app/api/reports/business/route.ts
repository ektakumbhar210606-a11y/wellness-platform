import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import * as jwt from 'jsonwebtoken';
import reportService from '../../../../services/reportService';
import BusinessModel from '../../../../models/Business';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware to authenticate requests
 */
async function requireAuth(request: NextRequest, requiredRole?: string) {
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

    if (requiredRole && decoded.role.toLowerCase() !== requiredRole.toLowerCase()) {
      return {
        authenticated: false,
        error: `Access denied. ${requiredRole} role required`,
        status: 403
      };
    }

    const User = (await import('../../../../models/User')).default;
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
 * GET /api/reports/business - Get business report
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Authenticate the request
    const authResult = await requireAuth(request, 'Business');
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const userId = user.id;

    // Find business associated with this user
    const business = await BusinessModel.findOne({ owner: userId });
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found for this user' },
        { status: 404 }
      );
    }

    const businessId = business._id.toString();

    // Get report data
    const reportData = await reportService.getBusinessReport(businessId);

    return NextResponse.json({
      success: true,
      message: 'Business report generated successfully',
      data: reportData
    }, { status: 200 });

  } catch (error) {
    console.error('Error in business report API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
