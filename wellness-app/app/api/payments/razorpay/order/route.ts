import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { bookingId, amount } = body;

        if (!bookingId || !amount) {
            return NextResponse.json(
                { success: false, error: 'Booking ID and amount are required' },
                { status: 400 }
            );
        }

        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Calculate advance amount (50% of total)
        const advanceAmount = Math.round(amount * 0.5);

        // Initialize Razorpay inside the handler to gracefully handle missing keys
        // or environment loading issues
        const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.error('Razorpay keys are missing in environment variables');
            return NextResponse.json(
                { success: false, error: 'Payment configuration error: Missing API keys' },
                { status: 500 }
            );
        }

        // Check for placeholder keys to enable Mock Mode
        const isMockMode = key_id.includes('placeholder') || key_secret.includes('placeholder');

        if (isMockMode) {
            console.log('Mock Mode enabled: Skipping Razorpay order creation');
            return NextResponse.json({
                success: true,
                order: {
                    id: `order_mock_${Date.now()}`,
                    amount: Math.round(advanceAmount * 100), // Send only advance amount to Razorpay
                    currency: 'INR',
                },
                key: 'rzp_test_mock_key',
                isMock: true
            });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // Create Razorpay order
        const options = {
            amount: Math.round(advanceAmount * 100), // Send only advance amount to Razorpay (in paise)
            currency: 'INR',
            receipt: `receipt_${bookingId}`,
            payment_capture: 1, // Auto capture
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            order,
            key: key_id,
            advanceAmount, // Return the calculated advance amount for reference
            totalAmount: amount // Return the total amount for reference
        });

    } catch (error: unknown) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { success: false, error: (error instanceof Error) ? error.message : 'Failed to create order' },
            { status: 500 }
        );
    }
}
