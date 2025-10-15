export interface SavedCard {
  id: string;
  userId?: string;
  cardUuid: string;
  pan: string;
  brand: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardHolderName?: string;
  cardHolder?: string;
  isDefault?: boolean;
  createdAt?: string;
  savedAt?: string;
  lastUsed?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank_transfer';
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'topup' | 'transfer' | 'payment' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  orderStatus?: string;
  responseCode?: string;
  responseDescription?: string;
  payload?: any;
}

export interface AutoPayRequest {
  amount: number;
  cardUuid: string;
  description: string;
  orderId: string;
  currencyType: string;
}
