import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import config from '@/constants/config';

export const getInvoiceProcedure = protectedProcedure
  .input(
    z.object({
      uuid: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const merchantId = config.PAYRIFF_MERCHANT_ID;
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    if (!merchantId || !secretKey) {
      throw new Error('Payriff credentials not configured');
    }

    const requestBody = {
      merchant: merchantId,
      body: {
        uuid: input.uuid,
      },
    };

    console.log('Get invoice request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${baseUrl}/api/v2/get-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Get invoice error:', errorData);
      throw new Error(errorData.message || 'Failed to get invoice');
    }

    const data = await response.json();
    console.log('Get invoice response:', JSON.stringify(data, null, 2));

    return data;
  });
