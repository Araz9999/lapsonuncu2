import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

export const refundProcedure = protectedProcedure
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

    console.log('Refund request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/v3/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data: PayriffResponse = await response.json();
    console.log('Refund response:', JSON.stringify(data, null, 2));

    if (!response.ok || !isPayriffSuccess(data)) {
      const errorMessage = getPayriffErrorMessage(data);
      console.error('Refund error:', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  });
