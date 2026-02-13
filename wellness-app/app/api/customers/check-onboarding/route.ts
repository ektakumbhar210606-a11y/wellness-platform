import { NextRequest } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import CustomerModel from '../../../../models/Customer';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Verify token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    } catch (verificationError: unknown) {
      return Response.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded) {
      return Response.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find customer by user ID
    const customer = await CustomerModel.findOne({ user: decoded.id });

    if (!customer) {
      // If no customer profile exists, they need to complete onboarding
      return Response.json({
        success: true,
        onboardingCompleted: false,
        message: 'Customer profile not found'
      });
    }

    return Response.json({
      success: true,
      onboardingCompleted: customer.onboardingCompleted,
      message: 'Onboarding status retrieved successfully'
    });

  } catch (error: unknown) {
    console.error('Error checking onboarding status:', error);
    return Response.json(
      { success: false, error: (error instanceof Error) ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}