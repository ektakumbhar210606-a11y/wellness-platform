import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

let generateExcel: any = null;

/**
 * Middleware to authenticate and authorize customer users
 */
async function requireCustomerAuth(request: NextRequest) {
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
    } catch (verificationError: unknown) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    if (decoded.role.toLowerCase() !== 'customer') {
      return {
        authenticated: false,
        error: 'Access denied. Customer role required',
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

    // Dynamically import the Excel generator (CommonJS module)
    if (!generateExcel) {
      const excelModule = await import('../../../../../utils/excelGenerator');
      generateExcel = excelModule.generateExcel;
    }

    // Authenticate the request
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const userId = user.id;
    const userRole = user.role.toLowerCase();

    // Check role-based access
    if (userRole !== 'customer') {
      return Response.json(
        { error: 'Access denied. Customer role required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reportData } = body;

    if (!reportData || typeof reportData !== 'object') {
      return Response.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    // Generate Excel
    const excelBuffer = await generateExcel(reportData, 'customer');

    // Return Excel file as response
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="customer_report_${Date.now()}.xlsx"`
      }
    });

  } catch (error: unknown) {
    console.error('Error generating customer Excel:', error);
    return Response.json(
      { 
        error: (error instanceof Error) ? error.message : 'Failed to generate Excel' 
      },
      { status: 500 }
    );
  }
}
