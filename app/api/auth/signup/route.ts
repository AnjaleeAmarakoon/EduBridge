import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  let body;
  
  try {
    // Parse request body
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('Signup attempt for:', email, 'with role:', role);

    const result = await AuthService.signup({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    console.log('Signup successful:', email);

    // Revalidate paths
    revalidatePath('/', 'layout');

    if (result.requiresEmailConfirmation) {
      return NextResponse.json(
        {
          success: true,
          message: 'Account created! Please check your email to verify your account before logging in.',
          requiresEmailConfirmation: true,
          redirectTo: '/auth/login'
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        redirectTo: '/dashboard'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
}
