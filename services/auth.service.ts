import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types/database';

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(email: string, password: string) {
    const supabase = await createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check for specific error types
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email address before logging in. Check your inbox for the confirmation link.');
      }
      if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
        throw new Error('Invalid email or password. Please check your credentials and try again. If you just signed up, make sure you verified your email.');
      }
      if (error.message.includes('Email not found')) {
        throw new Error('No account found with this email. Please sign up first.');
      }
      throw new Error(error.message);
    }

    // Verify the user has a profile
    if (authData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Profile doesn't exist, sign them out
        await supabase.auth.signOut();
        throw new Error('Profile not found. Please contact support or sign up again.');
      }
    }

    return { user: authData.user, session: authData.session };
  }

  /**
   * Register new user
   */
  static async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const supabase = await createClient();

    // Validate required fields
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
      throw new Error('All fields are required');
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingProfile) {
      throw new Error('An account with this email already exists. Please login instead.');
    }

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('This email is already registered. If you deleted your profile, please contact support to fully remove your account.');
      }
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Wait for auth user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try using database function first (bypasses RLS)
    const { error: rpcError } = await supabase.rpc('create_profile', {
      p_id: authData.user.id,
      p_email: data.email,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_role: data.role,
    });

    if (rpcError) {
      // Fallback to direct insert if function doesn't exist
      console.log('RPC create_profile not found, trying direct insert:', rpcError.message);
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
      });

      if (profileError) {
        // Note: Cannot automatically clean up auth user without service role key
        // User will need to contact support or use a different email
        console.error('Profile creation failed:', profileError);
        throw new Error(
          'Failed to create user profile. Please try again or contact support if the issue persists. Error: ' + 
          profileError.message
        );
      }
    }

    return { 
      user: authData.user, 
      session: authData.session,
      requiresEmailConfirmation: !authData.session 
    };
  }

  /**
   * Logout current user
   */
  static async logout() {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    address?: string | null;
  }) {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string) {
    console.log('[AuthService] Starting password reset for:', email);
    const supabase = await createClient();

    if (!email) {
      throw new Error('Email is required');
    }

    // Use callback route for proper token handling
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`;
    console.log('[AuthService] Redirect URL:', redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[AuthService] Password reset error:', error);
      throw new Error(error.message);
    }

    console.log('[AuthService] Password reset email sent successfully');

    return { success: true };
  }

  /**
   * Update password (requires valid session)
   */
  static async updatePassword(password: string, confirmPassword: string) {
    const supabase = await createClient();

    if (!password || !confirmPassword) {
      throw new Error('All fields are required');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check for valid session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !user) {
      throw new Error('Your session has expired. Please request a new password reset link.');
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser() {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  }
}
