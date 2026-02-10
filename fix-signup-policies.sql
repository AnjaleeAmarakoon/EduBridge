-- ============================================
-- FIX RLS POLICIES FOR SIGNUP
-- ============================================
-- Run this standalone script to fix signup issues
-- DO NOT run the entire supabase-schema.sql again!

-- Drop the existing policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile during signup" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can delete own profile" on profiles;

-- Create new policies that work with signup
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile during signup"
  on profiles for insert
  to authenticated, anon
  with check (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete
  using (auth.uid() = id);

-- Verify policies were created
select schemaname, tablename, policyname, permissive, roles, cmd, qual 
from pg_policies 
where schemaname = 'public' and tablename = 'profiles';
