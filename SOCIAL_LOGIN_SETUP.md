# Social Login Setup Guide

This guide will help you set up Google, Facebook, and VK OAuth 2.0 authentication for your marketplace app.

## Table of Contents
1. [Overview](#overview)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Facebook OAuth Setup](#facebook-oauth-setup)
4. [VK OAuth Setup](#vk-oauth-setup)
5. [Environment Configuration](#environment-configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The social login system uses OAuth 2.0 flows to authenticate users. The flow works as follows:

1. User clicks a social login button (Google/Facebook/VK)
2. App redirects to the provider's authorization page
3. User authorizes the app
4. Provider redirects back with an authorization code
5. Backend exchanges code for access token
6. Backend fetches user info from provider
7. Backend creates/updates user in database
8. Backend generates JWT token
9. User is logged in and redirected to the app

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### Step 2: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the consent screen if prompted
4. Select **Web application** as the application type
5. Add authorized redirect URIs:
   - For local development: `http://localhost:8081/auth/callback/google`
   - For production: `https://yourdomain.com/auth/callback/google`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### Step 3: Add to Environment Variables

```bash
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

---

## Facebook OAuth Setup

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** > **Create App**
3. Select **Consumer** as the app type
4. Fill in the app details and create the app

### Step 2: Configure Facebook Login

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Select **Web** as the platform
4. Add your site URL: `http://localhost:8081` (for development)
5. Go to **Facebook Login** > **Settings**
6. Add Valid OAuth Redirect URIs:
   - For local development: `http://localhost:8081/auth/callback/facebook`
   - For production: `https://yourdomain.com/auth/callback/facebook`
7. Save changes

### Step 3: Get App Credentials

1. Go to **Settings** > **Basic**
2. Copy the **App ID** and **App Secret**

### Step 4: Add to Environment Variables

```bash
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
```

### Step 5: Make App Public (for production)

1. Go to **Settings** > **Basic**
2. Toggle **App Mode** to **Live**
3. Complete the App Review process if required

---

## VK OAuth Setup

### Step 1: Create a VK Application

1. Go to [VK Developers](https://vk.com/apps?act=manage)
2. Click **Create Application**
3. Fill in the application details:
   - **Title**: Your app name
   - **Platform**: Website
   - **Website address**: `http://localhost:8081` (for development)
4. Click **Connect Application**

### Step 2: Configure OAuth Settings

1. In your app settings, go to **Settings** tab
2. Add **Authorized redirect URI**:
   - For local development: `http://localhost:8081/auth/callback/vk`
   - For production: `https://yourdomain.com/auth/callback/vk`
3. Save changes

### Step 3: Get App Credentials

1. Copy the **Application ID** (Client ID)
2. Copy the **Secure key** (Client Secret)

### Step 4: Add to Environment Variables

```bash
VK_CLIENT_ID=your-vk-client-id-here
VK_CLIENT_SECRET=your-vk-client-secret-here
```

---

## Environment Configuration

### Step 1: Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Step 2: Fill in Required Variables

Edit `.env` and add your credentials:

```bash
# Frontend URL
FRONTEND_URL=http://localhost:8081

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here

# VK OAuth
VK_CLIENT_ID=your-vk-client-id-here
VK_CLIENT_SECRET=your-vk-client-secret-here
```

### Step 3: Generate a Secure JWT Secret

Use a strong random string for JWT_SECRET. You can generate one using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

---

## Testing

### Test Locally

1. Start your development server:
   ```bash
   npm start
   ```

2. Open the app in your browser or mobile device

3. Navigate to the login screen

4. Click on a social login button (Google/Facebook/VK)

5. Authorize the app when prompted

6. You should be redirected back and logged in

### Check Backend Logs

Monitor the backend logs to see the OAuth flow:

```bash
# You should see logs like:
[Auth] Initiating google login
[OAuth] Exchanging code for token with google
[OAuth] Successfully exchanged code for token with google
[OAuth] Fetching user info from google
[OAuth] Successfully fetched user info from google
[Auth] Creating new user from google data
[Auth] Generating JWT tokens for user: user_xxx
[Auth] google login successful, redirecting to app
```

### Test Each Provider

Make sure to test all three providers:
- ✅ Google login
- ✅ Facebook login
- ✅ VK login

---

## Deployment

### Update Redirect URIs

When deploying to production, update the redirect URIs in each provider's settings:

**Google:**
- Add: `https://yourdomain.com/auth/callback/google`

**Facebook:**
- Add: `https://yourdomain.com/auth/callback/facebook`

**VK:**
- Add: `https://yourdomain.com/auth/callback/vk`

### Update Environment Variables

Set production environment variables:

```bash
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your-production-jwt-secret-here
# ... other production credentials
```

### Security Checklist

- ✅ Use HTTPS in production
- ✅ Set secure JWT secret (64+ characters)
- ✅ Enable HTTP-only cookies
- ✅ Set proper CORS origins
- ✅ Keep client secrets secure (never commit to git)
- ✅ Rotate secrets regularly
- ✅ Monitor for suspicious login attempts

---

## Troubleshooting

### "Provider not configured" Error

**Problem:** Social login button doesn't work

**Solution:**
1. Check that environment variables are set correctly
2. Restart the development server after adding .env variables
3. Verify credentials are not placeholder values

### "Redirect URI mismatch" Error

**Problem:** OAuth provider shows redirect URI error

**Solution:**
1. Ensure redirect URIs match exactly in provider settings
2. Check for trailing slashes
3. Verify protocol (http vs https)
4. For local development, use `http://localhost:8081` not `http://127.0.0.1:8081`

### "Invalid client" Error

**Problem:** OAuth provider rejects client credentials

**Solution:**
1. Double-check Client ID and Client Secret
2. Ensure no extra spaces in environment variables
3. Verify app is in "Live" mode (Facebook)
4. Check that OAuth is enabled for the app

### User Not Created in Database

**Problem:** Login succeeds but user is not saved

**Solution:**
1. Check backend logs for errors
2. Verify database connection
3. Ensure user email is provided by OAuth provider
4. Check that email scope is requested

### Token Not Stored

**Problem:** User is logged out after refresh

**Solution:**
1. Check that JWT tokens are being generated
2. Verify AsyncStorage is working
3. Check cookie settings (httpOnly, secure, sameSite)
4. Ensure token expiration is set correctly

### CORS Errors

**Problem:** Browser shows CORS errors

**Solution:**
1. Update CORS settings in `backend/hono.ts`
2. Add your frontend URL to allowed origins
3. Enable credentials in CORS config
4. Check that cookies are being sent with requests

---

## API Endpoints

The following endpoints are available:

### Initiate OAuth Flow
```
GET /api/auth/:provider/login
```
Providers: `google`, `facebook`, `vk`

### OAuth Callback
```
GET /api/auth/:provider/callback
```
Handles the OAuth redirect and creates/logs in user

### Logout
```
POST /api/auth/logout
```
Clears authentication cookies

### Check Provider Status
```
GET /api/auth/status
```
Returns which providers are configured

---

## Security Best Practices

1. **Never commit secrets to git**
   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets

2. **Use HTTPS in production**
   - OAuth providers require HTTPS for production apps
   - Set `secure: true` for cookies in production

3. **Validate redirect URIs**
   - Only allow whitelisted redirect URIs
   - Check state parameter to prevent CSRF

4. **Rotate secrets regularly**
   - Change JWT secret periodically
   - Update OAuth credentials if compromised

5. **Monitor login attempts**
   - Log all authentication attempts
   - Set up alerts for suspicious activity

6. **Implement rate limiting**
   - Limit login attempts per IP
   - Prevent brute force attacks

---

## Support

If you encounter issues not covered in this guide:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh browser session (clear cookies)
4. Review the OAuth provider's documentation
5. Check the provider's developer console for errors

For additional help, refer to:
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [VK OAuth Documentation](https://dev.vk.com/api/access-token/authcode-flow-user)
