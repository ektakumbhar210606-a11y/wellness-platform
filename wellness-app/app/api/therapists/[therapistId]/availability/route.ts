import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TherapistModel from '@/models/Therapist';
import TherapistAvailabilityModel, { TherapistAvailabilityStatus } from '@/models/TherapistAvailability';
import { requireCustomerAuth } from '@/lib/middleware/authMiddleware';

export async function GET(request: NextRequest, { params }: { params: { therapistId: string } }) {
  try {
    // Authenticate and authorize customer
    const authResult = await requireCustomerAuth(request);
    if (!authResult.authenticated) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { therapistId } = params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    
    if (!therapistId) {
      return Response.json(
        { success: false, error: 'Therapist ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify therapist exists
    const therapist = await TherapistModel.findById(therapistId);
    if (!therapist) {
      return Response.json(
        { success: false, error: 'Therapist not found' },
        { status: 404 }
      );
    }

    // Build query for available slots
    const query: any = {
      therapist: therapistId,
      status: TherapistAvailabilityStatus.Available
    };

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: targetDate,
        $lt: nextDay
      };
    } else {
      // Only show future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    // Fetch available slots
    const availableSlots = await TherapistAvailabilityModel.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(100); // Limit to prevent excessive data

    // Format response
    const formattedSlots = availableSlots.map((slot: any) => ({
      id: slot._id.toString(),
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      time: slot.startTime, // For backward compatibility
      duration: slot.duration
    }));

    return Response.json({
      success: true,
      data: {
        availableSlots: formattedSlots,
        count: formattedSlots.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching therapist availability:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}