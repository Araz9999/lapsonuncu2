import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { liveChatDb } from '../../../../db/liveChat';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(({ input }) => {
    const conversations = liveChatDb.conversations.getByUserId(input.userId);
    return conversations;
  });
