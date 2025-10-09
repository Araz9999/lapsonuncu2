# Troubleshooting Guide

Quick solutions to common issues in the NaxtaPaz app.

---

## 🔧 Common Issues

### 1. Profile Delete Button Not Working

**Symptoms:**
- Clicking delete button does nothing
- Navigation doesn't happen after deletion
- User stays on profile screen

**Solution:**
✅ **FIXED** - Updated in latest version

The issue was with `router.replace()` not working properly. Changed to `router.push()` with proper alert handling.

**Code Location:** `app/(tabs)/profile.tsx` line 90

**How to Verify Fix:**
1. Go to Profile tab
2. Scroll to bottom
3. Click "Profili sil" (red button)
4. Confirm both alerts
5. Should show success message
6. Should navigate to login screen

---

### 2. Payriff Payment Not Redirecting

**Symptoms:**
- Payment button clicked but nothing happens
- No redirect to Payriff page
- Error in console

**Possible Causes:**
1. Missing Payriff credentials
2. Incorrect callback URL
3. Network error

**Solutions:**

#### Check Environment Variables
```bash
# .env file should have:
PAYRIFF_MERCHANT_ID=ES1094797
PAYRIFF_SECRET_KEY=719857DED4904989A4E2AAA2CDAEBB07
PAYRIFF_BASE_URL=https://api.payriff.com
FRONTEND_URL=https://1r36dhx42va8pxqbqz5ja.rork.app
```

#### Check Console Logs
```javascript
// Should see:
"Create order request: { amount: 10, language: 'AZ', ... }"
"Create order response: { code: '00000', payload: { paymentUrl: '...' } }"
```

#### Verify Callback URLs
- Success: `${FRONTEND_URL}/payment/success`
- Error: `${FRONTEND_URL}/payment/error`
- Cancel: `${FRONTEND_URL}/payment/cancel`

---

### 3. Wallet Balance Not Updating

**Symptoms:**
- Balance shows 0 or old value
- Transaction history empty
- Refresh doesn't work

**Solutions:**

#### Manual Refresh
1. Pull down on wallet screen
2. Wait for loading indicator
3. Balance should update

#### Check API Connection
```typescript
// Test in console:
const wallet = await trpc.payriff.getWallet.useQuery();
console.log(wallet.data);
```

#### Verify Payriff API
```bash
# Test API directly:
curl -X GET https://api.payriff.com/api/v2/wallet \
  -H "Authorization: YOUR_SECRET_KEY"
```

---

### 4. tRPC Connection Error

**Symptoms:**
- "Failed to fetch" errors
- API calls timing out
- Backend not responding

**Solutions:**

#### Check Backend URL
```typescript
// lib/trpc.ts
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }
  throw new Error("No base url found");
};
```

#### Verify Backend Running
```bash
# Should see:
"API is running"
```

#### Test Backend Health
```bash
curl https://1r36dhx42va8pxqbqz5ja.rork.app/
# Should return: {"status":"ok","message":"API is running"}
```

---

### 5. Authentication Issues

**Symptoms:**
- Can't login
- Token expired errors
- Logged out unexpectedly

**Solutions:**

#### Clear AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear all data:
await AsyncStorage.clear();

// Or clear specific key:
await AsyncStorage.removeItem('user-storage');
```

#### Check JWT Token
```typescript
// backend/utils/jwt.ts
// Verify token generation and validation
```

#### Reset User State
```typescript
const { logout } = useUserStore();
logout(); // Clears all user data
```

---

### 6. Navigation Not Working

**Symptoms:**
- Screens don't change
- Back button doesn't work
- Stuck on one screen

**Solutions:**

#### Use Correct Navigation Method
```typescript
// For going back:
router.back();

// For replacing current screen:
router.replace('/path');

// For pushing new screen:
router.push('/path');

// For going to root:
router.replace('/(tabs)');
```

#### Check Route Configuration
```typescript
// app/_layout.tsx
// Verify all routes are registered
<Stack.Screen name="route-name" />
```

---

### 7. Payment Callback Not Working

**Symptoms:**
- Payment completes but app doesn't update
- Stuck on payment page
- No success/error message

**Solutions:**

#### Verify Callback URLs Match
```typescript
// constants/config.ts
FRONTEND_URL: 'https://1r36dhx42va8pxqbqz5ja.rork.app'

// Should match Payriff dashboard settings
```

#### Check Payment Success Handler
```typescript
// app/payment/success.tsx
useEffect(() => {
  console.log('Payment success:', { orderId, amount });
  // Should log payment details
}, [orderId, amount]);
```

#### Test Callback Manually
```
https://1r36dhx42va8pxqbqz5ja.rork.app/payment/success?orderId=123&amount=10
```

---

### 8. Images Not Loading

**Symptoms:**
- Broken image icons
- Images show placeholder
- Slow image loading

**Solutions:**

#### Check Image URLs
```typescript
// Should be valid URLs:
https://images.unsplash.com/...
https://picsum.photos/...
```

#### Use Expo Image
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  contentFit="cover"
/>
```

#### Add Error Handling
```typescript
<Image
  source={{ uri: imageUrl }}
  onError={(error) => console.log('Image error:', error)}
/>
```

---

### 9. Store Not Persisting Data

**Symptoms:**
- Data lost on app restart
- Settings reset
- Favorites disappear

**Solutions:**

#### Check Zustand Persist
```typescript
// store/userStore.ts
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'user-storage',
    storage: createJSONStorage(() => AsyncStorage),
  }
)
```

#### Verify AsyncStorage
```typescript
// Test storage:
await AsyncStorage.setItem('test', 'value');
const value = await AsyncStorage.getItem('test');
console.log(value); // Should be 'value'
```

---

### 10. TypeScript Errors

**Symptoms:**
- Red squiggly lines
- Build fails
- Type errors in console

**Solutions:**

#### Common Type Fixes
```typescript
// Use explicit types:
const [value, setValue] = useState<string>('');

// Use type assertions:
const data = response as PayriffResponse;

// Use optional chaining:
const name = user?.name ?? 'Guest';

// Use proper imports:
import type { User } from '@/types/user';
```

#### Check tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 🚨 Emergency Fixes

### App Won't Start

```bash
# 1. Clear cache
rm -rf node_modules
rm -rf .expo
rm bun.lock

# 2. Reinstall
bun install

# 3. Start fresh
bun start --clear
```

### Database Issues

```typescript
// Reset all stores:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();

// Restart app
```

### Payment Stuck

```typescript
// Cancel pending payment:
const { spendFromWallet } = useUserStore();
// Manually adjust balance if needed

// Or contact Payriff support
```

---

## 📞 Getting Help

### Check Logs First
```bash
# Console logs:
console.log('[Component] Action:', data);

# Backend logs:
console.log('[Backend] Request:', input);
```

### Debug Mode
```typescript
// Enable debug logging:
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Report Issue
Include:
1. Error message
2. Steps to reproduce
3. Expected vs actual behavior
4. Console logs
5. Device/browser info
6. App version

---

## 🔍 Debugging Tools

### React Native Debugger
```bash
# Install:
brew install react-native-debugger

# Use:
# Cmd+D (iOS) or Cmd+M (Android)
# Select "Debug"
```

### Network Inspector
```typescript
// Check API calls:
// Chrome DevTools > Network tab
// Filter: XHR/Fetch
```

### State Inspector
```typescript
// Add to component:
console.log('State:', {
  user: useUserStore.getState(),
  listings: useListingStore.getState(),
});
```

---

## ✅ Verification Checklist

After fixing an issue:

- [ ] Error no longer appears
- [ ] Feature works as expected
- [ ] No new errors introduced
- [ ] Console is clean
- [ ] Performance is good
- [ ] Works on all platforms
- [ ] Data persists correctly
- [ ] Navigation works
- [ ] UI looks correct
- [ ] Tests pass

---

## 📚 Additional Resources

### Documentation
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [tRPC Docs](https://trpc.io/)
- [Payriff API Docs](https://payriff.com/docs)

### Support
- GitHub Issues
- Discord Community
- Stack Overflow
- Expo Forums

---

**Last Updated:** 2025-10-09  
**Version:** 1.0.0  
**Maintained By:** Development Team
