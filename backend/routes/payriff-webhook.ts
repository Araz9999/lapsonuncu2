import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { payriffService } from '../services/payriff';

const payriffWebhook = new Hono();
payriffWebhook.use('*', secureHeaders());

// FIXED: Add replay attack protection with in-memory cache
// For production, use Redis or similar distributed storage
const processedWebhooks = new Map<string, number>();
const WEBHOOK_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_EXPIRY_MS) {
      processedWebhooks.delete(id);
    }
  }
}, 60000);

payriffWebhook.post('/callback', async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header('x-payriff-signature') || '';
    const timestamp = c.req.header('x-payriff-timestamp');

    // Avoid logging sensitive payloads

    // SECURITY: Verify signature first
    const isValid = payriffService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // SECURITY: Verify timestamp to prevent replay attacks (5 minute window)
    if (timestamp) {
      const webhookTime = parseInt(timestamp, 10);
      const now = Date.now();
      if (isNaN(webhookTime) || Math.abs(now - webhookTime) > WEBHOOK_EXPIRY_MS) {
        console.error('Webhook timestamp too old or invalid');
        return c.json({ error: 'Invalid timestamp' }, 401);
      }
    }

    const { transactionId, orderId, status } = body;

    // SECURITY: Prevent replay attacks by tracking processed webhooks
    const webhookId = `${transactionId || orderId}_${status}`;
    if (processedWebhooks.has(webhookId)) {
      console.warn(`Duplicate webhook detected: ${webhookId}`);
      return c.json({ success: true, message: 'Already processed' });
    }

    // Mark as processed
    processedWebhooks.set(webhookId, Date.now());

    if (status === 'approved') {
      console.log(`Payment approved: Order ${orderId}`);
      // TODO: Update database, send notifications, etc.
    } else if (status === 'declined') {
      console.log(`Payment declined: Order ${orderId}`);
      // TODO: Update database, notify user, etc.
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Cleanup on process termination
process.on('SIGTERM', () => {
  processedWebhooks.clear();
});

export default payriffWebhook;
