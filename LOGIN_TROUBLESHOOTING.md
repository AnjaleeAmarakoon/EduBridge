# 🔧 Login Issues - Troubleshooting Guide

## Common Login Problems & Solutions

### 1. "Email not confirmed" Error

**Cause:** Supabase requires email verification by default.

**Solution A: Verify Your Email (Recommended for Production)**
1. Check your email inbox (and spam folder)
2. Click the verification link in the email from Supabase
3. Return to the login page and try again

**Solution B: Disable Email Confirmation (For Testing Only)**
1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Scroll down to **"Confirm email"**
4. Toggle it **OFF**
5. Click **Save**
6. Now you can login immediately after signup without email verification

⚠️ **Important:** Re-enable email confirmation before going to production!

---

### 2. "Invalid login credentials" Error

**Possible Causes:**
- Wrong email or password
- Account doesn't exist
- Typo in email address

**Solutions:**
1. Double-check your email and password
2. Try resetting your password
3. Make sure you completed signup successfully
4. Check if you received the signup confirmation email

---

### 3. "Profile not found" Error

**Cause:** Profile wasn't created properly during signup.

**Solution:**
1. Go to Supabase Dashboard → **Table Editor** → **profiles**
2. Check if your user profile exists
3. If not, try signing up again with a different email
4. Make sure you ran the correct database schema with all columns

---

### 4. Redirected Back to Login After Signing In

**Possible Causes:**
- Session not being saved properly
- Middleware configuration issue
- Browser blocking cookies

**Solutions:**

**A. Check Browser Cookies:**
- Make sure cookies are enabled
- Try in incognito/private mode
- Clear browser cache and cookies

**B. Check Supabase URL Configuration:**
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/*`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

**C. Verify Environment Variables:**
```bash
# Check your .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
- Restart dev server after changing env vars

---

### 5. "Row-level security policy" Error During Login

**Cause:** RLS policies might be too restrictive.

**Solution:**
Run this in Supabase SQL Editor:
```sql
-- Check current policies
select * from pg_policies where tablename = 'profiles';

-- If needed, ensure SELECT policy exists
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);
```

---

## Quick Diagnostic Steps

### Step 1: Test Your Credentials in Supabase Dashboard
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user account
3. Check the user's status:
   - ✅ Should show as "Confirmed" (or green checkmark)
   - ❌ If "Unconfirmed", you need to verify email

### Step 2: Check Profile Exists
1. Go to **Table Editor** → **profiles**
2. Find your user ID
3. Verify all columns have data:
   - ✅ id (matches auth.users id)
   - ✅ email
   - ✅ first_name
   - ✅ last_name
   - ✅ role (should be 'school_admin', 'donor', or 'volunteer')

### Step 3: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Try logging in
4. Look for any error messages
5. Share these errors if you need help

### Step 4: Test in Different Browser
- Try Chrome, Firefox, or Edge
- Use incognito/private mode
- This helps identify browser-specific issues

---

## Testing Workflow

### Complete Test Flow:
```
1. Sign Up
   ↓
2. Check Email & Verify (if required)
   ↓
3. Go to Login Page
   ↓
4. Enter Credentials
   ↓
5. Should Redirect to Dashboard
```

### If It Fails:
1. Check browser console for errors
2. Verify email confirmation status
3. Check Supabase logs: Dashboard → **Logs** → **Auth Logs**
4. Verify profile exists in database

---

## Supabase Configuration Checklist

### ✅ Required Settings:

**1. Authentication → Providers → Email:**
- [x] Enable email provider
- [ ] Confirm email (OFF for testing, ON for production)
- [x] Email OTP (optional)

**2. Authentication → URL Configuration:**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/*`

**3. Table Editor → profiles:**
- [x] Table exists
- [x] All columns present (id, email, first_name, last_name, role, phone, address, created_at, updated_at)
- [x] RLS enabled
- [x] Policies created

**4. SQL Editor:**
- [x] All triggers created (handle_updated_at)
- [x] All policies created (insert, select, update)

---

## Debug Mode

### Enable Detailed Errors:

Add this to your `.env.local`:
```bash
NEXT_PUBLIC_DEBUG=true
```

Then check:
1. Browser console for detailed logs
2. Terminal for server logs
3. Supabase Dashboard → Logs

---

## Still Having Issues?

### Collect This Information:
1. **Error Message:** Exact text from the error
2. **Browser Console:** Any errors shown in F12 console
3. **Supabase Logs:** Auth logs from dashboard
4. **User Status:** Is user "Confirmed" in Supabase?
5. **Profile Exists:** Check Table Editor for profile

### Quick Reset (Testing Only):
```sql
-- Delete user and profile to start fresh
delete from profiles where email = 'your-email@example.com';
-- Then delete user in Supabase Dashboard → Authentication → Users
-- Sign up again
```

---

## Success Checklist

When login works correctly, you should:
- ✅ Enter email and password
- ✅ Click "Sign in"
- ✅ See loading state briefly
- ✅ Get redirected to `/dashboard`
- ✅ See your name and profile info
- ✅ See role-specific content
- ✅ Be able to logout

If all these work: **Congratulations! Your auth is working!** 🎉
