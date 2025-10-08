import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';

export const completeProcedure = protectedProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      orderId: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    if (!secretKey) {
      throw new Error('Payriff credentials not configured');
    }

    const requestBody = {
      amount: input.amount,
      orderId: input.orderId,
    };

    console.log('Complete request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/v3/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Complete error:', errorData);
      throw new Error(errorData.message || 'Failed to complete payment');
    }

    const data = await response.json();
    console.log('Complete response:', JSON.stringify(data, null, 2));

    return data;
  });
