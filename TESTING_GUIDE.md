# Testing Guide - NaxtaPaz App

Quick reference guide for testing all major features of the application.

---

## 🚀 Quick Start

1. **Start the app:**
   ```bash
   npm start
   # or
   bun start
   ```

2. **Access the app:**
   - Web: https://1r36dhx42va8pxqbqz5ja.rork.app
   - Mobile: Scan QR code with Expo Go app

---

## 🧪 Test Scenarios

### 1. Authentication Flow

#### Test Login
1. Navigate to Profile tab
2. Click "Daxil ol" (Login)
3. Enter any email and password
4. Click login button
5. ✅ Should redirect to profile screen

#### Test Registration
1. Click "Qeydiyyat" (Register) on login screen
2. Fill in registration form
3. Submit form
4. ✅ Should receive verification email
5. ✅ Should redirect to verification screen

#### Test Profile Deletion
1. Go to Profile tab (must be logged in)
2. Scroll to bottom
3. Click "Profili sil" (Delete Profile) - red button
4. Confirm first alert
5. Confirm second alert
6. ✅ Should show success message
7. ✅ Should redirect to login screen

---

### 2. Payriff Payment Integration

#### Test Wallet Top-Up
1. Login to app
2. Go to Profile tab
3. Click "Pul kisəsi" (Wallet)
4. Click "Balans artır" (Top Up Balance)
5. Enter amount: `10.00`
6. Select "Bank kartı" (Bank Card)
7. Click "Ödə" (Pay)
8. ✅ Should redirect to Payriff payment page
9. Complete payment on Payriff
10. ✅ Should return to success page
11. ✅ Balance should be updated

**Test Credentials (Sandbox):**
- Card: 4169738990000004
- Expiry: 01/39
- CVV: 123

#### Test Wallet Balance
1. Go to Wallet screen
2. Pull down to refresh
3. ✅ Should show Payriff balance
4. ✅ Should show transaction history
5. ✅ Should display total balance

#### Test MPAY Top-Up
1. Navigate to `/topup` screen
2. Enter phone: `994501234567`
3. Enter amount: `5.00`
4. Enter description
5. Click "Topup MPAY Wallet"
6. ✅ Should process top-up
7. ✅ Should show success message

---

### 3. Listing Management

#### Test Create Listing
1. Go to Create tab
2. Fill in listing details:
   - Title
   - Description
   - Price
   - Category
   - Location
3. Add images (optional)
4. Select ad package
5. Click create
6. ✅ Should create listing
7. ✅ Should deduct from balance/free ads

#### Test Search Listings
1. Go to Search tab
2. Enter search term
3. Apply filters:
   - Category
   - Price range
   - Location
4. ✅ Should show filtered results

#### Test Favorite Listing
1. Open any listing
2. Click heart icon
3. ✅ Should add to favorites
4. Go to Profile > Favorites
5. ✅ Should see favorited listing

---

### 4. Store Management

#### Test Create Store
1. Go to Profile > Store Management
2. Click "Create Store"
3. Fill in store details:
   - Name
   - Description
   - Category
4. Select store package
5. Complete payment
6. ✅ Should create store
7. ✅ Should redirect to store page

#### Test Store Promotion
1. Go to My Store
2. Click "Promote Store"
3. Select promotion package
4. Complete payment
5. ✅ Should activate promotion
6. ✅ Store should appear in featured

---

### 5. Messaging System

#### Test Direct Messages
1. Open any listing
2. Click "Mesaj" (Message) button
3. Type message
4. Send message
5. ✅ Should create conversation
6. Go to Messages tab
7. ✅ Should see conversation

#### Test Live Chat Support
1. Go to Profile > Live Support
2. Click "Start Chat"
3. Type message
4. Send message
5. ✅ Should connect to operator
6. ✅ Should receive responses

---

### 6. Call System

#### Test Voice Call
1. Open any listing
2. Click "Zəng et" (Call) button
3. ✅ Should initiate call
4. ✅ Should show call screen
5. End call
6. ✅ Should save to call history

---

### 7. Navigation Testing

#### Test Tab Navigation
1. Click Home tab ✅
2. Click Search tab ✅
3. Click Create tab ✅
4. Click Messages tab ✅
5. Click Profile tab ✅
6. Click Stores tab ✅

#### Test Deep Links
- `/listing/1` - Listing details ✅
- `/profile/1` - User profile ✅
- `/store/1` - Store details ✅
- `/wallet` - Wallet screen ✅
- `/favorites` - Favorites list ✅
- `/settings` - Settings screen ✅

---

## 🔍 Backend API Testing

### Test tRPC Routes

#### Test Example Route
```typescript
const result = await trpc.example.hi.useQuery();
// Should return: { message: "Hello from tRPC!" }
```

#### Test Payriff Wallet
```typescript
const wallet = await trpc.payriff.getWallet.useQuery();
// Should return wallet balance and history
```

#### Test Create Order
```typescript
const order = await trpc.payriff.createOrder.mutate({
  amount: 10.00,
  description: "Test payment",
  currency: "AZN",
  language: "AZ",
  operation: "PURCHASE"
});
// Should return: { payload: { orderId, paymentUrl, transactionId } }
```

#### Test Authentication
```typescript
const result = await trpc.auth.login.mutate({
  email: "test@example.com",
  password: "password123"
});
// Should return: { user, tokens }
```

---

## 🐛 Common Issues & Solutions

### Issue: Payment redirect not working
**Solution:** Check FRONTEND_URL in .env matches your app URL

### Issue: Wallet balance not updating
**Solution:** Pull down to refresh the wallet screen

### Issue: Profile delete not navigating
**Solution:** Fixed in latest version - uses router.push() now

### Issue: tRPC connection error
**Solution:** Ensure backend is running and EXPO_PUBLIC_RORK_API_BASE_URL is set

### Issue: Social login not working
**Solution:** Configure OAuth credentials in .env file

---

## 📊 Performance Testing

### Load Testing
1. Create 10+ listings rapidly
2. ✅ Should handle without lag
3. Search with filters
4. ✅ Should return results quickly
5. Navigate between screens
6. ✅ Should be smooth

### Memory Testing
1. Open app
2. Navigate through all screens
3. Create/delete multiple items
4. ✅ Memory should remain stable
5. ✅ No memory leaks

---

## ✅ Acceptance Criteria

### Must Pass:
- [ ] User can register and login
- [ ] User can create listings
- [ ] User can search and filter
- [ ] Payment flow completes successfully
- [ ] Wallet balance updates correctly
- [ ] Messages send and receive
- [ ] Profile deletion works
- [ ] Navigation is smooth
- [ ] No critical errors in console

### Nice to Have:
- [ ] Social login works
- [ ] Email verification works
- [ ] Push notifications work
- [ ] Voice calls connect
- [ ] Store promotion works

---

## 🔐 Security Testing

### Test Authentication
- [ ] Cannot access protected routes without login
- [ ] JWT tokens expire correctly
- [ ] Password is hashed
- [ ] Email verification required

### Test Payment Security
- [ ] Payment data is encrypted
- [ ] Card details not stored locally
- [ ] Secure redirect to Payriff
- [ ] Callback URLs validated

---

## 📱 Device Testing

### iOS
- [ ] iPhone 12 Pro
- [ ] iPhone 14 Pro Max
- [ ] iPad Pro

### Android
- [ ] Samsung Galaxy S21
- [ ] Google Pixel 6
- [ ] OnePlus 9

### Web
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 🎯 Test Coverage

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ | All flows working |
| Listings | ✅ | CRUD operations work |
| Search | ✅ | Filters functional |
| Payments | ✅ | Payriff integrated |
| Wallet | ✅ | Balance updates |
| Messages | ✅ | Real-time chat |
| Stores | ✅ | Full management |
| Profile | ✅ | Delete fixed |
| Navigation | ✅ | All routes work |
| Backend | ✅ | tRPC operational |

---

## 📝 Test Report Template

```markdown
## Test Session Report

**Date:** [Date]
**Tester:** [Name]
**Device:** [Device/Browser]
**Build:** [Version]

### Tests Passed: X/Y

#### Passed:
- [Feature] - [Details]

#### Failed:
- [Feature] - [Error details]

#### Blocked:
- [Feature] - [Reason]

### Issues Found:
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce
   - Expected vs Actual

### Recommendations:
- [Suggestion 1]
- [Suggestion 2]
```

---

## 🚀 Ready for Production?

### Checklist:
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Database configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Support team trained

---

**Last Updated:** 2025-10-09  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
