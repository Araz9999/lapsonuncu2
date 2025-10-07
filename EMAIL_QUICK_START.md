# Email Confirmation - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get SendGrid API Key

1. Go to [SendGrid](https://sendgrid.com/) and sign up for free
2. Verify your email address
3. Create a **Single Sender Verification**:
   - From Email: `naxtapaz@gmail.com`
   - From Name: `NaxtaPaz`
4. Go to **Settings** → **API Keys**
5. Click **Create API Key**
6. Choose **Full Access** or **Mail Send** permission
7. **Copy the API key** (shown only once!)

### Step 2: Add API Key to Project

Open `.env` file and add:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
EMAIL_FROM=naxtapaz@gmail.com
EMAIL_FROM_NAME=NaxtaPaz
```

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
bun run dev
```

### Step 4: Test

1. Register a new user
2. Check your email inbox
3. Click "Email-i Təsdiqlə" button
4. Done! ✅

## 📧 What's Included

### Email Templates (in Azerbaijani)

1. **Verification Email** - Sent on registration (24h validity)
2. **Welcome Email** - Sent after verification
3. **Password Reset Email** - Sent on forgot password (1h validity)

### API Endpoints (tRPC)

```typescript
// Register with email verification
trpc.auth.register.useMutation()

// Login
trpc.auth.login.useMutation()

// Verify email
trpc.auth.verifyEmail.useMutation()

// Resend verification email
trpc.auth.resendVerification.useMutation()

// Forgot password
trpc.auth.forgotPassword.useMutation()

// Reset password
trpc.auth.resetPassword.useMutation()
```

### Routes

- `/auth/register` - Registration
- `/auth/login` - Login
- `/auth/verify-email?token=xxx` - Email verification
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password?token=xxx` - Reset password

## 💰 SendGrid Pricing

- **Free**: 100 emails/day (3,000/month) - Perfect for testing!
- **Essentials**: $19.95/month - 50,000 emails/month
- **Pro**: $89.95/month - 100,000 emails/month

## 🔒 Security Features

- ✅ Cryptographically secure random tokens
- ✅ Verification tokens expire after 24 hours
- ✅ Password reset tokens expire after 1 hour
- ✅ SHA-256 password hashing
- ✅ JWT authentication
- ✅ Protected API endpoints

## 📱 User Flow

1. User registers → Verification email sent
2. User clicks link in email → Email verified
3. Welcome email sent automatically
4. User can now access all features

## 🆘 Troubleshooting

**Emails not sending?**
- Check API key is correct in `.env`
- Verify Sender Identity is confirmed in SendGrid
- Check server logs for errors

**Emails going to spam?**
- Set up Domain Authentication in SendGrid
- Add SPF and DKIM records to DNS

**API key not working?**
- Ensure it has Mail Send permission
- Try creating a new API key

## 📞 Support

- Email: naxtapaz@gmail.com
- Phone: +994504801313
- Location: Naxçıvan, Azerbaijan

## 📚 Full Documentation

See `EMAIL_SETUP_GUIDE.md` for detailed setup instructions in Azerbaijani.
