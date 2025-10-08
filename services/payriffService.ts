import config from '@/constants/config';
import { Platform } from 'react-native';

export interface PayriffPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  language?: 'az' | 'en' | 'ru';
  successUrl?: string;
  errorUrl?: string;
  cancelUrl?: string;
}

export interface PayriffPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
}

export interface PayriffPaymentStatus {
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paymentDate?: string;
}

class PayriffService {
  private merchantId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = config.PAYRIFF_MERCHANT_ID as string;
    this.secretKey = config.PAYRIFF_SECRET_KEY as string;
    this.baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';
  }

  private generateSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return this.hashString(`${signatureString}${this.secretKey}`);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  async createPayment(request: PayriffPaymentRequest): Promise<PayriffPaymentResponse> {
    try {
      const frontendUrl = config.FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
      
      const paymentData = {
        merchant: this.merchantId,
        amount: Math.round(request.amount * 100),
        currency: request.currency || 'AZN',
        description: request.description,
        order_id: request.orderId,
        language: request.language || 'az',
        success_url: request.successUrl || `${frontendUrl}/payment/success`,
        error_url: request.errorUrl || `${frontendUrl}/payment/error`,
        cancel_url: request.cancelUrl || `${frontendUrl}/payment/cancel`,
      };

      const signature = this.generateSignature(paymentData);

      const response = await fetch(`${this.baseUrl}/api/v1/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          ...paymentData,
          signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const data = await response.json();

      return {
        success: true,
        paymentUrl: data.payment_url || data.paymentUrl,
        transactionId: data.transaction_id || data.transactionId,
        orderId: request.orderId,
      };
    } catch (error) {
      console.error('Payriff payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async checkPaymentStatus(orderId: string): Promise<PayriffPaymentStatus> {
    try {
      const requestData = {
        merchant: this.merchantId,
        order_id: orderId,
      };

      const signature = this.generateSignature(requestData);

      const response = await fetch(`${this.baseUrl}/api/v1/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          ...requestData,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      return {
        orderId: data.order_id || orderId,
        status: this.mapPaymentStatus(data.status),
        amount: data.amount / 100,
        currency: data.currency || 'AZN',
        transactionId: data.transaction_id,
        paymentDate: data.payment_date,
      };
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw error;
    }
  }

  private mapPaymentStatus(status: string): 'pending' | 'success' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'success' | 'failed' | 'cancelled'> = {
      'pending': 'pending',
      'processing': 'pending',
      'success': 'success',
      'completed': 'success',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }

  async refundPayment(transactionId: string, amount?: number): Promise<boolean> {
    try {
      const requestData = {
        merchant: this.merchantId,
        transaction_id: transactionId,
        ...(amount && { amount: Math.round(amount * 100) }),
      };

      const signature = this.generateSignature(requestData);

      const response = await fetch(`${this.baseUrl}/api/v1/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify({
          ...requestData,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refund payment');
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Failed to refund payment:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return (
      this.merchantId !== 'your-payriff-merchant-id' &&
      this.secretKey !== 'your-payriff-secret-key' &&
      !!this.merchantId &&
      !!this.secretKey
    );
  }

  openPaymentPage(paymentUrl: string) {
    if (Platform.OS === 'web') {
      window.open(paymentUrl, '_blank');
    } else {
      console.log('Opening payment URL:', paymentUrl);
    }
  }
}

export const payriffService = new PayriffService();
