import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { liveChatDb } from '../../../../db/liveChat';
import { LiveChatMessage } from '@/types/liveChat';

export default publicProcedure
  .input(z.object({
    conversationId: z.string(),
    senderId: z.string(),
    senderName: z.string(),
    senderAvatar: z.string().optional(),
    message: z.string(),
    isSupport: z.boolean(),
  }))
  .mutation(({ input }) => {
    const message: LiveChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderAvatar: input.senderAvatar,
      message: input.message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      isSupport: input.isSupport,
    };
    
    const created = liveChatDb.messages.create(message);
    
    liveChatDb.conversations.update(input.conversationId, {
      lastMessage: input.message,
      lastMessageTime: message.timestamp,
    });
    
    setTimeout(() => {
      liveChatDb.messages.updateStatus(message.id, 'delivered');
    }, 500);
    
    setTimeout(() => {
      liveChatDb.messages.updateStatus(message.id, 'seen');
    }, 2000);
    
    return created;
  });
