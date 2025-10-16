import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import config from '@/constants/config';
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

import { logger } from '@/utils/logger';
export const topupProcedure = publicProcedure
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

    // Avoid logging sensitive request bodies

    const response = await fetch(`${baseUrl}/api/v2/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data: PayriffResponse = await response.json();

    if (!response.ok || !isPayriffSuccess(data)) {
      const errorMessage = getPayriffErrorMessage(data);
      logger.error('Topup error:', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  });
