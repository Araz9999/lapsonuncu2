# Social Login Fix Guide

## Issue
Social media login buttons were not functional due to missing OAuth configuration.

## What Was Fixed

### 1. Environment Configuration
- Created `.env` file with proper structure
- Added support for both `process.env` and `EXPO_PUBLIC_` prefixed variables
- Updated frontend URL to use tunnel URL: `https://1r36dhx42va8pxqbqz5ja.rork.app`

### 2. Backend OAuth Service
- Fixed redirect URIs to use `/api/auth/{provider}/callback` format
- Added fallback to tunnel URL for development
- Added logging for debugging OAuth flow

### 3. Frontend Social Auth Utility
- Updated base URL detection to use `window.location.origin` on web
- Fixed API endpoint URLs to match backend routes
- Improved error handling and logging

### 4. Callback Routes
- Ensured all callback routes use consistent URL structure
- Fixed environment variable fallbacks

## Setup Instructions

### Step 1: Configure OAuth Providers

You need to set up OAuth apps for each provider you want to use:

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - Development: `https://1r36dhx42va8pxqbqz5ja.rork.app/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing one
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - Development: `https://1r36dhx42va8pxqbqz5ja.rork.app/api/auth/facebook/callback`
   - Production: `https://yourdomain.com/api/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

#### VK OAuth Setup
1. Go to [VK Apps](https://vk.com/apps?act=manage)
2. Create a new app or select existing one
3. Configure OAuth settings
4. Add authorized redirect URIs:
   - Development: `https://1r36dhx42va8pxqbqz5ja.rork.app/api/auth/vk/callback`
   - Production: `https://yourdomain.com/api/auth/vk/callback`
5. Copy Client ID and Client Secret to `.env`

### Step 2: Update .env File

Edit the `.env` file and replace placeholder values:

```bash
# Update these with your actual credentials
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

FACEBOOK_APP_ID=your-actual-facebook-app-id
FACEBOOK_APP_SECRET=your-actual-facebook-app-secret

VK_CLIENT_ID=your-actual-vk-client-id
VK_CLIENT_SECRET=your-actual-vk-client-secret
```

### Step 3: Restart the Server

After updating `.env`, restart your development server:

```bash
bun run start
```

### Step 4: Test Social Login

1. Open the app in your browser
2. Navigate to the login page
3. Click on any social login button (Google, Facebook, or VK)
4. You should be redirected to the provider's login page
5. After successful authentication, you'll be redirected back to the app

## Testing Without OAuth Credentials

If you don't have OAuth credentials yet, the social login buttons will be hidden automatically. The app will show a message: "Social login not configured."

To test the flow without real credentials:
1. The buttons will only appear if credentials are configured
2. Check browser console for detailed logs about OAuth status
3. Backend will return 503 error if provider is not configured

## Troubleshooting

### Social Login Buttons Not Showing
- Check if `.env` file exists and has valid credentials
- Ensure credentials don't contain placeholder text like "your-"
- Check browser console for auth status logs

### Redirect URI Mismatch Error
- Verify the redirect URI in your OAuth app settings matches exactly:
  - Format: `https://1r36dhx42va8pxqbqz5ja.rork.app/api/auth/{provider}/callback`
  - Must include `/api/auth/` prefix
  - Must use HTTPS (tunnel provides this)

### Authentication Failed Error
- Check backend logs for detailed error messages
- Verify OAuth credentials are correct
- Ensure the OAuth app is not in development/sandbox mode (or add test users)

### CORS Errors
- Backend already has CORS configured to accept all origins
- If issues persist, check browser console for specific CORS errors

## Production Deployment

When deploying to production:

1. Update `.env` with production values:
```bash
FRONTEND_URL=https://yourdomain.com
```

2. Update OAuth redirect URIs in all provider dashboards:
```
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com/api/auth/facebook/callback
https://yourdomain.com/api/auth/vk/callback
```

3. Ensure environment variables are set in your hosting platform

4. Test all social login flows in production environment

## Security Notes

- Never commit `.env` file to git (already in `.gitignore`)
- Use strong JWT_SECRET in production (generate with: `openssl rand -hex 64`)
- Enable HTTPS in production (required for OAuth)
- Regularly rotate OAuth secrets
- Monitor OAuth app usage in provider dashboards

## Support

For detailed setup instructions for each provider, see:
- `SOCIAL_LOGIN_SETUP.md` - Detailed provider setup guide
- `SOCIAL_LOGIN_QUICK_START.md` - Quick start guide
- `SOCIAL_LOGIN_TESTING.md` - Testing guide

For issues, check:
1. Browser console logs (frontend)
2. Server logs (backend)
3. OAuth provider dashboard for errors
