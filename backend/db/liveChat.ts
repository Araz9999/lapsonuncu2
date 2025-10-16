import { LiveChatMessage, LiveChatConversation, SupportAgent } from '@/types/liveChat';
import { logger } from '../../utils/logger';

import { logger } from '@/utils/logger';
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
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Getting conversations for user:', userId);
      const userConvs = Array.from(conversations.values())
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      logger.debug('[LiveChatDB] Found conversations:', userConvs.length);
      return userConvs;
    },
    create: (conversation: LiveChatConversation) => {
      logger.debug('[LiveChatDB] Creating conversation:', conversation.id);

      logger.info('[LiveChatDB] Getting conversations for user:', userId);
      const userConvs = Array.from(conversations.values())
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      logger.info('[LiveChatDB] Found conversations:', userConvs.length);
      return userConvs;
    },
    create: (conversation: LiveChatConversation) => {
      logger.info('[LiveChatDB] Creating conversation:', conversation.id);
> Araz
      conversations.set(conversation.id, conversation);
      messages.set(conversation.id, []);
      return conversation;
    },
    update: (id: string, updates: Partial<LiveChatConversation>) => {
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Updating conversation:', id, updates);
=======
      logger.info('[LiveChatDB] Updating conversation:', id, updates);
> Araz
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
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Deleting conversation:', id);
 logger.info('[LiveChatDB] Deleting conversation:', id);
> Araz
      const deleted = conversations.delete(id);
      messages.delete(id);
      return deleted;
    },
  },
  
  messages: {
    getAll: () => Array.from(messageIndex.values()),
    getById: (id: string) => messageIndex.get(id) || null,
    getByConversationId: (conversationId: string) => {
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Getting messages for conversation:', conversationId);
      const convMessages = messages.get(conversationId) || [];
      logger.debug('[LiveChatDB] Found messages:', convMessages.length);
  logger.info('[LiveChatDB] Getting messages for conversation:', conversationId);
      const convMessages = messages.get(conversationId) || [];
      logger.info('[LiveChatDB] Found messages:', convMessages.length);
> Araz
      return [...convMessages].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
    create: (message: LiveChatMessage) => {
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Creating message:', message.id, 'in conversation:', message.conversationId);
logger.info('[LiveChatDB] Creating message:', message.id, 'in conversation:', message.conversationId);
> Araz
      const convMessages = messages.get(message.conversationId) || [];
      
      const exists = convMessages.find(m => m.id === message.id);
      if (exists) {
        logger.warn('[LiveChatDB] Message already exists:', message.id);
        return exists;
      }
      
      convMessages.push(message);
      messages.set(message.conversationId, convMessages);
      messageIndex.set(message.id, message);
      
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Message created. Total messages in conversation:', convMessages.length);
      return message;
    },
    updateStatus: (id: string, status: LiveChatMessage['status']) => {
      logger.debug('[LiveChatDB] Updating message status:', id, 'to', status);
=======
      logger.info('[LiveChatDB] Message created. Total messages in conversation:', convMessages.length);
      return message;
    },
    updateStatus: (id: string, status: LiveChatMessage['status']) => {
      logger.info('[LiveChatDB] Updating message status:', id, 'to', status);
> Araz
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
< cursor/fix-many-bugs-and-errors-4e56
      logger.debug('[LiveChatDB] Deleting message:', id);

      logger.info('[LiveChatDB] Deleting message:', id);
> Araz
      const message = messageIndex.get(id);
      if (message) {
        const convMessages = messages.get(message.conversationId);
        if (convMessages) {
          const filtered = convMessages.filter(m => m.id !== id);
          messages.set(message.conversationId, filtered);
        }
        messageIndex.delete(id);
        return true;
      }
      return false;
    },
  },
  
  agents: {
    getAll: () => supportAgents,
    getAvailable: () => supportAgents.filter(a => a.status === 'online').sort((a, b) => a.activeChats - b.activeChats),
    getById: (id: string) => supportAgents.find(a => a.id === id),
    updateStatus: (id: string, status: SupportAgent['status']) => {
      const agent = supportAgents.find(a => a.id === id);
      if (agent) {
        agent.status = status;
        return agent;
      }
      return null;
    },
    incrementActiveChats: (id: string) => {
      const agent = supportAgents.find(a => a.id === id);
      if (agent) {
        agent.activeChats++;
        return agent;
      }
      return null;
    },
    decrementActiveChats: (id: string) => {
      const agent = supportAgents.find(a => a.id === id);
      if (agent) {
        agent.activeChats = Math.max(0, agent.activeChats - 1);
        return agent;
      }
      return null;
    },
  },
};
