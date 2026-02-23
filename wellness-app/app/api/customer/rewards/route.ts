import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import CustomerModel from '../../../../models/Customer';
import UserModel from '../../../../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';

async function requireCustomerAuth(request: NextRequest) {
  try {
    await connectToDatabase();

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

    // Get user to verify existence
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

export async function GET(req: NextRequest) {
  try {
    // Authenticate customer
    const authResult = await requireCustomerAuth(req);
    if (!authResult.authenticated) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user!;
    const userId = user.id;

    // Find customer profile associated with the authenticated user
    const customer = await CustomerModel.findOne({ user: userId }).select('rewardPoints');

    if (!customer) {
      return Response.json(
        { success: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Return reward points
    return Response.json({
      success: true,
      data: {
        rewardPoints: customer.rewardPoints || 0  // Default to 0 if not set
      }
    });

  } catch (error: any) {
    console.error('Error fetching customer rewards:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch reward points' },
      { status: 500 }
    );
  }
}