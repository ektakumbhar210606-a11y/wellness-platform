import { NextResponse } from 'next/server';
import { EXPERTISE_OPTIONS } from '@/lib/constants/expertiseConstants';

export async function GET() {
  try {
    // Return the expertise options as {id: string, label: string}[]
    const expertiseData = EXPERTISE_OPTIONS.map(expertise => ({
      id: expertise.id,
      label: expertise.label
    }));

    return NextResponse.json({
      success: true,
      data: expertiseData,
      message: 'Expertise options retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching expertise options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch expertise options',
        message: 'An error occurred while retrieving expertise data'
      },
      { status: 500 }
    );
  }
}