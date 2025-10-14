import { Hono } from 'hono';
import { payriffService } from '../services/payriff';
import { z } from 'zod';
import crypto from 'crypto';
import { secureHeaders } from 'hono/secure-headers';

const payments = new Hono();
payments.use('*', secureHeaders());

payments.post('/payriff/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.enum(['AZN', 'USD', 'EUR']).default('AZN').optional(),
      description: z.string().min(1).optional(),
      userId: z.string().min(1),
    });
    const { amount, currency = 'AZN', description, userId } = schema.parse(body);

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    const orderId = `ORDER-${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
    
    const orderData = {
      amount,
      currency,
      description: description || 'Wallet top-up',
      orderId,
      callbackUrl: `${frontendUrl}/api/payments/payriff/callback`,
      cancelUrl: `${frontendUrl}/wallet?payment=canceled`,
    };

    const result = await payriffService.createOrder(orderData);

    if (!result.success) {
      return c.json({ error: result.error || 'Failed to create order' }, 500);
    }

    return c.json({
      success: true,
      orderId: result.orderId,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error('Create Payriff order error');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

payments.post('/payriff/callback', async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header('X-Signature') || '';

    const isValid = payriffService.verifyCallback(body, signature);

    if (!isValid) {
      console.error('Invalid Payriff callback signature');
      return c.json({ error: 'Invalid signature' }, 400);
    }

    const { orderId, status, amount, currency } = body;
    // Never include PAN or card details in logs

    if (status === 'APPROVED') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      return c.redirect(`${frontendUrl}/wallet?payment=success&orderId=${orderId}&amount=${amount / 100}`);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      return c.redirect(`${frontendUrl}/wallet?payment=failed&orderId=${orderId}`);
    }
  } catch (error) {
    console.error('Payriff callback error');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

payments.get('/payriff/status/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');

    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }

    const status = await payriffService.getPaymentStatus(orderId);

    return c.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get payment status error');
    return c.json({ error: 'Failed to get payment status' }, 500);
  }
});

payments.post('/payriff/refund', async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      orderId: z.string().min(1),
      amount: z.number().positive().optional(),
    });
    const { orderId, amount } = schema.parse(body);

    if (!orderId) {
      return c.json({ error: 'Order ID is required' }, 400);
    }

    const success = await payriffService.refundPayment(orderId, amount);

    if (!success) {
      return c.json({ error: 'Refund failed' }, 500);
    }

    return c.json({
      success: true,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Refund error');
    return c.json({ error: 'Failed to process refund' }, 500);
  }
});

export default payments;
