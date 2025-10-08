# Payriff API v3 Integration Summary

## Overview
Successfully integrated Payriff API v3 Create Order and Get Order endpoints into the application.

## Credentials
- **Merchant ID**: ES1094797
- **Secret Key**: 719857DED4904989A4E2AAA2CDAEBB07
- **Environment**: Online (Production)

## Implemented Features

### 1. Backend tRPC Procedures

#### Create Order (`backend/trpc/routes/payriff/createOrder/route.ts`)
- **Endpoint**: `POST https://api.payriff.com/api/v3/orders`
- **Input Parameters**:
  - `amount` (number, required): Payment amount
  - `language` (EN/AZ/RU, optional): Payment page language
  - `currency` (AZN/USD/EUR, optional): Payment currency
  - `description` (string, required): Order description
  - `callbackUrl` (string, optional): Callback URL after payment
  - `cardSave` (boolean, optional): Save card for future payments
  - `operation` (PURCHASE/PRE_AUTH, optional): Operation type
  - `metadata` (object, optional): Custom metadata (max 200 key-value pairs)

- **Response**:
  ```typescript
  {
    code: string;
    message: string;
    payload: {
      orderId: string;
      paymentUrl: string;
      transactionId: number;
    }
  }
  ```

#### Get Order Info (`backend/trpc/routes/payriff/getOrder/route.ts`)
- **Endpoint**: `GET https://api.payriff.com/api/v3/orders/:orderId`
- **Input**: Order ID
- **Response**: Complete order information including transactions, status, and payment details

### 2. Service Layer (`services/payriffService.ts`)

Added two new methods to PayriffService class:

#### `createOrder(request: PayriffCreateOrderRequest)`
- Creates a new payment order
- Returns payment URL and order details
- Supports both PURCHASE and PRE_AUTH operations

#### `getOrderInfo(orderId: string)`
- Retrieves complete order information
- Returns transaction history and payment status

### 3. TypeScript Types

Added comprehensive TypeScript interfaces:
- `PayriffCreateOrderRequest`
- `PayriffCreateOrderResponse`
- `PayriffOrderInfoResponse`

### 4. UI Screen (`app/create-order.tsx`)

Created a user-friendly interface for testing the Create Order API:
- Amount input with validation
- Description field
- Currency selection (AZN, USD, EUR)
- Language selection (EN, AZ, RU)
- Operation type toggle (PURCHASE/PRE_AUTH)
- Card save checkbox
- Real-time order creation with loading states
- Payment URL opening in browser/app

## API Differences: v2 vs v3

### v2 (Invoice API)
- Uses merchant wrapper: `{ merchant: "...", body: {...} }`
- More complex request structure
- Focused on invoice generation

### v3 (Orders API)
- Direct request body (no merchant wrapper)
- Cleaner, more modern API design
- Better support for metadata
- Improved transaction tracking

## Usage Example

### From React Component (using tRPC):
```typescript
const createOrderMutation = trpc.payriff.createOrder.useMutation({
  onSuccess: (data) => {
    // Open payment URL
    window.open(data.payload.paymentUrl, '_blank');
  }
});

createOrderMutation.mutate({
  amount: 0.01,
  description: 'Test purchase',
  currency: 'AZN',
  language: 'EN',
  operation: 'PURCHASE',
  cardSave: false,
  metadata: {
    source: 'mobile_app',
    userId: '123'
  }
});
```

### From Service (direct):
```typescript
import { payriffService } from '@/services/payriffService';

const response = await payriffService.createOrder({
  amount: 0.01,
  description: 'Test purchase',
  currency: 'AZN',
  language: 'EN',
  operation: 'PURCHASE'
});

console.log('Payment URL:', response.payload.paymentUrl);
```

## Testing

1. Navigate to `/create-order` in the app
2. Fill in the order details
3. Click "Create Order"
4. System will create the order and provide payment URL
5. Open payment URL to complete the payment

## Operation Types

### PURCHASE
- Direct payment
- Amount is immediately charged
- Standard payment flow

### PRE_AUTH
- Pre-authorization (hold)
- Blocks amount on card for 30 days
- Requires completion or cancellation within 30 days
- Useful for reservations, deposits, etc.

## Card Save Feature

When `cardSave: true`:
1. Customer completes payment
2. Payriff returns `cardUuid` in callback
3. Store `cardUuid` in database
4. Use `cardUuid` with autoPay API for future payments

## Metadata

- Supports up to 200 key-value pairs
- Not visible to customers
- Returned in callback response
- Useful for tracking orders, user IDs, etc.

## Files Modified/Created

### Created:
- `backend/trpc/routes/payriff/createOrder/route.ts`
- `backend/trpc/routes/payriff/getOrder/route.ts`
- `app/create-order.tsx`
- `PAYRIFF_V3_INTEGRATION.md`

### Modified:
- `backend/trpc/app-router.ts` - Added new routes
- `services/payriffService.ts` - Added new methods and types

## Next Steps

1. Test with real payment cards
2. Implement order status checking
3. Add webhook handler for payment callbacks
4. Implement card save flow with autoPay
5. Add order history screen
6. Implement refund functionality

## Security Notes

- Secret key is stored in environment variables
- Never expose secret key in client-side code
- All API calls go through backend tRPC procedures
- Payment URLs are generated server-side
- Callback URLs should be HTTPS in production

## Support

For API documentation and support:
- Documentation: https://payriff.com/docs
- Support: Contact Payriff support team
