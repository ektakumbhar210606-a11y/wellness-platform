// Base route file for confirm API endpoints
// This file exists to satisfy Next.js App Router type requirements
// Actual confirmation logic is handled by the dynamic [bookingId] route

export async function GET() {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Booking ID required. Use /api/business/assigned-bookings/confirm/[bookingId]' 
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
      error: 'Booking ID required. Use /api/business/assigned-bookings/confirm/[bookingId]' 
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
      error: 'Booking ID required. Use /api/business/assigned-bookings/confirm/[bookingId]' 
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
      error: 'Booking ID required. Use /api/business/assigned-bookings/confirm/[bookingId]' 
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
      error: 'Booking ID required. Use /api/business/assigned-bookings/confirm/[bookingId]' 
    }),
    { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}