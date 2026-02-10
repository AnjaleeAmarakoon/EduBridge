import { NextRequest, NextResponse } from 'next/server';
import { SchoolService } from '@/services/school.service';
import { AuthService } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const school = await SchoolService.getSchoolByUserId(user.id);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found', needsRegistration: true },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { school },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get school' },
      { status: 500 }
    );
  }
}
