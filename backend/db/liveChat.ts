import { LiveChatMessage, LiveChatConversation, SupportAgent } from '@/types/liveChat';

const conversations: LiveChatConversation[] = [];
const messages: LiveChatMessage[] = [];

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
    getAll: () => conversations,
    getById: (id: string) => conversations.find(c => c.id === id),
    getByUserId: (userId: string) => conversations.filter(c => c.userId === userId),
    create: (conversation: LiveChatConversation) => {
      conversations.unshift(conversation);
      return conversation;
    },
    update: (id: string, updates: Partial<LiveChatConversation>) => {
      const index = conversations.findIndex(c => c.id === id);
      if (index !== -1) {
        conversations[index] = { ...conversations[index], ...updates, updatedAt: new Date().toISOString() };
        return conversations[index];
      }
      return null;
    },
    delete: (id: string) => {
      const index = conversations.findIndex(c => c.id === id);
      if (index !== -1) {
        conversations.splice(index, 1);
        return true;
      }
      return false;
    },
  },
  
  messages: {
    getAll: () => messages,
    getById: (id: string) => messages.find(m => m.id === id),
    getByConversationId: (conversationId: string) => 
      messages.filter(m => m.conversationId === conversationId).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    create: (message: LiveChatMessage) => {
      messages.push(message);
      return message;
    },
    updateStatus: (id: string, status: LiveChatMessage['status']) => {
      const message = messages.find(m => m.id === id);
      if (message) {
        message.status = status;
        return message;
      }
      return null;
    },
    delete: (id: string) => {
      const index = messages.findIndex(m => m.id === id);
      if (index !== -1) {
        messages.splice(index, 1);
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
