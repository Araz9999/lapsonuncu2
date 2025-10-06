# Social Login Setup Checklist

Use this checklist to set up social login in your app.

## ⚡ Quick Setup (5 minutes)

### Step 1: Environment File
- [ ] Run: `cp .env.example .env`
- [ ] Generate JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Paste JWT secret into `.env` as `JWT_SECRET`
- [ ] Set `FRONTEND_URL=http://localhost:8081` in `.env`

### Step 2: Choose Provider(s)

Pick at least one provider to set up:

#### Option A: Google (Easiest - Recommended)
- [ ] Go to https://console.cloud.google.com/apis/credentials
- [ ] Create OAuth client ID → Web application
- [ ] Add redirect URI: `http://localhost:8081/auth/callback/google`
- [ ] Copy Client ID to `.env` as `GOOGLE_CLIENT_ID`
- [ ] Copy Client Secret to `.env` as `GOOGLE_CLIENT_SECRET`

#### Option B: Facebook
- [ ] Go to https://developers.facebook.com/
- [ ] Create app → Consumer type
- [ ] Add Facebook Login product
- [ ] Add redirect URI: `http://localhost:8081/auth/callback/facebook`
- [ ] Copy App ID to `.env` as `FACEBOOK_APP_ID`
- [ ] Copy App Secret to `.env` as `FACEBOOK_APP_SECRET`

#### Option C: VK (VKontakte)
- [ ] Go to https://vk.com/apps?act=manage
- [ ] Create application → Website
- [ ] Add redirect URI: `http://localhost:8081/auth/callback/vk`
- [ ] Copy Application ID to `.env` as `VK_CLIENT_ID`
- [ ] Copy Secure Key to `.env` as `VK_CLIENT_SECRET`

### Step 3: Start & Test
- [ ] Run: `npm start`
- [ ] Open app in browser or mobile
- [ ] Go to login screen
- [ ] Click social login button
- [ ] Authorize the app
- [ ] Verify you're logged in ✅

## 📋 Verification

### Check Backend
- [ ] Visit: http://localhost:8081/api
- [ ] Should see: `{"status":"ok","message":"API is running"}`
- [ ] Visit: http://localhost:8081/api/auth/status
- [ ] Should see configured providers: `{"configured":{"google":true,...}}`

### Check Frontend
- [ ] Social login buttons appear on login screen
- [ ] Only configured providers show buttons
- [ ] Clicking button opens provider's login page
- [ ] After authorization, redirected back to app
- [ ] User is logged in automatically

### Check Logs
- [ ] Backend logs show OAuth flow steps
- [ ] No errors in console
- [ ] Token is stored in AsyncStorage

## 🚀 Production Deployment

When ready to deploy:

### Update Environment
- [ ] Set `FRONTEND_URL=https://yourdomain.com`
- [ ] Generate new JWT secret for production
- [ ] Set `NODE_ENV=production`

### Update OAuth Providers
- [ ] Google: Add `https://yourdomain.com/auth/callback/google`
- [ ] Facebook: Add `https://yourdomain.com/auth/callback/facebook`
- [ ] VK: Add `https://yourdomain.com/auth/callback/vk`

### Test Production
- [ ] Test all providers on production domain
- [ ] Verify HTTPS is working
- [ ] Check cookies are secure
- [ ] Test on multiple devices

## 📚 Documentation

If you need help:

- **Quick Start**: [SOCIAL_LOGIN_QUICK_START.md](./SOCIAL_LOGIN_QUICK_START.md)
- **Full Setup**: [SOCIAL_LOGIN_SETUP.md](./SOCIAL_LOGIN_SETUP.md)
- **Testing**: [SOCIAL_LOGIN_TESTING.md](./SOCIAL_LOGIN_TESTING.md)
- **Summary**: [SOCIAL_LOGIN_SUMMARY.md](./SOCIAL_LOGIN_SUMMARY.md)

## ❓ Troubleshooting

### "Provider not configured"
→ Add credentials to `.env` and restart server

### "Redirect URI mismatch"
→ Check redirect URI matches exactly in provider settings

### Social buttons not showing
→ Check `/api/auth/status` to see configured providers

### Login doesn't work
→ Check backend logs for detailed error messages

## ✅ Done!

Once all checkboxes are complete, social login is ready to use! 🎉

---

**Current Status:**
- [ ] Environment configured
- [ ] At least one provider set up
- [ ] Tested and working
- [ ] Ready for production
