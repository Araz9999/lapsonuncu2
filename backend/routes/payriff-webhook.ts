import { Hono } from 'hono';
import { payriffService } from '../services/payriff';

const payriffWebhook = new Hono();

payriffWebhook.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header('x-payriff-signature') || '';

    console.log('Payriff webhook received:', {
      transactionId: body.transactionId,
      orderId: body.orderId,
      status: body.status,
    });

    const isValid = payriffService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const { transactionId, orderId, status } = body;

    if (status === 'approved') {
      console.log(`Payment approved: Order ${orderId}, Transaction ${transactionId}`);
    } else if (status === 'declined') {
      console.log(`Payment declined: Order ${orderId}, Transaction ${transactionId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export default payriffWebhook;
