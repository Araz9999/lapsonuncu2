import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { payriffService } from '../../../../services/payriff';

export const getTransactionStatusProcedure = publicProcedure
  .input(
    z.object({
      transactionId: z.string().min(1).describe('Payriff transaction ID'),
    })
  )
  .query(async ({ input }) => {
    console.log('Getting Payriff transaction status:', input.transactionId);

    const status = await payriffService.getTransactionStatus(input.transactionId);

    if (!status) {
      throw new Error('Transaction not found');
    }

    return status;
  });
