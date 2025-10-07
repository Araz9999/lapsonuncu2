# Email Confirmation Setup Checklist ✅

Use this checklist to set up email confirmation in your NaxtaPaz app.

## 📋 Pre-Setup Checklist

- [ ] You have access to email: `naxtapaz@gmail.com`
- [ ] You can receive emails at this address
- [ ] You have 5 minutes to complete setup

## 🚀 Setup Steps

### Step 1: SendGrid Account Setup

- [ ] Go to [SendGrid.com](https://sendgrid.com/)
- [ ] Click "Start for Free"
- [ ] Fill registration form:
  - [ ] Email address
  - [ ] Password
  - [ ] Company information
- [ ] Verify your email address (check inbox)
- [ ] Log in to SendGrid dashboard

### Step 2: Sender Verification

- [ ] In SendGrid dashboard, go to **Settings** → **Sender Authentication**
- [ ] Click **Single Sender Verification**
- [ ] Fill the form:
  - [ ] From Name: `NaxtaPaz`
  - [ ] From Email: `naxtapaz@gmail.com`
  - [ ] Reply To: `naxtapaz@gmail.com`
  - [ ] Company Address: `Naxçıvan, Azərbaycan`
  - [ ] City: `Naxçıvan`
  - [ ] Country: `Azerbaijan`
- [ ] Click **Create**
- [ ] Check email and verify sender

### Step 3: API Key Creation

- [ ] In SendGrid dashboard, go to **Settings** → **API Keys**
- [ ] Click **Create API Key**
- [ ] Name: `NaxtaPaz Production` (or any name you prefer)
- [ ] Choose permission level:
  - [ ] **Full Access** (recommended for simplicity)
  - OR
  - [ ] **Restricted Access** → Enable only **Mail Send**
- [ ] Click **Create & View**
- [ ] **IMPORTANT**: Copy the API key (shown only once!)
- [ ] Save it somewhere safe temporarily

### Step 4: Add API Key to Project

- [ ] Open your project folder
- [ ] Find `.env` file in root directory
- [ ] Locate these lines:
  ```env
  SENDGRID_API_KEY=your-sendgrid-api-key-here
  EMAIL_FROM=naxtapaz@gmail.com
  EMAIL_FROM_NAME=NaxtaPaz
  ```
- [ ] Replace `your-sendgrid-api-key-here` with your actual API key
- [ ] Verify `EMAIL_FROM` is correct: `naxtapaz@gmail.com`
- [ ] Save the file

### Step 5: Restart Server

- [ ] Stop the development server (press `Ctrl+C` in terminal)
- [ ] Start it again:
  ```bash
  bun run dev
  ```
- [ ] Wait for server to start
- [ ] Check console for any errors

### Step 6: Test Email Confirmation

- [ ] Open your app in browser or mobile
- [ ] Go to registration page
- [ ] Register a new user with a real email address you can access
- [ ] Check if registration succeeds
- [ ] Check your email inbox
- [ ] Verify you received the verification email
- [ ] Click "Email-i Təsdiqlə" button in email
- [ ] Verify you're redirected to verification success page
- [ ] Check if you received welcome email

## ✅ Verification Checklist

After setup, verify everything works:

### Email Sending
- [ ] Verification email is sent on registration
- [ ] Email arrives in inbox (not spam)
- [ ] Email has correct sender: `NaxtaPaz <naxtapaz@gmail.com>`
- [ ] Email is in Azerbaijani language
- [ ] Email has proper formatting (HTML)
- [ ] Verification link works

### Email Content
- [ ] Email includes user's name
- [ ] Verification button is visible
- [ ] Link is clickable
- [ ] Footer has contact information:
  - [ ] Email: naxtapaz@gmail.com
  - [ ] Phone: +994504801313
  - [ ] Address: Naxçıvan, Azərbaycan

### Verification Flow
- [ ] Clicking link opens verification page
- [ ] Page shows loading state
- [ ] Success message appears
- [ ] User is redirected to home
- [ ] Welcome email is sent
- [ ] User account is marked as verified

### Password Reset
- [ ] "Forgot Password" link works
- [ ] Reset email is sent
- [ ] Reset link works
- [ ] Password can be changed
- [ ] User can login with new password

### Error Handling
- [ ] Expired token shows error message
- [ ] Invalid token shows error message
- [ ] Already verified email shows appropriate message
- [ ] Network errors are handled gracefully

## 🔍 Troubleshooting Checklist

If emails are not sending:

- [ ] Check SendGrid API key is correct in `.env`
- [ ] Verify no extra spaces in API key
- [ ] Check Sender Identity is verified in SendGrid
- [ ] Look at server console for error messages
- [ ] Check SendGrid dashboard → Activity Feed for delivery status
- [ ] Verify email address is valid
- [ ] Check spam folder

If emails go to spam:

- [ ] Set up Domain Authentication in SendGrid
- [ ] Add SPF record to DNS
- [ ] Add DKIM record to DNS
- [ ] Wait 24-48 hours for DNS propagation

If API key doesn't work:

- [ ] Verify API key has Mail Send permission
- [ ] Check API key is active in SendGrid
- [ ] Try creating a new API key
- [ ] Ensure no typos in `.env` file

## 📊 Post-Setup Monitoring

After successful setup, monitor:

- [ ] Check SendGrid dashboard daily for:
  - [ ] Email delivery rate
  - [ ] Bounce rate
  - [ ] Spam reports
  - [ ] API usage
- [ ] Monitor server logs for email errors
- [ ] Track user verification rate
- [ ] Watch for spam complaints

## 💰 Usage Monitoring

Keep track of your SendGrid usage:

- [ ] Current plan: Free (100 emails/day)
- [ ] Daily email count: _____ / 100
- [ ] Monthly email count: _____ / 3,000
- [ ] Upgrade needed when: > 80 emails/day consistently

## 📚 Documentation Reference

- [ ] Read `EMAIL_SETUP_GUIDE.md` for detailed instructions
- [ ] Read `EMAIL_QUICK_START.md` for quick reference
- [ ] Read `EMAIL_CONFIRMATION_SUMMARY.md` for technical details

## 🎉 Setup Complete!

Once all items are checked:

- [ ] Email confirmation is fully functional
- [ ] Users can verify their emails
- [ ] Password reset works
- [ ] Welcome emails are sent
- [ ] System is production-ready

## 📞 Need Help?

If you encounter issues:

1. Check troubleshooting section above
2. Review server logs
3. Check SendGrid Activity Feed
4. Contact support:
   - Email: naxtapaz@gmail.com
   - Phone: +994504801313

---

**Estimated Setup Time**: 5-10 minutes
**Difficulty**: Easy
**Required**: SendGrid account (free)
