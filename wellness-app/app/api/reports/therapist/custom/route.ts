import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import * as jwt from 'jsonwebtoken';
import reportService from '@/services/reportService';
import TherapistModel from '@/models/Therapist';
import UserModel from '@/models/User';

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

    if (decoded.role.toLowerCase() !== 'therapist') {
      return {
        authenticated: false,
        error: 'Access denied. Therapist role required',
        status: 403
      };
    }

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
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: (error instanceof Error) ? error.message : 'Internal server error',
      status: 500
    };
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { selectedFields = [] } = body;

    // Validate selected fields
    const allowedFields = [
      'totalBookings',
      'completedBookings',
      'cancelledBookings',
      'totalEarnings',
      'totalServicesDone',
      'monthlyCancelCount',
      'bonusPenaltyPercentage',
      'recentBookings',
      'monthlyRevenue',
      'serviceBreakdown'
    ];

    const invalidFields = selectedFields.filter((field: string) => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid fields: ${invalidFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Find therapist profile associated with this user
    const therapist = await TherapistModel.findOne({ user: userId });
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist profile not found for this user' },
        { status: 404 }
      );
    }

    const therapistId = therapist._id.toString();

    // Generate custom report based on selected fields
    const reportData = await reportService.getTherapistCustomReport(therapistId, selectedFields);

    return NextResponse.json({
      success: true,
      message: 'Custom therapist report generated successfully',
      data: reportData
    }, { status: 200 });

  } catch (error) {
    console.error('Error in therapist custom report API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + ((error instanceof Error) ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
}
