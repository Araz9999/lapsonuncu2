import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import config from "@/constants/config";
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

export const getWalletByIdProcedure = publicProcedure
  .input(
    z.object({
      id: z.number(),
    })
  )
  .query(async ({ input }) => {
    try {
      const merchantId = config.PAYRIFF_MERCHANT_ID;
      const secretKey = config.PAYRIFF_SECRET_KEY;
      const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

      console.log('Fetching wallet by ID:', input.id);

      const response = await fetch(`${baseUrl}/api/v2/wallet/${input.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': secretKey as string,
        },
      });

      const data: PayriffResponse = await response.json();
      console.log('Get wallet by ID response:', JSON.stringify(data, null, 2));

      if (!response.ok || !isPayriffSuccess(data)) {
        const errorMessage = getPayriffErrorMessage(data);
        console.error('Get wallet by ID error:', errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Payriff get wallet by ID failed:', error);
      throw error;
    }
  });
