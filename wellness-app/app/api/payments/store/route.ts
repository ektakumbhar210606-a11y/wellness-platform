import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PaymentModel, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import BookingModel from '@/models/Booking';
import CustomerModel from '@/models/Customer';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { bookingId, customerData, paymentData } = body;

    // Validate required fields
    if (!bookingId || !customerData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking ID and customer data are required' 
        }, 
        { status: 400 }
      );
    }

    // Validate the booking exists
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking not found' 
        }, 
        { status: 404 }
      );
    }

    // Get the service price from the booking
    const servicePrice = booking.service.price || 0;

    // Create or update customer information
    let customer = await CustomerModel.findOne({ user: booking.customer });
    
    if (!customer) {
      // Create new customer profile if it doesn't exist
      const user = await UserModel.findById(booking.customer);
      if (user) {
        customer = new CustomerModel({
          user: booking.customer,
          fullName: customerData.fullName || user.name,
          email: customerData.email || user.email,
          phoneNumber: customerData.phone || user.phone,
          onboardingCompleted: true,
          preferences: [],
          preferredTherapies: [],
          wellnessGoals: '',
          wellnessGoalsList: [],
          lifestyleFactors: [],
          medicalInfo: {
            conditions: [],
            allergies: [],
            medications: [],
            notes: '',
            lastUpdated: new Date()
          },
          wellnessHistory: [],
          totalAppointments: 0,
          totalServicesUsed: 0,
          avgRating: 0,
          favoriteTherapists: [],
          favoriteServices: [],
          communicationPreferences: {
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false
          },
          privacySettings: {
            profileVisibility: 'private',
            appointmentHistoryVisibility: 'private'
          }
        });
        await customer.save();
      }
    } else {
      // Update existing customer information
      if (customerData.fullName) customer.fullName = customerData.fullName;
      if (customerData.email) customer.email = customerData.email;
      if (customerData.phone) customer.phoneNumber = customerData.phone;
      await customer.save();
    }

    // Create payment record
    const payment = new PaymentModel({
      booking: bookingId,
      amount: servicePrice,
      method: paymentData?.method || PaymentMethod.CreditCard, // Default to credit card
      status: PaymentStatus.Pending, // Default to pending status
      paymentDate: new Date()
    });

    await payment.save();

    // Update booking status to confirmed
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    booking.confirmedBy = booking.customer.toString(); // Customer confirmed their own booking
    await booking.save();

    return NextResponse.json({
      success: true,
      message: 'Payment information stored successfully',
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        customerId: customer?._id,
        amount: servicePrice,
        status: payment.status
      }
    });

  } catch (error: any) {
    console.error('Error storing payment data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to store payment data' 
      }, 
      { status: 500 }
    );
  }
}