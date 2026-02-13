/* eslint-disable @typescript-eslint/no-explicit-any */
// Use Node.js runtime instead of Edge runtime to support bcrypt
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import User from '../../../../../models/User';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get the token from URL parameters (params is a Promise in Next.js 13.4+)
    const resolvedParams = await params;
    const { token } = resolvedParams;

    // Validate token exists
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Invalid or missing token provided:', { token, type: typeof token });
      return NextResponse.json(
        { error: 'Invalid or missing reset token' },
        { status: 400 }
      );
    } else {
      console.log('Received token for validation (first 10 chars):', token.substring(0, 10) + '...');
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }
    
    const { password } = body;
    
    console.log('Extracted password from body:', password);
    
    // Validate that password exists in the request body
    if (password === undefined) {
      console.log('Password field is undefined in request body');
      return NextResponse.json(
        { error: 'Password field is required in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate password format
    console.log('Validating password:', password);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Password validation failed. Password:', password, 'Regex test result:', passwordRegex.test(password));
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      );
    } else {
      console.log('Password validation passed');
    }

    // Import bcrypt dynamically
    let bcrypt;
    try {
      bcrypt = await import('bcryptjs');
    } catch (importError) {
      console.error('Error importing bcryptjs:', importError);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return NextResponse.json(
        { error: 'Password processing error' },
        { status: 500 }
      );
    }

    console.log('Attempting to find user with token...');
    
    // Find user with the matching reset token (without using find with $where)
    // Instead, query all users with valid reset tokens and manually compare
    const usersWithTokens = await User.find({
      resetPasswordToken: { $exists: true, $ne: null },
      resetPasswordExpires: { $gt: new Date() } // Check that token hasn't expired
    }).select('+resetPasswordToken');

    console.log(`Found ${usersWithTokens.length} users with valid reset tokens`);

    let matchedUser = null;
    let comparisonCount = 0;

    // Manually compare tokens using bcrypt
    for (const user of usersWithTokens) {
      comparisonCount++;
      
      if (user.resetPasswordToken && typeof user.resetPasswordToken === 'string') {
        try {
          console.log(`Comparing token for user: ${user.email}`);
          const isMatch = await bcrypt.compare(token, user.resetPasswordToken);
          
          if (isMatch) {
            console.log(`Token matched for user: ${user.email}`);
            matchedUser = user;
            break;
          } else {
            console.log(`Token did not match for user: ${user.email}`);
          }
        } catch (compareError) {
          console.error('Error comparing token for user:', user.email, compareError);
          continue;
        }
      }
    }

    console.log(`Completed ${comparisonCount} token comparisons`);
    
    if (!matchedUser) {
      console.log('No matching token found in database');
      console.log('Available tokens in DB (first 10 chars):', 
        usersWithTokens.map(u => u.resetPasswordToken ? u.resetPasswordToken.substring(0, 10) + '...' : 'null')
      );
      
      // Check if there are expired tokens for debugging
      const expiredCheck = await User.countDocuments({
        resetPasswordExpires: { $lt: new Date() }
      });
      console.log(`Found ${expiredCheck} expired tokens in database`);
      
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 401 }
      );
    }

    // Update user's password and clear reset token fields
    console.log('Updating password for user:', matchedUser.email);
    try {
      await User.findByIdAndUpdate(matchedUser._id, {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      });

      console.log('Password updated successfully for:', matchedUser.email);
    } catch (updateError) {
      console.error('Error updating user password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Password reset successfully' 
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Password reset error:', error);

    // Handle specific error types
if (error instanceof Error && error.name === 'ValidationError') {
  const validationErrors = (Object.values((error as any).errors) as { message: string }[])
    .map(err => err.message);

  return NextResponse.json(
    { error: 'Validation failed', details: validationErrors },
    { status: 400 }
  );
}


    // Log the full error for debugging
    console.error('Full error details:', error);
    
    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}