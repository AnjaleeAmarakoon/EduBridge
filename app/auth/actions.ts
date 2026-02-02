'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types/database'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Check for specific error types
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address before logging in. Check your inbox for the confirmation link.' }
    }
    if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
      return { 
        error: 'Invalid email or password. Please check your credentials and try again. If you just signed up, make sure you verified your email.' 
      }
    }
    if (error.message.includes('Email not found')) {
      return { error: 'No account found with this email. Please sign up first.' }
    }
    return { error: error.message }
  }

  // Verify the user has a profile
  if (authData.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      // Profile doesn't exist, sign them out and show error
      await supabase.auth.signOut()
      return { error: 'Profile not found. Please contact support or sign up again.' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const role = formData.get('role') as UserRole

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !role) {
    return { error: 'All fields are required' }
  }

  // Check if profile already exists (in case user exists but profile was deleted)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return { error: 'An account with this email already exists. Please login instead.' }
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    // Handle specific error for user already registered
    if (authError.message.includes('already registered')) {
      return { error: 'This email is already registered. If you deleted your profile, please contact support to fully remove your account.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Wait a moment for the auth user to be fully created
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Create profile in the profiles table
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email: email,
    first_name: firstName,
    last_name: lastName,
    role: role,
  })

  if (profileError) {
    // If profile creation fails, clean up by deleting the auth user
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create profile: ' + profileError.message }
  }

  revalidatePath('/', 'layout')
  
  // Check if email confirmation is required
  if (authData.session) {
    // User is already logged in (email confirmation disabled)
    redirect('/dashboard')
  } else {
    // Email confirmation required
    redirect('/auth/login?message=Account created! Please check your email to verify your account before logging in.')
  }
}

export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const updates = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone: formData.get('phone') as string | null,
    address: formData.get('address') as string | null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
