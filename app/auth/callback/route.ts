import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type CookieOptions = {
  name: string
  value: string
  options?: {
    path?: string
    domain?: string
    maxAge?: number
    expires?: Date
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  console.log('[Callback] Full URL:', requestUrl.toString());
  
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  
  console.log('[Callback] Params:', { token_hash, type, code, next });
  
  // Check if there's an error from Supabase (expired link, etc.)
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  
  if (error) {
    // Handle expired or invalid links
    if (error === 'access_denied' || error_description?.includes('expired')) {
      return NextResponse.redirect(
        new URL('/auth/forgot-password?error=link_expired', request.url)
      )
    }
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_link', request.url)
    )
  }

  const cookieStore = await cookies()
  
  // Store cookies that will be set by Supabase
  const cookiesToSet: CookieOptions[] = []
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(newCookies: CookieOptions[]) {
          // Store cookies to be set later
          cookiesToSet.push(...newCookies)
          // Set them in the cookie store
          newCookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options ?? {})
          })
        },
      },
    }
  )

  // Handle email verification with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      // Set all auth cookies in the redirect response
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options ?? {})
      })
      return redirectResponse
    }
    
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
  }

  // Handle password reset with token_hash
  if (token_hash && type) {
    console.log('[Callback] Verifying OTP for password reset...');
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    console.log('[Callback] Verify OTP result:', { error });

    if (!error) {
      if (type === 'recovery') {
        console.log('[Callback] Redirecting to reset password page...');
        // Create redirect response with auth cookies - just redirect to the form, session is already set
        const redirectResponse = NextResponse.redirect(new URL('/auth/reset-password?verified=true', request.url))
        // Set all auth cookies in the redirect response
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options ?? {})
        })
        return redirectResponse
      }
      const redirectResponse = NextResponse.redirect(new URL(next, request.url))
      cookiesToSet.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options ?? {})
      })
      return redirectResponse
    }
    
    // If there's an error, redirect with error message
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_link', request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/auth/login?error=invalid_link', request.url)
  )
}
