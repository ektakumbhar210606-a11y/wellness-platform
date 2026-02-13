// Use Node.js runtime instead of Edge runtime to support bcrypt
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import User from '../../../../models/User';
import crypto from 'crypto';
import EmailService from '../../../../app/utils/emailService';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!user) {
      // Return generic response regardless of whether user exists or not
      return NextResponse.json(
        { message: 'Password reset email sent if user exists' },
        { status: 200 }
      );
    }

    // Generate cryptographically secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Import bcrypt dynamically since it might not be available in edge runtime
    const bcrypt = await import('bcryptjs');
    
    // Hash the token using the same salt rounds as password hashing
    const saltRounds = 12;
    const hashedToken = await bcrypt.hash(resetToken, saltRounds);

    // Set token expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes in milliseconds

    // Update user with the hashed reset token and expiration time
    await User.findByIdAndUpdate(
      user._id,
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt
      }
    );

    // Send password reset email
    const emailService = new EmailService();
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      console.error(`Failed to send password reset email to: ${email}`);
      // Still return generic response to prevent user enumeration
      return NextResponse.json(
        { message: 'Password reset email sent if user exists' },
        { status: 200 }
      );
    }

    console.log(`Password reset email sent successfully to: ${email}`);

    // Return generic response to prevent user enumeration
    return NextResponse.json(
      { message: 'Password reset email sent if user exists' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Forgot password error:', error);

    // Handle specific error types
    if (error instanceof Error && error.name === 'ValidationError') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validationErrors = (Object.values((error as any).errors) as { message: string }[])
    .map(err => err.message);

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