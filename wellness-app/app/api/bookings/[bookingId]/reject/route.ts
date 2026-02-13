import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking, { BookingStatus } from '@/models/Booking';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectToDatabase();

    const { bookingId } = await params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    booking.status = BookingStatus.Cancelled;
    await booking.save();

    return NextResponse.json(booking, { status: 200 });
  } catch (error: unknown) {
    console.error('Error rejecting booking:', error);
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid booking ID format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
