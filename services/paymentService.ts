import config from '@/constants/config';
import { Platform } from 'react-native';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret?: string;
}

class PaymentService {
  private stripeKey: string;
  private paypalClientId: string;
  private payriffMerchantId: string;
  private payriffApiUrl: string;

  constructor() {
    this.stripeKey = config.STRIPE_PUBLISHABLE_KEY as string;
    this.paypalClientId = config.PAYPAL_CLIENT_ID as string;
    this.payriffMerchantId = config.PAYRIFF_MERCHANT_ID as string;
    this.payriffApiUrl = config.PAYRIFF_API_URL as string;
  }

  async initializeStripe() {
    if (Platform.OS === 'web') {
      // Web Stripe initialization
      if (typeof window !== 'undefined' && !(window as any).Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
          script.onload = () => {
            (window as any).Stripe = (window as any).Stripe(this.stripeKey);
            resolve((window as any).Stripe);
          };
        });
      }
      return (window as any).Stripe;
    } else {
      // Mobile Stripe initialization would require expo-stripe or similar
      console.log('Mobile Stripe initialization - requires expo-stripe package');
      return null;
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/methods/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  }

  async processPayPalPayment(amount: number, currency: string = 'USD') {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/paypal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PayPal payment');
      }

      return await response.json();
    } catch (error) {
      console.error('PayPal payment failed:', error);
      throw error;
    }
  }

  async createPayriffOrder(amount: number, currency: string = 'AZN', userId: string, description?: string) {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/payriff/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          userId,
          description: description || 'Wallet top-up',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create Payriff order');
      }

      return await response.json();
    } catch (error) {
      console.error('Payriff payment failed:', error);
      throw error;
    }
  }

  async getPayriffPaymentStatus(orderId: string) {
    try {
      const response = await fetch(`${config.BASE_URL}/payments/payriff/status/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Payriff payment status:', error);
      throw error;
    }
  }

  isPayriffConfigured(): boolean {
    return !this.payriffMerchantId.includes('your-');
  }

  isConfigured(): boolean {
    return !this.stripeKey.includes('your-') && !this.paypalClientId.includes('your-');
  }
}

export const paymentService = new PaymentService();