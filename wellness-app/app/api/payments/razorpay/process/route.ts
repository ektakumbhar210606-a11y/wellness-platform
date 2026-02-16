import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PaymentModel, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import BookingModel from '@/models/Booking';
import CustomerModel from '@/models/Customer';
import UserModel from '@/models/User';

// Mock Razorpay payment simulation
const simulateRazorpayPayment = async (amount: number, customerData: { fullName?: string; email?: string; phone?: string; }) => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock payment details
  const paymentId = `rzp_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Simulate 90% success rate
  const isSuccess = Math.random() < 0.9;
  
  return {
    success: isSuccess,
    paymentId: isSuccess ? paymentId : null,
    orderId: orderId,
    amount: amount,
    currency: 'INR',
    status: isSuccess ? 'captured' : 'failed',
    customer: {
      name: customerData.fullName,
      email: customerData.email,
      contact: customerData.phone
    },
    timestamp: new Date().toISOString()
  };
};

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { bookingId, customerData, amount } = body;

    // Validate required fields
    if (!bookingId || !customerData || !amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking ID, customer data, and amount are required' 
        }, 
        { status: 400 }
      );
    }

    // Validate the booking exists
    const booking = await BookingModel.findById(bookingId).populate('service customer');
    if (!booking) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Booking not found' 
        }, 
        { status: 404 }
      );
    }

    // Simulate Razorpay payment
    const razorpayResponse = await simulateRazorpayPayment(amount, customerData);
    
    if (!razorpayResponse.success) {
      // Payment failed - store failed payment record
      const failedPayment = new PaymentModel({
        booking: bookingId,
        amount: amount,
        method: PaymentMethod.CreditCard,
        status: PaymentStatus.Failed,
        paymentDate: new Date()
      });
      
      await failedPayment.save();
      
      return NextResponse.json({
        success: false,
        message: 'Payment failed',
        data: {
          paymentId: null,
          orderId: razorpayResponse.orderId,
          status: 'failed',
          razorpayResponse: razorpayResponse
        }
      });
    }

    // Payment successful - create/update customer information
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

    // Create successful payment record
    const payment = new PaymentModel({
      booking: bookingId,
      amount: amount,
      method: PaymentMethod.CreditCard,
      status: PaymentStatus.Completed,
      paymentDate: new Date()
    });

    await payment.save();

    // Check if this is a business-assigned booking
    if (booking.assignedByAdmin) {
      // For business-assigned bookings, set response visibility to business only
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      booking.confirmedBy = booking.customer.toString();
      booking.responseVisibleToBusinessOnly = true;
      booking.therapistResponded = true;
    } else {
      // For direct customer bookings, make response visible to customer immediately
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      booking.confirmedBy = booking.customer.toString();
      booking.responseVisibleToBusinessOnly = false;
    }
    await booking.save();

    return NextResponse.json({
      success: true,
      message: 'Payment successful and booking confirmed',
      data: {
        paymentId: payment._id,
        razorpayPaymentId: razorpayResponse.paymentId,
        orderId: razorpayResponse.orderId,
        bookingId: booking._id,
        customerId: customer?._id,
        amount: amount,
        status: 'completed',
        razorpayResponse: razorpayResponse
      }
    });

  } catch (error: unknown) {
    console.error('Error processing Razorpay payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error instanceof Error) ? error.message : 'Failed to process payment' 
      }, 
      { status: 500 }
    );
  }
}