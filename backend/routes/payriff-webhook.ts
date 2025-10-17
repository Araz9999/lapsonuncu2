import { Hono } from 'hono';
import { logger } from '../../utils/logger';
import { secureHeaders } from 'hono/secure-headers';
import { payriffService } from '../services/payriff';
const payriffWebhook = new Hono();
payriffWebhook.use('*', secureHeaders());

payriffWebhook.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header('x-payriff-signature') || '';

    // Avoid logging sensitive payloads

    const isValid = payriffService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      logger.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const { transactionId, orderId, status } = body;

    if (status === 'approved') {
      logger.info(`Payment approved: Order ${orderId}`);
    } else if (status === 'declined') {
      logger.info(`Payment declined: Order ${orderId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export default payriffWebhook;
