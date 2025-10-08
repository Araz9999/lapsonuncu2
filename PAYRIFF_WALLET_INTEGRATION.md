# Payriff Wallet Integration

## Overview
The Payriff wallet integration allows you to view your Payriff merchant wallet balance and transaction history directly in your app.

## Features Implemented

### 1. Backend API Routes
- **GET /api/trpc/payriff.getWallet** - Fetches wallet balance and transaction history
- **GET /api/trpc/payriff.getWalletById** - Fetches specific wallet details by ID

### 2. Frontend Integration
- **Real-time Balance Display** - Shows your current Payriff wallet balance
- **Transaction History** - Lists all wallet operations with details
- **Pull-to-Refresh** - Swipe down to refresh wallet data
- **Error Handling** - Graceful error states with retry functionality
- **Loading States** - Smooth loading indicators during data fetch

### 3. Transaction Types Supported
The app displays the following transaction types:
- **TOPUP** - Balance top-up operations
- **SPEND** - Spending/payment operations
- **TRANSFER_IN** - Incoming transfers
- **TRANSFER_OUT** - Outgoing transfers
- **PAYMENT** - Payment operations
- **REFUND** - Refund operations
- **BONUS** - Bonus credits

## API Endpoints Used

### Get Wallet
```
GET https://api.payriff.com/api/v2/wallet
Headers:
  Authorization: [SECRET_KEY]
```

**Response:**
```json
{
  "code": "string",
  "message": "string",
  "route": "string",
  "internalMessage": "string",
  "payload": {
    "historyResponse": [
      {
        "id": number,
        "active": boolean,
        "balance": number,
        "amount": number,
        "operation": "string"
      }
    ],
    "totalBalance": number
  }
}
```

### Get Wallet By ID
```
GET https://api.payriff.com/api/v2/wallet/:ID
Headers:
  Authorization: [SECRET_KEY]
```

**Response:**
```json
{
  "id": number,
  "active": boolean,
  "balance": number,
  "appId": number,
  "userId": number,
  "applicationStatus": "string"
}
```

## Files Modified/Created

### Backend Files
1. `backend/trpc/routes/payriff/getWallet/route.ts` - Get wallet endpoint
2. `backend/trpc/routes/payriff/getWalletById/route.ts` - Get wallet by ID endpoint
3. `backend/trpc/app-router.ts` - Added wallet routes to router
4. `services/payriffService.ts` - Added wallet service methods and types

### Frontend Files
1. `app/wallet.tsx` - Updated to use real Payriff API data

## Usage

### Viewing Wallet Balance
1. Navigate to the Wallet screen in your app
2. The app will automatically fetch your Payriff wallet balance
3. View your total balance and transaction history

### Refreshing Data
- Pull down on the screen to refresh wallet data
- Or tap the retry button if an error occurs

### Transaction Details
Each transaction shows:
- Operation type (with localized labels)
- Amount (positive for credits, negative for debits)
- Balance after transaction
- Visual indicators (green for credits, red for debits)

## Configuration

Make sure your `.env` file contains:
```
PAYRIFF_MERCHANT_ID=ES1094797
PAYRIFF_SECRET_KEY=719857DED4904989A4E2AAA2CDAEBB07
PAYRIFF_BASE_URL=https://api.payriff.com
```

## Localization

The wallet screen supports both Azerbaijani (az) and Russian (ru) languages:
- All transaction types are translated
- UI labels adapt based on selected language
- Error messages are localized

## Error Handling

The app handles the following error scenarios:
1. **Network Errors** - Shows error message with retry button
2. **API Errors** - Displays user-friendly error messages
3. **Empty State** - Shows message when no transactions exist
4. **Loading State** - Displays loading indicator during data fetch

## Next Steps

To extend the wallet functionality, you can:
1. Add filtering by transaction type
2. Implement date range filtering
3. Add export functionality for transaction history
4. Create detailed transaction view pages
5. Add wallet-to-wallet transfer functionality
6. Implement balance alerts and notifications

## Testing

To test the wallet integration:
1. Ensure your Payriff credentials are configured
2. Navigate to the Wallet screen
3. Verify that balance displays correctly
4. Check that transactions are listed
5. Test pull-to-refresh functionality
6. Verify error handling by disconnecting network

## Support

For issues with the Payriff API, contact Payriff support or refer to their official documentation at https://payriff.com/docs
