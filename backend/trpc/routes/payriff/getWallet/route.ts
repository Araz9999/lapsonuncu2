import { publicProcedure } from "../../../create-context";
import config from "@/constants/config";

export const getWalletProcedure = publicProcedure.query(async () => {
  try {
    const merchantId = config.PAYRIFF_MERCHANT_ID;
    const secretKey = config.PAYRIFF_SECRET_KEY;
    const baseUrl = config.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    console.log('Fetching wallet data...');

    const response = await fetch(`${baseUrl}/api/v2/wallet`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': secretKey as string,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Get wallet error:', errorData);
      throw new Error(errorData.message || 'Failed to get wallet data');
    }

    const data = await response.json();
    console.log('Get wallet response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('Payriff get wallet failed:', error);
    throw error;
  }
});
