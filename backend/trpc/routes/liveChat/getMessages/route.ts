import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { liveChatDb } from '../../../../db/liveChat';

export default publicProcedure
  .input(z.object({
    conversationId: z.string(),
  }))
  .query(({ input }) => {
    const messages = liveChatDb.messages.getByConversationId(input.conversationId);
    return messages;
  });
