# 🚀 EduBridge Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Supabase

1. **Create a Supabase account** at https://supabase.com
2. **Create a new project**
3. **Get your credentials:**
   - Go to: Settings → API
   - Copy: Project URL and anon/public key

4. **Create `.env.local` file:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Set Up Database

1. Go to Supabase SQL Editor
2. Copy and paste contents from `supabase-schema.sql`
3. Click "Run"

### Step 4: Run the App
```bash
npm run dev
```

Visit: http://localhost:3000/auth/signup

---

## ✅ What You Can Do Now

### 1. Sign Up
- Go to `/auth/signup`
- Enter: First Name, Last Name, Email, Password
- Select Role: School Admin, Donor, or Volunteer
- Click "Sign up"
- Check email for verification link

### 2. Log In
- Go to `/auth/login`
- Enter your credentials
- Click "Sign in"

### 3. Access Dashboard
- Automatically redirected after login
- View your profile information
- See role-specific quick actions
- Click "Logout" to sign out

---

## 🎯 User Stories Implemented

✅ **EDU-101**: Role selection during signup  
✅ **EDU-102**: Complete registration with email, first name, last name, password  
✅ **EDU-103**: Secure login with protected dashboard  
✅ **EDU-106**: Logout functionality

---

## 📁 Key Files

- **`app/auth/login/page.tsx`** - Login form
- **`app/auth/signup/page.tsx`** - Signup form  
- **`app/auth/actions.ts`** - Server actions for auth
- **`app/dashboard/page.tsx`** - Protected dashboard
- **`middleware.ts`** - Route protection
- **`lib/supabase/`** - Supabase client configuration
- **`lib/types/database.ts`** - TypeScript types

---

## 🔒 Security Features

✅ Server-side authentication  
✅ Password requirements (min 6 characters)  
✅ Email verification  
✅ Protected routes via middleware  
✅ Row Level Security in database  
✅ CSRF protection  
✅ Secure session management

---

## 🐛 Troubleshooting

### "Invalid API key"
- Check `.env.local` file exists
- Verify variable names start with `NEXT_PUBLIC_`
- Restart dev server: `npm run dev`

### "Relation does not exist"
- Run `supabase-schema.sql` in Supabase SQL Editor
- Verify tables created in Table Editor

### Email not received
- Check spam folder
- For testing: Disable email confirmation in Supabase Auth settings
- Check Supabase Auth → Email Templates

### Dashboard not accessible
- Clear browser cookies
- Log out and log in again
- Check browser console for errors

---

## 📖 Full Documentation

For detailed information, see:
- **`AUTHENTICATION_SETUP.md`** - Complete setup guide
- **`CODE_REVIEW.md`** - Code improvements and fixes
- **`supabase-schema.sql`** - Database schema

---

## 🎉 You're Ready!

Your authentication system is now:
- ✅ Secure and production-ready
- ✅ Type-safe with TypeScript
- ✅ Following Next.js 15 best practices
- ✅ Meeting all user story requirements

**Next steps:**
1. Test signup and login flow
2. Implement EDU-104: School profile completion
3. Implement EDU-105: Profile editing

Happy coding! 🚀
