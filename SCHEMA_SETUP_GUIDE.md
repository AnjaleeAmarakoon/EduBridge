# 🚀 Quick Start: Apply Database Schema

## Option 1: Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Select your project: **edubridge**
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Copy and Paste Schema
1. Open `supabase-schema.sql` in VS Code
2. Select All (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)
4. Paste into Supabase SQL Editor
5. Click **Run** or press F5

### Step 3: Verify Tables
1. Click **Table Editor** in left sidebar
2. You should see all these tables:
   - ✅ profiles
   - ✅ schools
   - ✅ requests
   - ✅ request_responses
   - ✅ donations
   - ✅ volunteer_sessions
   - ✅ session_participants
   - ✅ conversations
   - ✅ conversation_participants
   - ✅ messages
   - ✅ notifications
   - ✅ ratings

### Step 4: Create Storage Buckets
1. Click **Storage** in left sidebar
2. Click **New bucket**
3. Create these buckets (make them public):
   - `request-images`
   - `donation-receipts`
   - `session-materials`
   - `chat-attachments`
   - `profile-photos`

---

## Option 2: Supabase CLI

### Step 1: Install Supabase CLI
```bash
# Windows (PowerShell)
scoop install supabase

# macOS
brew install supabase/tap/supabase

# npm (all platforms)
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
# Get your project reference ID from dashboard
supabase link --project-ref your-project-ref
```

### Step 4: Apply Schema
```bash
# Push the schema to Supabase
supabase db push --file supabase-schema.sql
```

---

## 📝 Test Data (Optional)

### Create Test Users
Run this in Supabase SQL Editor after applying schema:

```sql
-- Insert test profiles (after creating auth users manually via dashboard)
-- You'll need to replace these UUIDs with actual auth.users IDs

-- Test School Admin
INSERT INTO profiles (id, email, first_name, last_name, role, phone)
VALUES 
  ('replace-with-real-uuid', 'school@test.com', 'Jane', 'Smith', 'school_admin', '555-0101');

-- Test Donor
INSERT INTO profiles (id, email, first_name, last_name, role, phone)
VALUES 
  ('replace-with-real-uuid', 'donor@test.com', 'John', 'Doe', 'donor', '555-0102');

-- Test Volunteer
INSERT INTO profiles (id, email, first_name, last_name, role, phone)
VALUES 
  ('replace-with-real-uuid', 'volunteer@test.com', 'Sarah', 'Johnson', 'volunteer', '555-0103');

-- Test School
INSERT INTO schools (school_id, user_id, name, type, address, contact_person, phone, verified)
VALUES 
  (uuid_generate_v4(), 'school-admin-uuid', 'Sunrise School for the Blind', 'Blind', '123 Main St, New York, NY', 'Jane Smith', '555-0101', true);
```

### Create Test Requests
```sql
-- Test request for money
INSERT INTO requests (
  school_id, 
  title, 
  description, 
  category, 
  type, 
  urgency, 
  target_amount,
  students_impacted,
  deadline_date
)
VALUES (
  'school-uuid-here',
  'Braille Learning Materials',
  'We need funding to purchase Braille textbooks and learning materials for 45 students.',
  'Education Materials',
  'money',
  'High',
  5000.00,
  45,
  '2026-03-15'
);

-- Test request for volunteers
INSERT INTO requests (
  school_id, 
  title, 
  description, 
  category, 
  type, 
  urgency, 
  required_volunteers,
  students_impacted,
  deadline_date
)
VALUES (
  'school-uuid-here',
  'Math Tutoring Sessions',
  'We need volunteers to teach basic mathematics to our students.',
  'Volunteer Teaching',
  'volunteer',
  'Medium',
  3,
  30,
  '2026-04-01'
);
```

---

## ✅ Verification Checklist

After applying the schema, verify:

### Database Tables
- [ ] All 12 tables visible in Table Editor
- [ ] Each table has correct columns
- [ ] RLS is enabled (check Authentication > Policies)
- [ ] Triggers are created (check Database > Functions)

### Storage Buckets
- [ ] 5 storage buckets created
- [ ] Buckets are set to public (for images)
- [ ] You can upload a test file

### Test Queries
Run these to verify everything works:

```sql
-- Test: Can select from requests
SELECT * FROM requests;

-- Test: Profiles visible
SELECT * FROM profiles;

-- Test: Helper function exists
SELECT create_notification(
  'test-user-id'::uuid, 
  'Test', 
  'Test notification', 
  'system'
);
```

---

## 🔧 Troubleshooting

### Error: "extension uuid-ossp does not exist"
**Solution:** Enable UUID extension manually:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "permission denied for table"
**Solution:** Check RLS policies are correctly applied:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Error: "foreign key constraint"
**Solution:** Run schema in correct order (it's already ordered correctly in the file)

### Can't see tables in dashboard
**Solution:** Refresh page or try:
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🎯 Next Steps After Schema Application

1. ✅ Verify all tables created
2. ✅ Create storage buckets
3. ✅ Create test data (optional)
4. ✅ Test RLS policies
5. 🔲 Start building Request Management UI
6. 🔲 Connect forms to Supabase

---

## 📚 Helpful SQL Queries

### Check if schema applied correctly
```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 12

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Check RLS policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## 💡 Pro Tips

1. **Backup before major changes:** Use SQL Editor to export existing data
2. **Test RLS policies:** Try accessing data as different user roles
3. **Monitor performance:** Check slow queries in Supabase dashboard
4. **Use transactions:** Wrap related operations in transactions for data integrity
5. **Version control:** Keep schema changes in git for easy rollback

---

## ✨ You're Ready!

Once the schema is applied and verified, you can start building the frontend features. The database foundation is complete and ready for:
- ✅ Request management
- ✅ Donation processing  
- ✅ Session scheduling
- ✅ Real-time chat
- ✅ Notifications
- ✅ Ratings & feedback
- ✅ Admin analytics

**Recommended next step:** Create the request browsing page at `app/requests/page.tsx`
