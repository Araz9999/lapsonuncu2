import { LiveChatMessage, LiveChatConversation, SupportAgent } from '@/types/liveChat';
import { logger } from '../../utils/logger';
const conversations: Map<string, LiveChatConversation> = new Map();
const messages: Map<string, LiveChatMessage[]> = new Map();
const messageIndex: Map<string, LiveChatMessage> = new Map();

const supportAgents: SupportAgent[] = [
  {
    id: 'agent-1',
    name: 'Support Agent',
    avatar: 'https://i.pravatar.cc/150?img=1',
    status: 'online',
    activeChats: 0,
  },
  {
    id: 'agent-2',
    name: 'Admin Support',
    avatar: 'https://i.pravatar.cc/150?img=2',
    status: 'online',
    activeChats: 0,
  },
];

export const liveChatDb = {
  conversations: {
    getAll: () => Array.from(conversations.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    getById: (id: string) => conversations.get(id) || null,
    getByUserId: (userId: string) => {
      logger.info('[LiveChatDB] Updating conversation:', id, updates);
      const conversation = conversations.get(id);
      if (conversation) {
        const updated = { ...conversation, ...updates, updatedAt: new Date().toISOString() };
        conversations.set(id, updated);
        return updated;
      }
      logger.warn('[LiveChatDB] Conversation not found:', id);
      return null;
    },
    delete: (id: string) => {
      logger.info('[LiveChatDB] Message created. Total messages in conversation:', convMessages.length);
      return message;
    },
    updateStatus: (id: string, status: LiveChatMessage['status']) => {
      logger.info('[LiveChatDB] Updating message status:', id, 'to', status);
      const message = messageIndex.get(id);
      if (message) {
        message.status = status;
        messageIndex.set(id, message);
        
        const convMessages = messages.get(message.conversationId);
        if (convMessages) {
          const index = convMessages.findIndex(m => m.id === id);
          if (index !== -1) {
            convMessages[index] = message;
            messages.set(message.conversationId, convMessages);
          }
        }
        return message;
      }
      logger.warn('[LiveChatDB] Message not found:', id);
      return null;
    },
    delete: (id: string) => {
