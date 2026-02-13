// Base route file for individual booking API endpoints
// This file exists to satisfy Next.js App Router type requirements
// Specific booking operations are handled by action-specific routes:
// - /api/business/assigned-bookings/confirm/[bookingId]
// - /api/business/assigned-bookings/cancel/[bookingId]
// - /api/business/assigned-bookings/reschedule/[bookingId]

export async function GET() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Specific action required. Use /api/business/assigned-bookings/confirm/[bookingId], /api/business/assigned-bookings/cancel/[bookingId], or /api/business/assigned-bookings/reschedule/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function POST() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Specific action required. Use /api/business/assigned-bookings/confirm/[bookingId], /api/business/assigned-bookings/cancel/[bookingId], or /api/business/assigned-bookings/reschedule/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function PATCH() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Specific action required. Use /api/business/assigned-bookings/confirm/[bookingId], /api/business/assigned-bookings/cancel/[bookingId], or /api/business/assigned-bookings/reschedule/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function PUT() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Specific action required. Use /api/business/assigned-bookings/confirm/[bookingId], /api/business/assigned-bookings/cancel/[bookingId], or /api/business/assigned-bookings/reschedule/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export async function DELETE() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Specific action required. Use /api/business/assigned-bookings/confirm/[bookingId], /api/business/assigned-bookings/cancel/[bookingId], or /api/business/assigned-bookings/reschedule/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}