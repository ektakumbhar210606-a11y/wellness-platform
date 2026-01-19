// Use Node.js runtime instead of Edge runtime to support bcrypt
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import User from '../../../../../models/User';

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get the token from URL parameters
    const { token } = params;

    // Parse request body
    const body = await request.json();
    const { password } = body;

    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate password format (using same validation as registration)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    // Import bcrypt dynamically since it might not be available in edge runtime
    const bcrypt = await import('bcryptjs');

    // Hash the new password using the same salt rounds as registration
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Find user with a valid reset token that hasn't expired
    const users = await User.find({
      resetPasswordToken: { $exists: true, $ne: null },
      resetPasswordExpires: { $gt: Date.now() } // Check that token hasn't expired
    });

    // Find the specific user by comparing the hashed token
    let user = null;
    for (const u of users) {
      const isValidToken = await bcrypt.compare(token, u.resetPasswordToken);
      if (isValidToken) {
        user = u;
        break;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    // Update user's password and clear reset token fields
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined, // Clear the reset token
      resetPasswordExpires: undefined // Clear the expiration
    });

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Password reset successfully' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password reset error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}