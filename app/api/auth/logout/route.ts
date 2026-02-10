import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    await AuthService.logout();

    // Revalidate paths
    revalidatePath('/', 'layout');

    return NextResponse.json(
      { 
        success: true,
        redirectTo: '/auth/login'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      { status: 500 }
    );
  }
}
