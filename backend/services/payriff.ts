import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface PayriffPaymentData {
  amount: number;
  orderId: string;
  description: string;
  language?: 'az' | 'en' | 'ru';
  customerEmail?: string;
  customerPhone?: string;
}

export interface PayriffPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PayriffTransactionStatus {
  transactionId: string;
  orderId: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  amount: number;
  currency: string;
  createdAt: string;
  approvedAt?: string;
}

class PayriffService {
  private merchantId: string;
  private secretKey: string;
  private apiUrl: string;
  private environment: string;

  constructor() {
    this.merchantId = process.env.PAYRIFF_MERCHANT_ID || '';
    this.secretKey = process.env.PAYRIFF_SECRET_KEY || '';
    this.apiUrl = process.env.PAYRIFF_API_URL || 'https://api.payriff.com/api/v2';
    this.environment = process.env.PAYRIFF_ENVIRONMENT || 'production';

    if (!this.merchantId || !this.secretKey) {
      logger.warn('Payriff credentials not configured');
    }
  }

  private generateSignature(data: string): string {
    // Use HMAC-SHA256 with the merchant secret to prevent forgery
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  private getCallbackUrls() {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    return {
      successUrl: `${baseUrl}/payment/success`,
      errorUrl: `${baseUrl}/payment/error`,
      callbackUrl: `${baseUrl}/api/payriff-callback`,
    };
  }

  async createPayment(data: PayriffPaymentData): Promise<PayriffPaymentResponse> {
    try {
      if (!this.merchantId || !this.secretKey) {
        throw new Error('Payriff credentials not configured');
      }

      const amountInQepik = Math.round(data.amount * 100);
      const signString = `${this.merchantId}${data.orderId}${amountInQepik}${this.secretKey}`;
      const signature = this.generateSignature(signString);

      const urls = this.getCallbackUrls();

      const paymentData = {
        merchantId: this.merchantId,
        amount: amountInQepik,
        currency: 'AZN',
        orderId: data.orderId,
        description: data.description,
        language: data.language || 'az',
        signature: signature,
        ...urls,
      };

      logger.info('Creating Payriff payment:', {
        orderId: data.orderId,
        amount: amountInQepik,
        merchantId: this.merchantId,
      });

      const response = await fetch(`${this.apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Payriff API error:', errorData);
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const result = await response.json();

      return {
        success: true,
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
      };
    } catch (error) {
      logger.error('Payriff payment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PayriffTransactionStatus | null> {
    try {
      if (!this.merchantId || !this.secretKey) {
        throw new Error('Payriff credentials not configured');
      }

      const signString = `${this.merchantId}${transactionId}${this.secretKey}`;
      const signature = this.generateSignature(signString);

      const url = new URL(`${this.apiUrl}/transactions/${transactionId}`);
      url.searchParams.append('merchantId', this.merchantId);
      url.searchParams.append('signature', signature);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get transaction status');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Payriff transaction status error:', error);
      return null;
    }
  }

  verifyWebhookSignature(body: any, receivedSignature: string): boolean {
    try {
      // Provider signs the raw payload with the shared secret
      const computedSignature = this.generateSignature(JSON.stringify(body));
      
      // SECURITY: Use constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(receivedSignature, computedSignature);
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * SECURITY: Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  isConfigured(): boolean {
    return Boolean(
      this.merchantId &&
      this.secretKey &&
      !this.merchantId.includes('your-') &&
      !this.secretKey.includes('your-')
    );
  }

  /**
   * Compatibility wrapper used by legacy HTTP routes.
   * Creates an order and returns a payment URL using createPayment under the hood.
   */
  async createOrder(orderData: {
    amount: number;
    currency?: string;
    description: string;
    orderId: string;
    callbackUrl?: string;
    cancelUrl?: string;
  }): Promise<{ success: boolean; orderId?: string; paymentUrl?: string; error?: string }>{
    const result = await this.createPayment({
      amount: orderData.amount,
      orderId: orderData.orderId,
      description: orderData.description,
      language: 'az',
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      orderId: orderData.orderId,
      paymentUrl: result.paymentUrl,
    };
  }

  /**
   * Compatibility wrapper to verify webhook/callback signatures.
   */
  verifyCallback(body: any, signature: string): boolean {
    return this.verifyWebhookSignature(body, signature);
  }

  /**
   * Attempts to map an orderId to a transaction status by querying
   * the transaction status endpoint with the provided identifier.
   * If the API expects a transactionId, this will work only when
   * orderId equals transactionId; otherwise returns 'unknown'.
   */
  async getPaymentStatus(orderId: string): Promise<'pending' | 'approved' | 'declined' | 'cancelled' | 'unknown'> {
    const status = await this.getTransactionStatus(orderId);
    return status?.status ?? 'unknown';
  }

  /**
   * Refunds are not implemented against the upstream API in this project.
   * Provided for compatibility with existing routes; returns false.
   */
  async refundPayment(_orderId: string, _amount?: number): Promise<boolean> {
    logger.warn('refundPayment is not implemented');
    return false;
  }
}

export const payriffService = new PayriffService();
