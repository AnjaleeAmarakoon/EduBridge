-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('school_admin', 'donor', 'volunteer', 'admin')),
  phone text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create schools table
create table public.schools (
  school_id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('Blind', 'Deaf', 'Rural')),
  address text not null,
  contact_person text not null,
  phone text,
  email text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.schools enable row level security;

-- Profiles policies
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

-- Schools policies
create policy "Schools are viewable by everyone"
  on schools for select
  using (true);

create policy "School admins can insert their own school"
  on schools for insert
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'school_admin'
    )
  );

create policy "School admins can update their own school"
  on schools for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'school_admin'
    )
  );

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on profiles
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_schools_updated_at
  before update on schools
  for each row
  execute procedure public.handle_updated_at();
