import crypto from 'crypto';

export interface PayriffOrderRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  callbackUrl: string;
  cancelUrl: string;
}

export interface PayriffOrderResponse {
  success: boolean;
  orderId: string;
  paymentUrl?: string;
  error?: string;
}

export interface PayriffPaymentStatus {
  orderId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELED' | 'REFUNDED';
  amount: number;
  currency: string;
  transactionId?: string;
  errorMessage?: string;
}

class PayriffService {
  private merchantId: string;
  private secretKey: string;
  private apiUrl: string;

  constructor() {
    this.merchantId = process.env.PAYRIFF_MERCHANT_ID || '';
    this.secretKey = process.env.PAYRIFF_SECRET_KEY || '';
    this.apiUrl = process.env.PAYRIFF_API_URL || 'https://api.payriff.com';
  }

  private generateSignature(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureString)
      .digest('hex');
  }

  async createOrder(orderData: PayriffOrderRequest): Promise<PayriffOrderResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payriff is not configured. Please set PAYRIFF_MERCHANT_ID and PAYRIFF_SECRET_KEY');
      }

      const requestData = {
        merchantId: this.merchantId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        description: orderData.description,
        orderId: orderData.orderId,
        callbackUrl: orderData.callbackUrl,
        cancelUrl: orderData.cancelUrl,
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(requestData);

      const response = await fetch(`${this.apiUrl}/v1/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'X-Signature': signature,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create Payriff order');
      }

      const data = await response.json();

      return {
        success: true,
        orderId: data.orderId,
        paymentUrl: data.paymentUrl,
      };
    } catch (error) {
      console.error('Payriff order creation failed:', error);
      return {
        success: false,
        orderId: orderData.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(orderId: string): Promise<PayriffPaymentStatus> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payriff is not configured');
      }

      const requestData = {
        merchantId: this.merchantId,
        orderId,
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(requestData);

      const response = await fetch(`${this.apiUrl}/v1/orders/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'X-Signature': signature,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      const data = await response.json();

      return {
        orderId: data.orderId,
        status: data.status,
        amount: data.amount / 100,
        currency: data.currency,
        transactionId: data.transactionId,
        errorMessage: data.errorMessage,
      };
    } catch (error) {
      console.error('Failed to get Payriff payment status:', error);
      throw error;
    }
  }

  async refundPayment(orderId: string, amount?: number): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Payriff is not configured');
      }

      const requestData = {
        merchantId: this.merchantId,
        orderId,
        amount: amount ? Math.round(amount * 100) : undefined,
        timestamp: Date.now().toString(),
      };

      const signature = this.generateSignature(requestData);

      const response = await fetch(`${this.apiUrl}/v1/orders/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId,
          'X-Signature': signature,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to refund payment');
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Payriff refund failed:', error);
      return false;
    }
  }

  verifyCallback(callbackData: Record<string, any>, receivedSignature: string): boolean {
    try {
      const calculatedSignature = this.generateSignature(callbackData);
      return calculatedSignature === receivedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return (
      !!this.merchantId &&
      !!this.secretKey &&
      !this.merchantId.includes('your-') &&
      !this.secretKey.includes('your-')
    );
  }
}

export const payriffService = new PayriffService();
