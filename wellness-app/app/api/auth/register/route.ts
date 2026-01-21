// Use Node.js runtime instead of Edge runtime to support jsonwebtoken
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import User from '../../../../models/User';
import TherapistModel from '../../../../models/Therapist';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { email, password, role } = body;

    // Validate required fields for all roles
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Validate phone number if provided
    if (body.phone && !/^[+]?[1-9]\d{1,14}$/.test(body.phone)) {
      return NextResponse.json(
        { error: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }
    
    // Validate role strictly (must be exactly 'Customer', 'Business', or 'Therapist' - case-sensitive)
    const validRoles = ['Customer', 'Business', 'Therapist'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Valid roles are: Customer, Business, Therapist' },
        { status: 400 }
      );
    }
    
    // Implement role-specific field validation
    let nameForUser = '';
    if (role === 'Customer') {
      if (!body.full_name) {
        return NextResponse.json(
          { error: 'full_name is required for Customer role' },
          { status: 400 }
        );
      }
      nameForUser = body.full_name;
    } else if (role === 'Business') {
      if (!body.business_name || !body.owner_full_name) {
        return NextResponse.json(
          { error: 'business_name and owner_full_name are required for Business role' },
          { status: 400 }
        );
      }
      nameForUser = body.business_name; // Use business name as the user's name field
    } else if (role === 'Therapist') {
      if (!body.full_name || !body.professional_title) {
        return NextResponse.json(
          { error: 'full_name and professional_title are required for Therapist role' },
          { status: 400 }
        );
      }
      nameForUser = body.full_name;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('_id');
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 } // Conflict status code
      );
    }

    // Import bcrypt and jwt dynamically since it might not be available in edge runtime
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name: nameForUser,
      email,
      password: hashedPassword,
      role,
      phone: body.phone || null,
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Create therapist profile if role is 'Therapist'
    if (role === 'Therapist') {
      try {
        // Check if therapist profile already exists to prevent duplicates
        const existingTherapist = await TherapistModel.findOne({ user: savedUser._id });
        
        if (!existingTherapist) {
          // Create new therapist profile linked to the user
          const newTherapist = new TherapistModel({
            user: savedUser._id,
            business: null, // Initially no business association
            experience: 0, // Default experience
            expertise: [], // No initial expertise
            rating: 0, // Default rating
            availabilityStatus: 'available', // Default availability
                    
            // Profile information (initially empty)
            fullName: body.full_name || '',
            email: savedUser.email,
            phoneNumber: body.phone || '',
            professionalTitle: body.professional_title || '',
            bio: '',
            location: {},
            certifications: [],
            licenseNumber: '',
            weeklyAvailability: []
          });
          
          await newTherapist.save();
          console.log(`Therapist profile created for user: ${savedUser._id}`);
        }
      } catch (therapistError: any) {
        // Log the error but don't fail the registration
        console.error('Error creating therapist profile:', therapistError);
      }
    }

    // Generate JWT token with user ID, email and role
    const token = jwt.sign(
      { 
        id: savedUser._id.toString(), 
        email: savedUser.email,
        role: savedUser.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return success response without password
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      phone: savedUser.phone,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: userResponse,
        token: token
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key error (MongoDB error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}