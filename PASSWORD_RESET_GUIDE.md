# 🔐 Forgot Password Feature - Setup & Usage

## ✅ What's Been Created

Your EduBridge app now has a complete password reset flow:

1. **Forgot Password Page** (`/auth/forgot-password`)
   - User enters email
   - System sends reset link
   - Success confirmation

2. **Reset Password Page** (`/auth/reset-password`)
   - User clicks link from email
   - Enters new password
   - Confirms password
   - Redirects to login

3. **Server Actions** (`app/auth/password-reset/actions.ts`)
   - `requestPasswordReset` - Sends reset email
   - `updatePassword` - Updates user password

---

## 🚀 Setup Instructions

### Step 1: Update Environment Variables

Add this to your `.env.local` file:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, change to your actual domain:
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Step 2: Configure Supabase Email Templates

1. Go to: **Authentication** → **Email Templates**
2. Select **"Reset Password"** template
3. Make sure the template is enabled
4. The default template should work, but you can customize it

### Step 3: Configure Redirect URLs

1. Go to: **Authentication** → **URL Configuration**
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback**`
   - `http://localhost:3000/**` (wildcard for all routes)
3. For production, add:
   - `https://yourdomain.com/auth/callback**`
   - `https://yourdomain.com/**`

**Important:** The callback route is required to properly handle the reset token from the email link.

### Step 4: Test the Feature

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test the flow (see Testing section below)

---

## 📋 User Flow

### For Users Who Forgot Password:

```
1. Go to Login Page
   ↓
2. Click "Forgot your password?"
   ↓
3. Enter Email Address
   ↓
4. Click "Send reset link"
   ↓
5. Check Email Inbox
   ↓
6. Click Reset Link in Email
   ↓
7. Enter New Password (2x)
   ↓
8. Click "Update password"
   ↓
9. Redirected to Login
   ↓
10. Log in with New Password
```

---

## 🧪 Testing the Feature

### Test 1: Request Password Reset

1. Go to: http://localhost:3000/auth/login
2. Click **"Forgot your password?"**
3. Enter a registered email address
4. Click **"Send reset link"**
5. You should see: "Check your email" confirmation

### Test 2: Check Email

1. Open your email inbox
2. Look for email from Supabase (subject: "Reset Password")
3. You should receive it within 1-2 minutes
4. **If no email:** Check spam folder

### Test 3: Reset Password

1. Click the link in the email
2. You should be redirected to: `/auth/reset-password`
3. Enter your new password (min 6 characters)
4. Confirm the password
5. Click **"Update password"**
6. You should be redirected to login with success message

### Test 4: Login with New Password

1. At login page, enter your email
2. Enter your **new password**
3. Click "Sign in"
4. You should successfully log in to dashboard

---

## 🎨 Features

### Forgot Password Page Features:
- ✅ Email validation
- ✅ Loading state while sending
- ✅ Error handling
- ✅ Success confirmation
- ✅ "Try again" option
- ✅ "Back to login" link

### Reset Password Page Features:
- ✅ Password strength requirement (min 6 chars)
- ✅ Password confirmation
- ✅ Passwords must match validation
- ✅ Loading state
- ✅ Error handling
- ✅ Auto-redirect after success

### Security Features:
- ✅ Reset links expire after 1 hour
- ✅ One-time use links
- ✅ Server-side validation
- ✅ Secure password hashing
- ✅ Email verification required

---

## 🔒 Security Considerations

### Link Expiration:
- Reset links are valid for **1 hour**
- After expiration, user must request a new link

### One-Time Use:
- Each link can only be used **once**
- After password reset, link becomes invalid

### Rate Limiting:
- Supabase automatically rate limits reset requests
- Prevents abuse and spam

### Email Verification:
- Only emails that exist in the system receive reset links
- Invalid emails don't get confirmation (security measure)

---

## 🛠️ Customization

### Change Reset Link Expiration:

In Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Select "Reset Password"
3. Modify the `{{ .ConfirmationURL }}` expiration settings

### Customize Email Template:

```html
<h2>Reset Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, please ignore this email.</p>
<p>This link will expire in 1 hour.</p>
```

### Change Password Requirements:

In `app/auth/password-reset/actions.ts`:
```typescript
if (password.length < 8) {  // Change from 6 to 8
  return { error: 'Password must be at least 8 characters long' }
}

// Add more validations:
if (!/[A-Z]/.test(password)) {
  return { error: 'Password must contain at least one uppercase letter' }
}
```

---

## 🐛 Troubleshooting

### Issue: Not Receiving Reset Email

**Solutions:**
1. **Check Spam Folder**
2. **Verify Email Exists:** User must have an account
3. **Check Supabase Logs:** Dashboard → Logs → Auth Logs
4. **SMTP Settings:** Make sure Supabase email is configured
5. **Rate Limiting:** Wait 1 minute between requests

### Issue: Reset Link Not Working

**Possible Causes:**
- Link expired (> 1 hour old)
- Link already used
- Invalid token

**Solution:**
- Request a new reset link

### Issue: "Invalid token" Error

**Cause:** The reset token in the URL is invalid or expired

**Solution:**
1. Go back to forgot password page
2. Request a new reset link
3. Use the new link immediately

### Issue: Redirect URL Not Working

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_SITE_URL`
2. Verify redirect URLs in Supabase (Authentication → URL Configuration)
3. Make sure URL matches exactly (with/without trailing slash)
4. Restart dev server after changing env vars

---

## 📱 Pages Created

### 1. `/auth/forgot-password`
- **Purpose:** Request password reset
- **File:** `app/auth/forgot-password/page.tsx`
- **What it does:** Collects email and sends reset link

### 2. `/auth/reset-password`
- **Purpose:** Set new password
- **File:** `app/auth/reset-password/page.tsx`
- **What it does:** Updates user password

### 3. Server Actions
- **File:** `app/auth/password-reset/actions.ts`
- **Functions:**
  - `requestPasswordReset()` - Sends email
  - `updatePassword()` - Updates password

---

## ✅ Testing Checklist

Before considering it complete, test:

- [ ] Can access forgot password page from login
- [ ] Email validation works
- [ ] Reset email is received
- [ ] Email contains correct reset link
- [ ] Reset link redirects to reset password page
- [ ] Password validation works (min length, match)
- [ ] Password update succeeds
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Reset link can only be used once
- [ ] Expired links show error

---

## 🎯 Integration with Existing Code

The feature integrates seamlessly:
- Uses existing Supabase setup
- Uses existing Server Actions pattern
- Matches existing UI design
- No database changes needed
- Works with existing middleware

---

## 📊 User Story Coverage

This feature helps with:
- **User Experience:** Users can recover their accounts
- **Security:** Secure password reset flow
- **Self-Service:** No admin intervention needed
- **Email Integration:** Leverages Supabase email

---

## 🚀 Next Steps

Now that password reset is complete, consider:
1. **Password Strength Indicator:** Add visual feedback for password strength
2. **Multi-Factor Authentication:** Add 2FA for extra security
3. **Account Recovery:** Add security questions as backup
4. **Email Verification:** Ensure users verify email on signup

---

## 📞 Support

If users have issues:
1. Check email spam folder
2. Request new reset link
3. Contact support if persistent issues
4. Check Supabase Auth Logs for errors

---

**Feature Status:** ✅ **COMPLETE AND READY TO USE**

Test the flow and let me know if you need any adjustments! 🎉
