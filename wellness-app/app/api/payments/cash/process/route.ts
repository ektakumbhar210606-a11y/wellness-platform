import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PaymentModel, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import BookingModel from '@/models/Booking';
import CustomerModel from '@/models/Customer';
import UserModel from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { bookingId, customerData, amount } = body;

        // Validate request
        if (!bookingId || !customerData || !amount) {
            return NextResponse.json(
                { success: false, error: 'Booking ID, customer data, and amount are required' },
                { status: 400 }
            );
        }

        // Verify Booking
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

        // Create Payment Record (Pending for Cash)
        const payment = new PaymentModel({
            booking: bookingId,
            amount: amount,
            method: PaymentMethod.Cash,
            status: PaymentStatus.Pending, // Cash payment is pending until collected
            paymentDate: new Date()
        });
        await payment.save();

        // Update Booking Status
        // For Cash, we might mark it as confirmed immediately or wait. 
        // Usually for appointments, "Confirmed" means the slot is booked. Payment can be collected later.
        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        booking.confirmedBy = booking.customer.toString();
        await booking.save();

        return NextResponse.json({
            success: true,
            message: 'Booking confirmed with Cash payment',
            data: {
                paymentId: payment._id,
                bookingId: booking._id
            }
        });

    } catch (error: any) {
        console.error('Error processing Cash payment:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process cash payment' },
            { status: 500 }
        );
    }
}
