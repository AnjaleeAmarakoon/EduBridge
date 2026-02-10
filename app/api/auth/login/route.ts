import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await AuthService.login(email, password);

    // Revalidate paths
    revalidatePath('/', 'layout');

    return NextResponse.json(
      { 
        success: true,
        user: result.user,
        redirectTo: '/dashboard'
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}
