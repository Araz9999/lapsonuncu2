import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';

export const topupProcedure = protectedProcedure
  .input(
    z.object({
      phoneNumber: z.string(),
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
        phoneNumber: input.phoneNumber,
        amount: input.amount,
        description: input.description,
      },
    };

    console.log('Topup request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/v2/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Topup error:', errorData);
      throw new Error(errorData.message || 'Failed to topup MPAY wallet');
    }

    const data = await response.json();
    console.log('Topup response:', JSON.stringify(data, null, 2));

    return data;
  });
