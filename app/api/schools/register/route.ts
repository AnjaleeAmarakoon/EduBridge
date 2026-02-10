import { NextRequest, NextResponse } from 'next/server';
import { SchoolService } from '@/services/school.service';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, address, contact_person, phone, email } = body;

    if (!name || !type || !address || !contact_person) {
      return NextResponse.json(
        { error: 'Name, type, address, and contact person are required' },
        { status: 400 }
      );
    }

    const result = await SchoolService.registerSchool(user.id, {
      name,
      type,
      address,
      contact_person,
      phone,
      email,
    });

    // Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/requests/create');

    return NextResponse.json(
      { 
        success: true, 
        school: result.school,
        redirectTo: '/dashboard'
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'School registration failed' },
      { status: 400 }
    );
  }
}
