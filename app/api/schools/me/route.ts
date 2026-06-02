import { NextRequest, NextResponse } from 'next/server';
import { SchoolService } from '@/services/school.service';
import { AuthService } from '@/services/auth.service';

export async function GET() {
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

export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { schoolName, email, phone, postalCode, bankAccountDetails } = await request.json();

    // Get the school first
    const school = await SchoolService.getSchoolByUserId(user.id);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Update school information
    const updatedSchool = await SchoolService.updateSchool(user.id, school.school_id, {
      name: schoolName,
      address: school.address, // Keep existing address
      contact_person: school.contact_person, // Keep existing contact person
      type: school.type, // Keep existing type
      phone,
      email,
      postal_code: postalCode || null,
      bank_account_details: bankAccountDetails || null,
    });

    return NextResponse.json(
      { ...updatedSchool, message: 'School profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('School update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update school' },
      { status: 500 }
    );
  }
}
