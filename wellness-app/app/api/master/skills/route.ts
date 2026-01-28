import { NextResponse } from 'next/server';
import { SKILLS_OPTIONS } from '@/lib/constants/skillsConstants';

export async function GET() {
  try {
    // Return the skills options as {id: string, label: string}[]
    const skillsData = SKILLS_OPTIONS.map(skill => ({
      id: skill.id,
      label: skill.label
    }));

    return NextResponse.json({
      success: true,
      data: skillsData,
      message: 'Skills options retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching skills options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch skills options',
        message: 'An error occurred while retrieving skills data'
      },
      { status: 500 }
    );
  }
}