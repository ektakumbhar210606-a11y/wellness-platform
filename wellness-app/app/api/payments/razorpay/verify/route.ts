import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import PaymentModel, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import BookingModel from '@/models/Booking';
import CustomerModel from '@/models/Customer';
import UserModel from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            amount,
            customerData
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            return NextResponse.json(
                { success: false, error: 'Missing required payment verification details' },
                { status: 400 }
            );
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('Razorpay key secret is missing in environment variables');
            return NextResponse.json(
                { success: false, error: 'Payment configuration error: Missing API keys' },
                { status: 500 }
            );
        }

        // Check for placeholder keys to enable Mock Mode
        const isMockMode = secret.includes('placeholder') || razorpay_payment_id.startsWith('pay_mock_');

        if (isMockMode) {
            console.log('Mock Mode enabled: Skipping signature verification');
            // Proceed to update booking as confirmed
        } else {
            // Verify signature
            const bodyData = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(bodyData.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return NextResponse.json(
                    { success: false, error: 'Invalid payment signature' },
                    { status: 400 }
                );
            }
        }

        // Signature matches, payment is valid
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Create/Update Customer
        let customer = await CustomerModel.findOne({ user: booking.customer });

        if (!customer) {
            // Create new customer profile if it doesn't exist
            const user = await UserModel.findById(booking.customer);
            if (user) {
                customer = new CustomerModel({
                    user: booking.customer,
                    fullName: customerData?.fullName || user.name,
                    email: customerData?.email || user.email,
                    phoneNumber: customerData?.phone || user.phone,
                    onboardingCompleted: true,
                    // Initialize other required fields with defaults
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
            if (customerData?.fullName) customer.fullName = customerData.fullName;
            if (customerData?.email) customer.email = customerData.email;
            if (customerData?.phone) customer.phoneNumber = customerData.phone;
            await customer.save();
        }

        // Calculate partial payment amounts
        const totalAmount = booking.service?.price || amount;
        const advancePaid = amount; // The amount paid via Razorpay
        const remainingAmount = Math.max(0, totalAmount - advancePaid); // Remaining amount to be paid at venue

        // Create Payment Record
        const payment = new PaymentModel({
            booking: bookingId,
            amount: advancePaid, // Amount paid as advance
            totalAmount: totalAmount, // Total service amount
            advancePaid: advancePaid, // Amount paid as advance
            remainingAmount: remainingAmount, // Remaining amount to be paid at venue
            paymentType: 'ADVANCE', // Mark as advance payment
            method: PaymentMethod.CreditCard, // Razorpay
            status: PaymentStatus.Completed, // Advance payment completed
            paymentDate: new Date()
        });
        await payment.save();

        // Update Booking Status
        const updateData: any = {
          status: 'paid',
          confirmedAt: new Date(),
          confirmedBy: booking.customer.toString()
        };
        
        // Check if this is a business-assigned booking
        if (booking.assignedByAdmin) {
          // For business-assigned bookings, set response visibility to business only
          updateData.responseVisibleToBusinessOnly = true;
          updateData.therapistResponded = true;
        } else {
          // For direct customer bookings, make response visible to customer immediately
          updateData.responseVisibleToBusinessOnly = false;
        }
        
        await BookingModel.findByIdAndUpdate(bookingId, updateData);

        return NextResponse.json({
            success: true,
            message: 'Payment verified and booking confirmed',
            data: {
                paymentId: payment._id,
                bookingId: booking._id
            }
        });

    } catch (error: unknown) {
        console.error('Error verifying Razorpay payment:', error);
        return NextResponse.json(
            { success: false, error: (error instanceof Error) ? error.message : 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
