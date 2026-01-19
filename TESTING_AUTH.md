# Testing Authentication - Step by Step

## Test 1: Create a Fresh Account

### Step 1: Sign Up with Test Credentials
1. Go to: http://localhost:3000/auth/signup
2. Use these test credentials:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `test123456` (use at least 6 characters)
   - Role: `Donor`
3. Click "Sign up"

### Step 2: Check What Happened
Go to Supabase Dashboard and verify:

**A. Check Auth User:**
- Authentication → Users
- Should see: `test@example.com`
- Status should be "Confirmed" (if email confirmation is disabled)

**B. Check Profile:**
- Table Editor → profiles  
- Should see a row with:
  - email: `test@example.com`
  - first_name: `Test`
  - last_name: `User`
  - role: `donor`

### Step 3: Try Logging In
1. Go to: http://localhost:3000/auth/login
2. Enter:
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "Sign in"

**Expected Result:**
- ✅ Should redirect to `/dashboard`
- ✅ Should see "Welcome back, Test!"
- ✅ Should see your profile information

**If it fails:**
- ❌ Note the exact error message
- ❌ Check browser console (F12)
- ❌ Continue to Test 2 below

---

## Test 2: Verify Email Confirmation Setting

### In Supabase Dashboard:
1. Go to: **Authentication** → **Providers** → **Email**
2. Check **"Confirm email"** setting
3. **For testing, turn it OFF**
4. Click **Save**
5. Try the signup and login flow again

---

## Test 3: Check Password Requirements

Supabase has minimum password requirements:
- ✅ At least 6 characters
- ✅ No maximum length

If you used a password shorter than 6 characters during signup, it may have failed silently.

**Fix:** Sign up again with a longer password.

---

## Test 4: Clear Everything and Start Fresh

If nothing works, let's reset:

### A. Delete Test User in Supabase
1. Authentication → Users
2. Find your test user
3. Click the three dots (⋮)
4. Click "Delete user"

### B. Delete Test Profile
1. Table Editor → profiles
2. Find the row with your email
3. Delete it

### C. Sign Up Again
- Use fresh credentials
- Use a strong password (8+ characters)
- Complete the signup process
- Check Supabase to confirm user + profile were created
- Try logging in

---

## Test 5: Manual Password Reset

If the password seems to be the issue:

### In Supabase Dashboard:
1. Authentication → Users
2. Find your user
3. Click the three dots (⋮)
4. Click "Send password reset email"
5. Check your email
6. Reset your password
7. Try logging in with the new password

---

## What to Check If Still Not Working

### 1. Browser Console Errors
- Press F12
- Go to Console tab
- Try logging in
- Look for red error messages
- Copy any errors you see

### 2. Network Tab
- Press F12
- Go to Network tab
- Try logging in
- Look for failed requests (red)
- Check the response for error details

### 3. Supabase Logs
- Dashboard → Logs → Auth Logs
- Look for recent login attempts
- Check for error messages

---

## Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong password or user doesn't exist | Double-check email/password, or reset password |
| "Email not confirmed" | Email verification required | Disable email confirmation or verify email |
| Redirects back to login | Session not saved | Check cookies enabled, verify .env.local |
| "Profile not found" | Profile table missing data | Check Table Editor, re-signup if needed |
| No error, just doesn't work | JavaScript error | Check browser console |

---

## Quick Diagnostic Commands

### Check if .env.local is correct:
```bash
# Windows PowerShell
Get-Content .env.local
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Restart dev server:
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Still Having Issues?

Please provide:
1. **Exact error message** you see
2. **Browser console errors** (F12 → Console)
3. **Does user exist in Supabase?** (Authentication → Users)
4. **Does profile exist?** (Table Editor → profiles)
5. **Email confirmation setting:** ON or OFF?

With this info, I can give you the exact fix! 🎯
