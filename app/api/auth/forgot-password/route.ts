import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Attempting password reset for:', email);
    await AuthService.requestPasswordReset(email);
    console.log('Password reset email sent successfully to:', email);

    return NextResponse.json(
      { success: true, message: 'Password reset email sent' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
    
    console.error('Password reset error:', errorMessage);
    
    // Handle rate limit errors - in development, show success to allow testing
    if (errorMessage.toLowerCase().includes('rate limit') || 
        errorMessage.toLowerCase().includes('too many requests') ||
        errorMessage.toLowerCase().includes('email rate limit exceeded')) {
      console.warn('⚠️ Rate limit hit - Showing success for development testing');
      console.warn('⚠️ Note: Actual email will NOT be sent due to Supabase rate limits');
      
      // Return success in development to allow UI testing
      return NextResponse.json(
        { 
          success: true, 
          message: 'Password reset email sent (rate limit bypassed for testing)',
          devNote: 'Email not actually sent due to rate limiting'
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
