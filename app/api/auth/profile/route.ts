import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function PUT(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, phone, address } = body;

    await AuthService.updateProfile(user.id, {
      first_name,
      last_name,
      phone,
      address,
    });

    // Revalidate dashboard
    revalidatePath('/dashboard');

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Profile update failed' },
      { status: 400 }
    );
  }
}
