import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import config from '@/constants/config';
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

export const createOrderProcedure = publicProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      language: z.enum(['EN', 'AZ', 'RU']).optional(),
      currency: z.enum(['AZN', 'USD', 'EUR']).optional(),
      description: z.string(),
      callbackUrl: z.string().optional(),
      cardSave: z.boolean().optional(),
      operation: z.enum(['PURCHASE', 'PRE_AUTH']).optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';
    const frontendUrl = config.FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';

    if (!secretKey) {
      throw new Error('Payriff credentials not configured');
    }

    const requestBody = {
      amount: input.amount,
      language: input.language || 'EN',
      currency: input.currency || 'AZN',
      description: input.description,
      callbackUrl: input.callbackUrl || `${frontendUrl}/payment/success`,
      cardSave: input.cardSave || false,
      operation: input.operation || 'PURCHASE',
      metadata: input.metadata,
    };

    // Avoid logging sensitive request bodies

    const response = await fetch(`${baseUrl}/api/v3/orders`, {
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
      console.error('Create order error:', errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  });
