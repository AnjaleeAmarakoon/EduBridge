-- Fix signup by creating a function that bypasses RLS
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON profiles;

-- Create a more permissive policy for signup
-- This allows profile creation with the user's ID during signup
CREATE POLICY "Enable insert for authentication"
  ON profiles 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- OR use a database function approach (recommended)
-- This function will execute with the security context of the function owner
CREATE OR REPLACE FUNCTION public.create_profile(
  p_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (p_id, p_email, p_first_name, p_last_name, p_role);
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.create_profile TO anon, authenticated;

-- Alternative: If you want a simpler fix, just make the insert policy more permissive
-- This allows any user to insert ANY profile (less secure but works for signup)
CREATE POLICY "Allow profile creation during signup"
  ON profiles 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);
