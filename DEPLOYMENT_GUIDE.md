# Deployment Guide for Naxtap App

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env.production`
- [ ] Fill in all production API keys and secrets
- [ ] Update `FRONTEND_URL` to your production domain
- [ ] Generate a strong `JWT_SECRET` using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Verify all social login credentials (Google, Facebook, VK)
- [ ] Test all API integrations in staging environment

### 2. Code Optimization
- [x] All components optimized with React.memo()
- [x] useMemo() and useCallback() implemented where needed
- [x] Image caching enabled (memory-disk policy)
- [x] Responsive layouts for mobile, tablet, and desktop
- [x] Theme support (light/dark mode) working correctly
- [x] Language switching (Azerbaijani, Russian, English) functional

### 3. Performance Checks
- [ ] Test app on slow 3G network
- [ ] Verify image loading performance
- [ ] Check bundle size (should be < 5MB)
- [ ] Test navigation transitions
- [ ] Verify no memory leaks in animations
- [ ] Test with 1000+ listings for performance

### 4. Security
- [ ] All API keys stored in environment variables
- [ ] JWT tokens properly secured
- [ ] HTTPS enabled for all API calls
- [ ] Input validation on all forms
- [ ] XSS protection implemented
- [ ] CSRF protection for sensitive operations

### 5. Testing
- [ ] Test all user flows (registration, login, posting ads, messaging)
- [ ] Test on iOS devices (iPhone 12+, iPad)
- [ ] Test on Android devices (various screen sizes)
- [ ] Test on web browsers (Chrome, Safari, Firefox)
- [ ] Test social login (Google, Facebook, VK)
- [ ] Test payment flows (if enabled)
- [ ] Test push notifications
- [ ] Test live chat functionality

## Deployment Steps

### Option 1: Deploy to Expo (Recommended for Quick Start)

1. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

2. **Login to Expo**
   ```bash
   expo login
   ```

3. **Build for Production**
   ```bash
   # For iOS
   expo build:ios
   
   # For Android
   expo build:android
   
   # For Web
   expo build:web
   ```

4. **Publish Update**
   ```bash
   expo publish
   ```

### Option 2: Deploy Web Version

1. **Build Web Bundle**
   ```bash
   npm run build:web
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Or Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

### Option 3: Deploy Native Apps

1. **iOS Deployment**
   - Build with Expo: `expo build:ios`
   - Download IPA file
   - Upload to App Store Connect
   - Submit for review

2. **Android Deployment**
   - Build with Expo: `expo build:android`
   - Download APK/AAB file
   - Upload to Google Play Console
   - Submit for review

## Post-Deployment

### 1. Monitoring
- Set up error tracking (Sentry, Bugsnag)
- Configure analytics (Google Analytics, Mixpanel)
- Monitor API response times
- Track user engagement metrics

### 2. Performance Monitoring
- Monitor app load times
- Track API latency
- Monitor crash rates
- Check memory usage

### 3. User Feedback
- Set up in-app feedback mechanism
- Monitor app store reviews
- Track support tickets
- Analyze user behavior

## Environment Variables Reference

### Required for Production
- `FRONTEND_URL` - Your production domain
- `JWT_SECRET` - Strong random secret for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret
- `VK_CLIENT_ID` - VK client ID
- `VK_CLIENT_SECRET` - VK client secret

### Optional (Based on Features)
- `OPENAI_API_KEY` - For AI features
- `STRIPE_PUBLISHABLE_KEY` - For payments
- `STRIPE_SECRET_KEY` - For payments
- `GOOGLE_MAPS_API_KEY` - For maps
- `AWS_ACCESS_KEY_ID` - For file storage
- `AWS_SECRET_ACCESS_KEY` - For file storage
- `TWILIO_ACCOUNT_SID` - For SMS
- `SENDGRID_API_KEY` - For emails

## Troubleshooting

### Common Issues

1. **App crashes on startup**
   - Check environment variables are set correctly
   - Verify API endpoints are accessible
   - Check console logs for errors

2. **Images not loading**
   - Verify image URLs are accessible
   - Check CORS settings on image server
   - Verify cache policy is set correctly

3. **Social login not working**
   - Verify redirect URIs are configured correctly
   - Check OAuth credentials are for production
   - Verify callback URLs match production domain

4. **Performance issues**
   - Enable production mode
   - Verify bundle size is optimized
   - Check for memory leaks in animations
   - Optimize image sizes

## Support

For deployment support, contact:
- Email: support@naxtap.com
- Documentation: https://docs.naxtap.com
- Community: https://community.naxtap.com

## Version History

- v1.0.0 - Initial production release
- Optimized for performance and responsiveness
- Full theme and language support
- Social login integration
- Live chat functionality
