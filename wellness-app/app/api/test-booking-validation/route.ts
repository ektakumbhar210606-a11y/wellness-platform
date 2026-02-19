import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import BookingModel from '@/models/Booking';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Test creating a booking with 'paid' status
    const testBooking = new BookingModel({
      customer: '666f6f2d6261722d62617a',
      therapist: '666f6f2d6261722d74686572', 
      service: '666f6f2d6261722d73657276',
      date: new Date('2024-12-31'),
      time: '10:00',
      status: 'paid',
      confirmedBy: 'test-user-id',
      confirmedAt: new Date(),
      responseVisibleToBusinessOnly: false,
      paymentStatus: 'completed'
    });
    
    await testBooking.save();
    
    // Test updating an existing booking to 'paid' status
    testBooking.status = 'paid';
    testBooking.paymentStatus = 'completed';
    await testBooking.save();
    
    // Clean up
    await BookingModel.findByIdAndDelete(testBooking._id);
    
    return NextResponse.json({
      success: true,
      message: 'Booking validation test passed - "paid" status works correctly'
    });
    
  } catch (error: any) {
    console.error('Booking validation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}