'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || !confirmPassword) {
    return { error: 'All fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  // Check if user has a valid session
  const { data: { user }, error: sessionError } = await supabase.auth.getUser()
  
  if (sessionError || !user) {
    return { error: 'Your session has expired. Please request a new password reset link.' }
  }

  const { data, error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: `Failed to update password: ${error.message}` }
  }

  if (!data.user) {
    return { error: 'Failed to update password. Please try again.' }
  }

  // Sign out to clear the recovery session
  await supabase.auth.signOut()

  redirect('/auth/login?message=Password updated successfully! Please log in with your new password.')
}
