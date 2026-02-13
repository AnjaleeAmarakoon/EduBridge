"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  const initialError = useMemo(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'link_expired') {
      return 'The password reset link has expired. Please request a new one.';
    }
    return null;
  }, [searchParams]);

  const [error, setError] = useState<string | null>(initialError);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  // Real-time email validation
  const emailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!emailValid) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Smart error messages
        if (response.status === 429 || data.errorType === 'rate_limit') {
          setError('Too many password reset attempts. Please wait 5-10 minutes before trying again. If you already received an email, check your spam folder.');
        } else if (response.status === 404) {
          setError('No account found with this email address.');
        } else {
          setError(data.error || 'Unable to send reset email. Please try again.');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError('Connection error. Please check your internet and try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl">
          <div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-medium">Email sent successfully!</p>
            <p className="text-sm mt-1">
              Please check your inbox and click the link to reset your password.
              The link will expire in 1 hour.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to login
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Didn&apos;t receive the email?</p>
            <button
              onClick={() => setSuccess(false)}
              className="font-medium text-blue-600 hover:text-blue-500 mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">EB</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-xl" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className={`border px-4 py-3 rounded relative ${
                error.toLowerCase().includes('too many') || error.toLowerCase().includes('wait')
                  ? 'bg-amber-50 border-amber-400 text-amber-800'
                  : 'bg-red-50 border-red-400 text-red-700'
              }`}>
                <div className="flex items-start">
                  {error.toLowerCase().includes('too many') || error.toLowerCase().includes('wait') ? (
                    <svg className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTouched(true);
                  }}
                  className={`appearance-none rounded relative block w-full px-3 py-2.5 pr-10 border ${
                    emailTouched
                      ? emailValid
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                        : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-400 text-gray-900 focus:outline-none focus:z-10 sm:text-sm transition-colors`}
                  placeholder="you@example.com"
                />
                {emailTouched && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {emailValid ? (
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {emailTouched && !emailValid && email.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !emailValid}
              className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Helpful tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check your spam/junk folder if you don&apos;t see the email</li>
                  <li>The reset link expires in 1 hour</li>
                  <li>You can only request a few resets per hour</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
