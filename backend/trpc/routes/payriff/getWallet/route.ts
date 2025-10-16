import { publicProcedure } from "../../../create-context";
import config from "@/constants/config";
import { PayriffResponse, isPayriffSuccess, getPayriffErrorMessage } from '@/constants/payriffCodes';

import { logger } from '@/utils/logger';
export const getWalletProcedure = publicProcedure.query(async () => {
  try {
    const merchantId = config.PAYRIFF_MERCHANT_ID;
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    // Avoid verbose logs in production

    const response = await fetch(`${baseUrl}/api/v2/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey as string,
      },
    });

    const data: PayriffResponse = await response.json();

    if (!response.ok || !isPayriffSuccess(data)) {
      const errorMessage = getPayriffErrorMessage(data);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    logger.error('Payriff get wallet failed');
    throw error;
  }
});
