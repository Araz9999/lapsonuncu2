# Social Login Testing Guide

This guide will help you test the social login functionality for Google, Facebook, and VK.

## Prerequisites

Before testing, ensure you have:

1. ✅ Copied `.env.example` to `.env`
2. ✅ Added OAuth credentials for at least one provider
3. ✅ Generated a secure JWT_SECRET
4. ✅ Started the development server (`npm start`)

## Testing Checklist

### 1. Backend Health Check

First, verify the backend is running and OAuth providers are configured:

```bash
# Check API status
curl http://localhost:8081/api

# Check OAuth provider status
curl http://localhost:8081/api/auth/status
```

Expected response:
```json
{
  "configured": {
    "google": true,
    "facebook": false,
    "vk": false
  },
  "available": ["google"]
}
```

### 2. Frontend Social Login Buttons

Open the app and navigate to the login screen:

1. **Check button visibility**
   - Only configured providers should show buttons
   - If no providers are configured, you should see a message: "Social login not configured"

2. **Check button states**
   - Buttons should be enabled when no login is in progress
   - When clicked, button should show a loading spinner
   - Other buttons should be disabled during login

### 3. Google OAuth Flow

**Test Steps:**

1. Click "Login with Google" button
2. You should be redirected to Google's login page
3. Sign in with your Google account
4. Authorize the app when prompted
5. You should be redirected back to the app
6. You should be logged in automatically
7. Check that your profile shows Google account info (name, email, avatar)

**Expected Backend Logs:**
```
[Auth] Initiating google login
[Auth] Redirecting to google authorization URL
[Auth] Received google callback
[OAuth] Exchanging code for token with google
[OAuth] Successfully exchanged code for token with google
[OAuth] Fetching user info from google
[OAuth] Successfully fetched user info from google
[Auth] Creating new user from google data
[Auth] Generating JWT tokens for user: user_xxx
[Auth] google login successful, redirecting to app
```

**Common Issues:**
- **Redirect URI mismatch**: Ensure `http://localhost:8081/auth/callback/google` is added to Google Console
- **Invalid client**: Double-check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`

### 4. Facebook OAuth Flow

**Test Steps:**

1. Click "Login with Facebook" button
2. You should be redirected to Facebook's login page
3. Sign in with your Facebook account
4. Authorize the app when prompted
5. You should be redirected back to the app
6. You should be logged in automatically
7. Check that your profile shows Facebook account info

**Expected Backend Logs:**
```
[Auth] Initiating facebook login
[Auth] Redirecting to facebook authorization URL
[Auth] Received facebook callback
[OAuth] Exchanging code for token with facebook
[OAuth] Successfully exchanged code for token with facebook
[OAuth] Fetching user info from facebook
[OAuth] Successfully fetched user info from facebook
[Auth] Creating new user from facebook data
[Auth] Generating JWT tokens for user: user_xxx
[Auth] facebook login successful, redirecting to app
```

**Common Issues:**
- **App not in Live mode**: Make sure your Facebook app is in Live mode (not Development)
- **Redirect URI mismatch**: Ensure `http://localhost:8081/auth/callback/facebook` is added to Facebook app settings
- **Missing email permission**: Ensure "email" scope is requested

### 5. VK OAuth Flow

**Test Steps:**

1. Click "Login with VK" button
2. You should be redirected to VK's authorization page
3. Sign in with your VK account
4. Authorize the app when prompted
5. You should be redirected back to the app
6. You should be logged in automatically
7. Check that your profile shows VK account info

**Expected Backend Logs:**
```
[Auth] Initiating vk login
[Auth] Redirecting to vk authorization URL
[Auth] Received vk callback
[OAuth] Exchanging code for token with vk
[OAuth] Successfully exchanged code for token with vk
[OAuth] Fetching user info from vk
[OAuth] Successfully fetched user info from vk
[Auth] Creating new user from vk data
[Auth] Generating JWT tokens for user: user_xxx
[Auth] vk login successful, redirecting to app
```

**Common Issues:**
- **Redirect URI mismatch**: Ensure `http://localhost:8081/auth/callback/vk` is added to VK app settings
- **Email not provided**: VK may not always provide email; the app will generate a placeholder email

### 6. User Account Linking

Test that existing users can link social accounts:

1. Create an account with email/password
2. Log out
3. Log in with Google using the same email
4. The app should link the Google account to your existing account
5. Log out and log in with Google again
6. You should be logged into the same account

**Expected Backend Logs:**
```
[Auth] User not found, checking by email: user@example.com
[Auth] Found existing user by email, linking google account
[Auth] Generating JWT tokens for user: user_xxx
```

### 7. Multiple Social Accounts

Test logging in with different providers:

1. Log in with Google
2. Log out
3. Log in with Facebook (using different email)
4. You should have two separate accounts
5. Each account should maintain its own data

### 8. Token Persistence

Test that login persists across sessions:

1. Log in with any social provider
2. Close the app
3. Reopen the app
4. You should still be logged in
5. Your profile should show the correct account info

### 9. Error Handling

Test error scenarios:

**User Cancels Login:**
1. Click a social login button
2. Cancel the authorization on the provider's page
3. You should be returned to the login screen
4. No error alert should appear (just a console log)

**Invalid Credentials:**
1. Temporarily change GOOGLE_CLIENT_SECRET to an invalid value in `.env`
2. Restart the server
3. Try to log in with Google
4. You should see an error message
5. Restore the correct credentials

**Network Error:**
1. Disconnect from the internet
2. Try to log in with any provider
3. You should see an appropriate error message

### 10. Web vs Mobile Testing

**Web Testing:**
- Open `http://localhost:8081` in a browser
- Test all social login flows
- Check that redirects work correctly
- Verify cookies are set properly

**Mobile Testing (iOS/Android):**
- Scan the QR code with Expo Go
- Test all social login flows
- Check that WebBrowser opens correctly
- Verify deep linking works

### 11. Production Testing

Before deploying to production:

1. **Update redirect URIs** in each OAuth provider:
   - Google: `https://yourdomain.com/auth/callback/google`
   - Facebook: `https://yourdomain.com/auth/callback/facebook`
   - VK: `https://yourdomain.com/auth/callback/vk`

2. **Update environment variables:**
   ```bash
   FRONTEND_URL=https://yourdomain.com
   JWT_SECRET=your-production-secret-here
   ```

3. **Test on production domain:**
   - Test all three providers
   - Verify HTTPS is working
   - Check that cookies are secure
   - Test on multiple devices

## Debugging Tips

### Check Backend Logs

Monitor the backend logs for detailed information:

```bash
# The logs will show each step of the OAuth flow
# Look for [Auth] and [OAuth] prefixes
```

### Check Browser Console

Open browser DevTools and check for:
- Network requests to `/api/auth/*`
- Console errors or warnings
- Cookie storage

### Check AsyncStorage

On mobile, check that tokens are stored:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check stored token
const token = await AsyncStorage.getItem('auth_token');
console.log('Stored token:', token);

// Check stored user
const user = await AsyncStorage.getItem('auth_user');
console.log('Stored user:', user);
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Provider not configured" | OAuth credentials not set | Add credentials to `.env` and restart server |
| "Redirect URI mismatch" | Redirect URI doesn't match | Update redirect URI in OAuth provider settings |
| "Invalid client" | Wrong client ID or secret | Double-check credentials in `.env` |
| "Authentication failed" | General OAuth error | Check backend logs for details |
| "Login cancelled" | User cancelled login | Normal behavior, no action needed |

## Security Testing

### Test Security Features

1. **JWT Token Expiration:**
   - Log in and wait 7 days
   - Token should expire
   - User should be logged out

2. **HTTP-Only Cookies:**
   - Check that cookies are HTTP-only
   - JavaScript should not be able to access tokens

3. **CSRF Protection:**
   - State parameter should be validated
   - Invalid state should be rejected

4. **Secure Cookies (Production):**
   - In production, cookies should have `secure: true`
   - Cookies should only be sent over HTTPS

## Performance Testing

### Test Performance

1. **Login Speed:**
   - Social login should complete in < 5 seconds
   - Redirects should be fast

2. **Button Responsiveness:**
   - Buttons should respond immediately
   - Loading states should appear instantly

3. **Error Recovery:**
   - Errors should be handled gracefully
   - User should be able to retry immediately

## Accessibility Testing

### Test Accessibility

1. **Screen Readers:**
   - Social login buttons should be properly labeled
   - Error messages should be announced

2. **Keyboard Navigation:**
   - All buttons should be keyboard accessible
   - Tab order should be logical

3. **Color Contrast:**
   - Button text should have sufficient contrast
   - Error messages should be readable

## Final Checklist

Before considering social login complete:

- [ ] All three providers (Google, Facebook, VK) work correctly
- [ ] User accounts are created/linked properly
- [ ] Tokens are stored and persist across sessions
- [ ] Error handling works for all scenarios
- [ ] Web and mobile versions both work
- [ ] Backend logs show no errors
- [ ] Security features are working
- [ ] Performance is acceptable
- [ ] Accessibility is good
- [ ] Documentation is complete

## Need Help?

If you encounter issues:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh browser session (clear cookies)
4. Review the setup guide: [SOCIAL_LOGIN_SETUP.md](./SOCIAL_LOGIN_SETUP.md)
5. Check the OAuth provider's developer console for errors

---

**Happy Testing!** 🎉
