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
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieOptions[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options ?? {})
          })
          // Also set in response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          )
        },
      },
    }
  )

  // Handle email verification with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      response = NextResponse.redirect(new URL('/dashboard', request.url))
      return response
    }
    
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
  }

  // Handle password reset with token_hash
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      if (type === 'recovery') {
        // Redirect to reset password page with cookies set
        response = NextResponse.redirect(new URL('/auth/reset-password', request.url))
        return response
      }
      response = NextResponse.redirect(new URL(next, request.url))
      return response
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
