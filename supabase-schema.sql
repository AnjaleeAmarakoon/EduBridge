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
  postal_code text,
  contact_person text not null,
  phone text,
  email text,
  bank_account_details text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.schools enable row level security;

-- Profiles policies
-- Allow anyone to view profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Allow both authenticated and anonymous users to insert profiles during signup
create policy "Users can insert their own profile during signup"
  on profiles for insert
  to authenticated, anon
  with check (true);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Allow users to delete their own profile
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

-- ============================================
-- REQUESTS TABLE (School Needs)
-- ============================================
create table public.requests (
  request_id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(school_id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null check (category in ('Education Materials', 'Infrastructure', 'Technology', 'Volunteer Teaching', 'Special Equipment', 'Food & Nutrition', 'Healthcare', 'Other')),
  type text not null check (type in ('money', 'goods', 'volunteer')),
  urgency text not null check (urgency in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Fulfilled', 'Closed', 'Cancelled')),
  target_amount decimal(10, 2),
  raised_amount decimal(10, 2) default 0,
  required_items jsonb, -- For goods: [{item: "Books", quantity: 100, unit: "pieces"}]
  required_volunteers integer,
  volunteers_responded integer default 0,
  students_impacted integer,
  deadline_date date,
  image_url text,
  location text,
  priority_score integer default 0, -- For matching algorithm
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  fulfilled_at timestamp with time zone
);

-- ============================================
-- REQUEST RESPONSES (Interest Tracking)
-- ============================================
create table public.request_responses (
  response_id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests(request_id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  response_type text not null check (response_type in ('interested', 'committed', 'withdrawn')),
  message text,
  offered_amount decimal(10, 2),
  offered_items jsonb, -- For goods donations
  availability_dates jsonb, -- For volunteers: ["2026-02-10", "2026-02-15"]
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Rejected', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- DONATIONS TABLE
-- ============================================
create table public.donations (
  donation_id uuid default uuid_generate_v4() primary key,
  donor_id uuid references public.profiles(id) on delete cascade not null,
  request_id uuid references public.requests(request_id) on delete set null,
  school_id uuid references public.schools(school_id) on delete cascade not null,
  donation_type text not null check (donation_type in ('money', 'goods')),
  amount decimal(10, 2),
  items_donated jsonb, -- For goods: [{item: "Books", quantity: 50, condition: "New"}]
  payment_method text check (payment_method in ('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'cash')),
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded')),
  transaction_id text,
  status text not null default 'Pending' check (status in ('Pending', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled')),
  tracking_number text,
  delivery_date date,
  is_anonymous boolean default false,
  is_recurring boolean default false,
  recurring_frequency text check (recurring_frequency in ('monthly', 'quarterly', 'yearly')),
  tax_receipt_url text,
  message_to_school text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  delivered_at timestamp with time zone
);

-- ============================================
-- VOLUNTEER SESSIONS TABLE
-- ============================================
create table public.volunteer_sessions (
  session_id uuid default uuid_generate_v4() primary key,
  volunteer_id uuid references public.profiles(id) on delete cascade not null,
  school_id uuid references public.schools(school_id) on delete cascade not null,
  request_id uuid references public.requests(request_id) on delete set null,
  title text not null,
  description text not null,
  subject text not null,
  topic text,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  duration_hours decimal(4, 2),
  location text,
  session_type text not null check (session_type in ('In-Person', 'Virtual', 'Hybrid')),
  meeting_link text,
  max_students integer,
  registered_students integer default 0,
  status text not null default 'Proposed' check (status in ('Proposed', 'Approved', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled')),
  materials_needed text[],
  notes text,
  is_recurring boolean default false,
  recurring_pattern text, -- "weekly", "biweekly", etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- ============================================
-- SESSION PARTICIPANTS TABLE
-- ============================================
create table public.session_participants (
  participant_id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.volunteer_sessions(session_id) on delete cascade not null,
  student_name text,
  attendance_status text check (attendance_status in ('Registered', 'Attended', 'Absent', 'Late')),
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- MESSAGES/CHAT TABLE
-- ============================================
create table public.conversations (
  conversation_id uuid default uuid_generate_v4() primary key,
  title text,
  conversation_type text not null check (conversation_type in ('direct', 'group', 'request', 'session')),
  related_request_id uuid references public.requests(request_id) on delete set null,
  related_session_id uuid references public.volunteer_sessions(session_id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.conversation_participants (
  participant_id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(conversation_id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_read_at timestamp with time zone,
  unique(conversation_id, user_id)
);

create table public.messages (
  message_id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(conversation_id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'file', 'system')),
  attachment_url text,
  attachment_name text,
  attachment_size integer,
  is_edited boolean default false,
  edited_at timestamp with time zone,
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
create table public.notifications (
  notification_id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  notification_type text not null check (notification_type in ('request', 'donation', 'session', 'message', 'rating', 'system', 'reminder')),
  related_id uuid, -- ID of related request/donation/session/etc
  action_url text,
  is_read boolean default false,
  read_at timestamp with time zone,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- RATINGS AND FEEDBACK TABLE
-- ============================================
create table public.ratings (
  rating_id uuid default uuid_generate_v4() primary key,
  rater_id uuid references public.profiles(id) on delete cascade not null,
  ratee_id uuid references public.profiles(id) on delete cascade not null,
  related_session_id uuid references public.volunteer_sessions(session_id) on delete set null,
  related_donation_id uuid references public.donations(donation_id) on delete set null,
  rating_type text not null check (rating_type in ('session', 'donation', 'volunteer', 'school', 'donor')),
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  feedback_categories text[], -- ["punctual", "knowledgeable", "engaging", etc.]
  is_anonymous boolean default false,
  is_verified boolean default false, -- Verified by admin/system
  helpful_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger handle_requests_updated_at
  before update on requests
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_request_responses_updated_at
  before update on request_responses
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_donations_updated_at
  before update on donations
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_volunteer_sessions_updated_at
  before update on volunteer_sessions
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_conversations_updated_at
  before update on conversations
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_ratings_updated_at
  before update on ratings
  for each row
  execute procedure public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.requests enable row level security;
alter table public.request_responses enable row level security;
alter table public.donations enable row level security;
alter table public.volunteer_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.ratings enable row level security;

-- ============================================
-- REQUESTS POLICIES
-- ============================================
create policy "Requests are viewable by everyone"
  on requests for select
  using (true);

create policy "School admins can create requests for their school"
  on requests for insert
  with check (
    exists (
      select 1 from schools s
      join profiles p on s.user_id = p.id
      where s.school_id = requests.school_id
      and p.id = auth.uid()
      and p.role = 'school_admin'
    )
  );

create policy "School admins can update their school requests"
  on requests for update
  using (
    exists (
      select 1 from schools s
      join profiles p on s.user_id = p.id
      where s.school_id = requests.school_id
      and p.id = auth.uid()
      and p.role = 'school_admin'
    )
  );

create policy "School admins can delete their school requests"
  on requests for delete
  using (
    exists (
      select 1 from schools s
      join profiles p on s.user_id = p.id
      where s.school_id = requests.school_id
      and p.id = auth.uid()
      and p.role = 'school_admin'
    )
  );

-- ============================================
-- REQUEST RESPONSES POLICIES
-- ============================================
create policy "Request responses are viewable by related parties"
  on request_responses for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from requests r
      join schools s on r.school_id = s.school_id
      where r.request_id = request_responses.request_id
      and s.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create request responses"
  on request_responses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own responses"
  on request_responses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own responses"
  on request_responses for delete
  using (auth.uid() = user_id);

-- ============================================
-- DONATIONS POLICIES
-- ============================================
create policy "Donations viewable by donor, school, and admins"
  on donations for select
  using (
    auth.uid() = donor_id
    or exists (
      select 1 from schools s
      where s.school_id = donations.school_id
      and s.user_id = auth.uid()
    )
    or exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Donors can create donations"
  on donations for insert
  with check (
    auth.uid() = donor_id
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('donor', 'admin')
    )
  );

create policy "Donors and schools can update donations"
  on donations for update
  using (
    auth.uid() = donor_id
    or exists (
      select 1 from schools s
      where s.school_id = donations.school_id
      and s.user_id = auth.uid()
    )
  );

-- ============================================
-- VOLUNTEER SESSIONS POLICIES
-- ============================================
create policy "Sessions viewable by everyone"
  on volunteer_sessions for select
  using (true);

create policy "Volunteers can create sessions"
  on volunteer_sessions for insert
  with check (
    auth.uid() = volunteer_id
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'volunteer'
    )
  );

create policy "Volunteers and schools can update sessions"
  on volunteer_sessions for update
  using (
    auth.uid() = volunteer_id
    or exists (
      select 1 from schools s
      where s.school_id = volunteer_sessions.school_id
      and s.user_id = auth.uid()
    )
  );

create policy "Volunteers can delete their sessions"
  on volunteer_sessions for delete
  using (auth.uid() = volunteer_id);

-- ============================================
-- SESSION PARTICIPANTS POLICIES
-- ============================================
create policy "Participants viewable by session volunteer and school"
  on session_participants for select
  using (
    exists (
      select 1 from volunteer_sessions vs
      where vs.session_id = session_participants.session_id
      and vs.volunteer_id = auth.uid()
    )
    or exists (
      select 1 from volunteer_sessions vs
      join schools s on vs.school_id = s.school_id
      where vs.session_id = session_participants.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Schools can manage session participants"
  on session_participants for all
  using (
    exists (
      select 1 from volunteer_sessions vs
      join schools s on vs.school_id = s.school_id
      where vs.session_id = session_participants.session_id
      and s.user_id = auth.uid()
    )
  );

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================
create policy "Conversations viewable by participants"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversations.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create conversations"
  on conversations for insert
  with check (auth.uid() is not null);

-- ============================================
-- CONVERSATION PARTICIPANTS POLICIES
-- ============================================
create policy "Participants viewable by conversation members"
  on conversation_participants for select
  using (
    exists (
      select 1 from conversation_participants cp2
      where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
    )
  );

create policy "Users can join conversations"
  on conversation_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their participant record"
  on conversation_participants for update
  using (auth.uid() = user_id);

-- ============================================
-- MESSAGES POLICIES
-- ============================================
create policy "Messages viewable by conversation participants"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Senders can update their messages"
  on messages for update
  using (auth.uid() = sender_id);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- ============================================
-- RATINGS POLICIES
-- ============================================
create policy "Ratings viewable by rater, ratee, and public (non-anonymous)"
  on ratings for select
  using (
    auth.uid() = rater_id
    or auth.uid() = ratee_id
    or is_anonymous = false
  );

create policy "Authenticated users can create ratings"
  on ratings for insert
  with check (auth.uid() = rater_id);

create policy "Raters can update their own ratings"
  on ratings for update
  using (auth.uid() = rater_id);

create policy "Raters can delete their own ratings"
  on ratings for delete
  using (auth.uid() = rater_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to automatically update raised_amount when donation is completed
create or replace function update_request_raised_amount()
returns trigger as $$
begin
  if new.payment_status = 'Completed' and old.payment_status != 'Completed' then
    update requests
    set raised_amount = raised_amount + new.amount
    where request_id = new.request_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_request_raised_amount
  after update on donations
  for each row
  execute procedure update_request_raised_amount();

-- Function to update volunteers_responded count
create or replace function update_volunteers_responded()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update requests
    set volunteers_responded = volunteers_responded + 1
    where request_id = new.request_id
    and type = 'volunteer';
  elsif tg_op = 'DELETE' then
    update requests
    set volunteers_responded = greatest(0, volunteers_responded - 1)
    where request_id = old.request_id
    and type = 'volunteer';
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_volunteers_responded
  after insert or delete on request_responses
  for each row
  execute procedure update_volunteers_responded();

-- Function to create notification
create or replace function create_notification(
  p_user_id uuid,
  p_title text,
  p_content text,
  p_type text,
  p_related_id uuid default null,
  p_action_url text default null,
  p_priority text default 'normal'
)
returns uuid as $$
declare
  v_notification_id uuid;
begin
  insert into notifications (user_id, title, content, notification_type, related_id, action_url, priority)
  values (p_user_id, p_title, p_content, p_type, p_related_id, p_action_url, p_priority)
  returning notification_id into v_notification_id;
  
  return v_notification_id;
end;
$$ language plpgsql security definer;
