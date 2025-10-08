import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

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

    const data: PayriffResponse = await response.json();
    console.log('Get order response:', JSON.stringify(data, null, 2));

    if (!response.ok || !isPayriffSuccess(data)) {
      const errorMessage = getPayriffErrorMessage(data);
      console.error('Get order error:', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  });
