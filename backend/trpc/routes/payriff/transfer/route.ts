import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';

export const transferProcedure = protectedProcedure
  .input(
    z.object({
      toMerchant: z.string(),
      amount: z.number().positive(),
      description: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const merchantId = config.PAYRIFF_MERCHANT_ID;
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    if (!merchantId || !secretKey) {
      throw new Error('Payriff credentials not configured');
    }

    const requestBody = {
      merchant: merchantId,
      body: {
        toMerchant: input.toMerchant,
        amount: input.amount,
        description: input.description,
      },
    };

    console.log('Transfer request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/v2/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Transfer error:', errorData);
      throw new Error(errorData.message || 'Failed to transfer money');
    }

    const data = await response.json();
    console.log('Transfer response:', JSON.stringify(data, null, 2));

    return data;
  });
