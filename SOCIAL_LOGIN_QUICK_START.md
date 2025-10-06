# Social Login Quick Start Guide

This guide will help you quickly set up Google, Facebook, and VK OAuth authentication.

## 🚀 Quick Setup (5 minutes)

### Step 1: Copy Environment File

```bash
cp .env.example .env
```

### Step 2: Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it into your `.env` file as `JWT_SECRET`.

### Step 3: Configure OAuth Providers

You need to set up OAuth apps for each provider you want to use. You can set up all three or just one.

#### Option A: Google OAuth (Recommended - Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Click "Create Credentials" → "OAuth client ID"
4. Choose "Web application"
5. Add redirect URI: `http://localhost:8081/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

#### Option B: Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add "Facebook Login" product
4. In Settings → Basic, copy App ID and App Secret
5. In Facebook Login → Settings, add redirect URI: `http://localhost:8081/auth/callback/facebook`
6. Paste credentials into `.env`

#### Option C: VK OAuth (VKontakte)

1. Go to [VK Apps](https://vk.com/apps?act=manage)
2. Create new application (Website type)
3. In Settings, add redirect URI: `http://localhost:8081/auth/callback/vk`
4. Copy Application ID and Secure Key to `.env`

### Step 4: Update .env File

Your `.env` file should look like this:

```bash
FRONTEND_URL=http://localhost:8081
JWT_SECRET=your-generated-secret-here

# Add credentials for providers you want to use
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

VK_CLIENT_ID=your-vk-client-id
VK_CLIENT_SECRET=your-vk-client-secret
```

### Step 5: Start the App

```bash
npm start
```

### Step 6: Test Social Login

1. Open the app in your browser
2. Navigate to the login screen
3. Click on a social login button (Google/Facebook/VK)
4. Authorize the app
5. You should be logged in and redirected to the home screen

## ✅ Verification

Check that social login is working:

1. **Backend logs** - You should see:
   ```
   [Auth] Initiating google login
   [OAuth] Exchanging code for token with google
   [OAuth] Successfully fetched user info from google
   [Auth] google login successful, redirecting to app
   ```

2. **Frontend** - After clicking a social button:
   - You're redirected to the provider's login page
   - After authorizing, you're redirected back to the app
   - You're logged in with your social account

3. **Check provider status** - Visit: `http://localhost:8081/api/auth/status`
   - Should show which providers are configured

## 🔧 Troubleshooting

### "Provider not configured" error

**Solution:** Make sure you've added the credentials to `.env` and restarted the server.

### "Redirect URI mismatch" error

**Solution:** Ensure the redirect URI in your OAuth app settings exactly matches:
- Google: `http://localhost:8081/auth/callback/google`
- Facebook: `http://localhost:8081/auth/callback/facebook`
- VK: `http://localhost:8081/auth/callback/vk`

### Social login button doesn't work

**Solution:**
1. Check browser console for errors
2. Verify `.env` file exists and has correct values
3. Restart the development server
4. Clear browser cache and cookies

### User not logged in after redirect

**Solution:**
1. Check backend logs for errors
2. Verify JWT_SECRET is set in `.env`
3. Check that cookies are enabled in your browser

## 📱 Mobile Testing

For testing on mobile devices:

1. Update `FRONTEND_URL` in `.env` to your tunnel URL (e.g., from ngrok or Expo tunnel)
2. Update redirect URIs in each OAuth provider to use the tunnel URL
3. Restart the server

## 🚀 Production Deployment

When deploying to production:

1. Update `FRONTEND_URL` to your production domain
2. Update redirect URIs in each OAuth provider:
   - Google: `https://yourdomain.com/auth/callback/google`
   - Facebook: `https://yourdomain.com/auth/callback/facebook`
   - VK: `https://yourdomain.com/auth/callback/vk`
3. Generate a new, secure JWT_SECRET for production
4. Set environment variables on your hosting platform
5. Ensure HTTPS is enabled

## 📚 Additional Resources

- [Full Setup Guide](./SOCIAL_LOGIN_SETUP.md) - Detailed instructions with screenshots
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [VK OAuth Docs](https://dev.vk.com/api/access-token/authcode-flow-user)

## 🔒 Security Notes

- Never commit `.env` file to git
- Use HTTPS in production
- Rotate secrets regularly
- Keep OAuth credentials secure
- Monitor for suspicious login attempts

## 💡 Tips

- Start with Google OAuth - it's the easiest to set up
- Test each provider separately
- Check backend logs for detailed error messages
- Use incognito/private browsing for testing
- Clear cookies between tests

## 🆘 Need Help?

If you're still having issues:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh browser session (clear cookies)
4. Review the full setup guide: [SOCIAL_LOGIN_SETUP.md](./SOCIAL_LOGIN_SETUP.md)
5. Check the OAuth provider's developer console for errors

---

**Ready to go?** Follow the steps above and you'll have social login working in minutes! 🎉
