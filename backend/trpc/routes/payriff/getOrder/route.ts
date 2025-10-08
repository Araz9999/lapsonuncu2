import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';

export const getOrderProcedure = protectedProcedure
  .input(
    z.object({
      orderId: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    if (!secretKey) {
      throw new Error('Payriff credentials not configured');
    }

    console.log('Get order request:', input.orderId);

    const response = await fetch(`${baseUrl}/api/v3/orders/${input.orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Get order error:', errorData);
      throw new Error(errorData.message || 'Failed to get order information');
    }

    const data = await response.json();
    console.log('Get order response:', JSON.stringify(data, null, 2));

    return data;
  });
