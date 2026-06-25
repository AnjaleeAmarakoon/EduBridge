-- ==========================================
-- EDUBRIDGE SYSTEM ADMINISTRATION DB SETUP
-- ==========================================
-- Run this script in the Supabase SQL Editor.
-- Make sure to change 'admin@edubridge.lk' to the actual email of your registered account.

-- 1. ELEVATE USER ACCOUNT TO ADMIN
-- NOTE: Please sign up first through the UI before running this.
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@edubridge.lk';

-- 2. SCHOOLS RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can update all schools" ON public.schools;
CREATE POLICY "Admins can update all schools" ON public.schools
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. REQUESTS RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can update all requests" ON public.requests;
CREATE POLICY "Admins can update all requests" ON public.requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all requests" ON public.requests;
CREATE POLICY "Admins can delete all requests" ON public.requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. VOLUNTEER SESSIONS RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can update all volunteer sessions" ON public.volunteer_sessions;
CREATE POLICY "Admins can update all volunteer sessions" ON public.volunteer_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all volunteer sessions" ON public.volunteer_sessions;
CREATE POLICY "Admins can delete all volunteer sessions" ON public.volunteer_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. PROFILES RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 6. REQUEST RESPONSES RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can select all request responses" ON public.request_responses;
CREATE POLICY "Admins can select all request responses" ON public.request_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all request responses" ON public.request_responses;
CREATE POLICY "Admins can update all request responses" ON public.request_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all request responses" ON public.request_responses;
CREATE POLICY "Admins can delete all request responses" ON public.request_responses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. SESSION PARTICIPANTS RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can select all session participants" ON public.session_participants;
CREATE POLICY "Admins can select all session participants" ON public.session_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 8. DONATIONS RLS POLICIES FOR ADMIN
DROP POLICY IF EXISTS "Admins can update all donations" ON public.donations;
CREATE POLICY "Admins can update all donations" ON public.donations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all donations" ON public.donations;
CREATE POLICY "Admins can delete all donations" ON public.donations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
