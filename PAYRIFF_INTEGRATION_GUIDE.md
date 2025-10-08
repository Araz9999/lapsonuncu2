# Payriff Payment Gateway Integration Guide

## Overview
Payriff payment gateway has been successfully integrated into your NaxtaPaz marketplace app. Users can now top up their wallet balance using bank cards through Payriff's secure payment system.

## Features Implemented

### 1. Backend Integration
- **Payriff Service** (`backend/services/payriff.ts`)
  - Order creation with secure signature generation
  - Payment status checking
  - Refund processing
  - Callback verification

- **Payment Routes** (`backend/routes/payments.ts`)
  - `POST /api/payments/payriff/create-order` - Create new payment order
  - `POST /api/payments/payriff/callback` - Handle payment callbacks
  - `GET /api/payments/payriff/status/:orderId` - Check payment status
  - `POST /api/payments/payriff/refund` - Process refunds

### 2. Frontend Integration
- **Payment Service** (`services/paymentService.ts`)
  - `createPayriffOrder()` - Initiate payment
  - `getPayriffPaymentStatus()` - Check payment status
  - `isPayriffConfigured()` - Verify configuration

- **Wallet Screen** (`app/wallet.tsx`)
  - Payriff payment method selection
  - Automatic redirect to Payriff payment page
  - Success/failure callback handling
  - Automatic wallet balance update on successful payment
  - 5% bonus on top-ups

## Setup Instructions

### Step 1: Get Payriff Credentials

1. **Sign Up**
   - Visit [Payriff Dashboard](https://dashboard.payriff.com/auth?formType=signup)
   - Create an account (Personal or Business)
   - Complete phone verification

2. **Activate Account**
   - For Personal accounts: Automatically activated in production mode
   - For Business accounts: Sign contract and complete verification

3. **Get API Credentials**
   - Navigate to Settings → API Keys
   - Copy your Merchant ID
   - Generate and copy your Secret Key

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Payriff Payment Gateway
PAYRIFF_MERCHANT_ID=your-merchant-id-here
PAYRIFF_SECRET_KEY=your-secret-key-here
PAYRIFF_API_URL=https://api.payriff.com

# Frontend URL (for callbacks)
FRONTEND_URL=http://localhost:8081  # Change to your production URL
```

### Step 3: Test the Integration

#### Test Mode (Development)
1. Start your development server
2. Navigate to Wallet screen
3. Click "Balans artır" (Top up balance)
4. Enter amount (e.g., 10 AZN)
5. Select "Payriff (Bank kartı)"
6. Click "Ödə" (Pay)
7. You'll be redirected to Payriff payment page
8. Use test card credentials provided by Payriff

#### Production Mode
1. Update `FRONTEND_URL` in `.env` to your production domain
2. Update Payriff callback URLs in dashboard:
   - Success URL: `https://yourdomain.com/api/payments/payriff/callback`
   - Cancel URL: `https://yourdomain.com/wallet?payment=canceled`
3. Deploy your app
4. Test with real card

## Payment Flow

```
User → Wallet Screen → Select Amount → Choose Payriff
  ↓
Frontend → Create Order Request → Backend
  ↓
Backend → Payriff API → Create Order
  ↓
Payriff → Return Payment URL
  ↓
User Redirected → Payriff Payment Page
  ↓
User Enters Card Details → Completes Payment
  ↓
Payriff → Callback to Backend
  ↓
Backend → Verify Signature → Update Database
  ↓
User Redirected → Wallet Screen (Success/Failure)
  ↓
Frontend → Update Balance → Show Confirmation
```

## Security Features

1. **HMAC-SHA256 Signature**
   - All requests signed with secret key
   - Prevents tampering and unauthorized access

2. **Callback Verification**
   - Signature verification on callbacks
   - Ensures callbacks are from Payriff

3. **Secure Order IDs**
   - Unique order IDs with random components
   - Format: `ORDER-{userId}-{timestamp}-{random}`

4. **Environment Variables**
   - Sensitive credentials stored in `.env`
   - Never committed to version control

## Error Handling

The integration includes comprehensive error handling:

- **Invalid Amount**: Alert shown to user
- **No Payment Method Selected**: Alert shown to user
- **Payment Creation Failed**: Error message displayed
- **Payment Declined**: User redirected with failure message
- **Network Errors**: Graceful error handling with retry option

## Testing Checklist

- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Payriff credentials valid
- [ ] Can create payment order
- [ ] Redirect to Payriff works
- [ ] Payment success callback works
- [ ] Payment failure callback works
- [ ] Wallet balance updates correctly
- [ ] Bonus calculation works (5%)
- [ ] Transaction history updates
- [ ] Error messages display correctly

## Supported Features

✅ **Implemented**
- Wallet top-up via bank card
- Automatic balance update
- Bonus system (5% on top-ups)
- Payment status tracking
- Success/failure callbacks
- Secure signature verification
- Multi-language support (AZ/RU)

🔄 **Future Enhancements**
- Recurring payments
- Saved card support
- Payment history export
- Refund requests from user
- Multiple currency support

## API Reference

### Create Payment Order

```typescript
POST /api/payments/payriff/create-order

Request:
{
  "amount": 10,
  "currency": "AZN",
  "userId": "user123",
  "description": "Wallet top-up"
}

Response:
{
  "success": true,
  "orderId": "ORDER-user123-1234567890-abc123",
  "paymentUrl": "https://pay.payriff.com/..."
}
```

### Check Payment Status

```typescript
GET /api/payments/payriff/status/:orderId

Response:
{
  "success": true,
  "status": {
    "orderId": "ORDER-user123-1234567890-abc123",
    "status": "APPROVED",
    "amount": 10,
    "currency": "AZN",
    "transactionId": "TXN123456"
  }
}
```

## Troubleshooting

### Payment URL Not Opening
- Check if `PAYRIFF_MERCHANT_ID` is configured
- Verify `PAYRIFF_SECRET_KEY` is correct
- Check network connectivity

### Callback Not Working
- Verify `FRONTEND_URL` is correct
- Check if callback URL is accessible from internet
- Review Payriff dashboard callback settings

### Balance Not Updating
- Check callback signature verification
- Review backend logs for errors
- Verify database connection

## Support

For Payriff-specific issues:
- Documentation: https://docs.payriff.com/
- Dashboard: https://dashboard.payriff.com/
- Support: Contact Payriff support team

For integration issues:
- Check backend logs
- Review browser console
- Test with Payriff test credentials

## Production Deployment

Before going live:

1. ✅ Test thoroughly in development
2. ✅ Update environment variables for production
3. ✅ Configure production callback URLs in Payriff dashboard
4. ✅ Test with real card (small amount)
5. ✅ Monitor first transactions closely
6. ✅ Set up error monitoring
7. ✅ Prepare customer support for payment issues

## Compliance

- PCI DSS: Payriff handles card data (no PCI compliance needed)
- GDPR: No card data stored in your database
- Local Regulations: Ensure compliance with Azerbaijan payment regulations

---

**Integration Status**: ✅ Complete and Ready for Testing

**Last Updated**: 2025-01-08
