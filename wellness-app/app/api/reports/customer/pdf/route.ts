import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import UserModel from '../../../../../models/User';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

let generatePDF: any = null;

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

    // Dynamically import the PDF generator (CommonJS module)
    if (!generatePDF) {
      const pdfModule = await import('../../../../../utils/pdfGenerator');
      generatePDF = pdfModule.generatePDF;
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

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData, 'customer', 'Customer Booking Report');

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="customer_report_${Date.now()}.pdf"`
      }
    });

  } catch (error: unknown) {
    console.error('Error generating customer PDF:', error);
    return Response.json(
      { 
        error: (error instanceof Error) ? error.message : 'Failed to generate PDF' 
      },
      { status: 500 }
    );
  }
}
