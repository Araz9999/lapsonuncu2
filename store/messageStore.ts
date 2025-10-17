import { create } from 'zustand';
import { Message } from '@/types/message';
import { users } from '@/mocks/users';
import { listings } from '@/mocks/listings';
import { useUserStore } from './userStore';

import { logger } from '@/utils/logger';
export interface Conversation {
  id: string;
  participants: string[];
  listingId: string;
  lastMessage?: string;
  lastMessageDate?: string;
  unreadCount: number;
  messages: Message[];
}

interface MessageStore {
  conversations: Conversation[];
  addMessage: (conversationId: string, message: Message) => void;
  markAsRead: (conversationId: string) => void;
  getConversation: (conversationId: string) => Conversation | undefined;
  createConversation: (participants: string[], listingId: string) => string;
  getOrCreateConversation: (participants: string[], listingId: string) => string;
  simulateIncomingMessage: () => void;
  getFilteredConversations: () => Conversation[];
  deleteMessage: (conversationId: string, messageId: string) => void;
  deleteAllMessagesFromUser: (userId: string) => void;
}

// Mock initial conversations with messages
const initialConversations: Conversation[] = [
  {
    id: '1',
    participants: ['user1', 'user2'],
    listingId: '2',
    lastMessage: 'Əlavə şəkillər göndərə bilərsinizmi?',
    lastMessageDate: '2023-06-20T14:35:00.000Z',
    unreadCount: 1,
    messages: [
      {
        id: '1',
        senderId: 'user2',
        receiverId: 'user1',
        listingId: '2',
        text: 'Salam, bu mənzil hələ satılırmı?',
        type: 'text',
        createdAt: '2023-06-20T14:30:00.000Z',
        isRead: true,
        isDelivered: true,
      },
      {
        id: '2',
        senderId: 'user1',
        receiverId: 'user2',
        listingId: '2',
        text: 'Salam! Bəli, hələ satılır.',
        type: 'text',
        createdAt: '2023-06-20T14:32:00.000Z',
        isRead: true,
        isDelivered: true,
      },
      {
        id: '3',
        senderId: 'user2',
        receiverId: 'user1',
        listingId: '2',
        text: 'Əlavə şəkillər göndərə bilərsinizmi?',
        type: 'text',
        createdAt: '2023-06-20T14:35:00.000Z',
        isRead: false,
        isDelivered: true,
      },
    ],
  },
  {
    id: '2',
    participants: ['user1', 'user3'],
    listingId: '3',
    lastMessage: 'Qiymətdə endirim mümkündürmü?',
    lastMessageDate: '2023-06-19T10:15:00.000Z',
    unreadCount: 0,
    messages: [
      {
        id: '4',
        senderId: 'user3',
        receiverId: 'user1',
        listingId: '3',
        text: 'Qiymətdə endirim mümkündürmü?',
        type: 'text',
        createdAt: '2023-06-19T10:15:00.000Z',
        isRead: true,
        isDelivered: true,
      },
    ],
  },
  {
    id: '3',
    participants: ['user1', 'user4'],
    listingId: '1',
    lastMessage: 'Telefon hələ satılırmı?',
    lastMessageDate: '2023-06-18T18:45:00.000Z',
    unreadCount: 0,
    messages: [
      {
        id: '5',
        senderId: 'user4',
        receiverId: 'user1',
        listingId: '1',
        text: 'Telefon hələ satılırmı?',
        type: 'text',
        createdAt: '2023-06-18T18:45:00.000Z',
        isRead: true,
        isDelivered: true,
      },
    ],
  },
];

export const useMessageStore = create<MessageStore>((set, get) => ({
  conversations: initialConversations,
  
  addMessage: (conversationId: string, message: Message) => {
    logger.debug('MessageStore - addMessage called:', { 
      conversationId, 
      messageText: message.text || '[empty]', 
      hasAttachments: message.attachments?.length || 0,
      messageType: message.type 
    });
    
    // Validate message before adding - allow attachments without text
    const hasText = message.text && message.text.trim().length > 0;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    
    if (!hasText && !hasAttachments) {
      logger.debug('MessageStore - Rejecting empty message with no attachments');
      return;
    }
    
    set((state) => {
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex === -1) {
        logger.debug('MessageStore - Conversation not found:', conversationId);
        return state;
      }
      
      const conversation = state.conversations[conversationIndex];
      
      // Ensure no duplicate messages
      const existingMessage = conversation.messages.find(m => m.id === message.id);
      if (existingMessage) {
        logger.debug('MessageStore - Message already exists, skipping:', message.id);
        return state;
      }
      
      // Create new message with proper timestamp
      const newMessage = {
        ...message,
        createdAt: message.createdAt || new Date().toISOString()
      };
      
      const updatedMessages = [...conversation.messages, newMessage];
      const lastMessage = newMessage.text?.trim() || 
        (newMessage.attachments?.length ? 
          (newMessage.attachments[0].type === 'audio' ? 'Səs mesajı' : 
           newMessage.attachments[0].type === 'image' ? 'Şəkil göndərildi' :
           'Fayl göndərildi') : 
          '');
      
      const currentUserId = useUserStore.getState().currentUser?.id || 'user1';
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        lastMessage,
        lastMessageDate: newMessage.createdAt,
        // Increment unread count only when the message is from the other user
        unreadCount: newMessage.senderId !== currentUserId
          ? conversation.unreadCount + 1
          : conversation.unreadCount,
      };
      
      const updatedConversations = [...state.conversations];
      updatedConversations[conversationIndex] = updatedConversation;
      
      logger.debug('MessageStore - updating conversation:', conversation.id, 'with message:', newMessage.text?.trim() || 'attachment');
      logger.debug('MessageStore - conversation messages after update:', updatedConversation.messages.length);
      
      // Force state update by creating completely new state object
      return { 
        conversations: updatedConversations.map(conv => ({ 
          ...conv,
          messages: conv.id === conversationId ? [...updatedConversation.messages] : [...conv.messages]
        })) 
      };
    });
  },
  
  markAsRead: (conversationId: string) => {
    set((state) => {
      const conversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = conv.messages.map((msg) => ({
            ...msg,
            isRead: true,
          }));
          return {
            ...conv,
            messages: updatedMessages,
            unreadCount: 0,
          };
        }
        return conv;
      });
      
      
      return { conversations };
    });
  },
  
  getConversation: (conversationId: string) => {
    return get().conversations.find((conv) => conv.id === conversationId);
  },
  
  createConversation: (participants: string[], listingId: string) => {
    // BUG FIX: Validate input parameters
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      logger.error('[MessageStore] Invalid participants for conversation');
      throw new Error('Conversation must have at least 2 participants');
    }
    
    if (!listingId) {
      logger.error('[MessageStore] Invalid listingId for conversation');
      throw new Error('ListingId is required');
    }
    
    // BUG FIX: Generate unique ID with random component to prevent conflicts
    const conversationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newConversation: Conversation = {
      id: conversationId,
      participants,
      listingId,
      unreadCount: 0,
      messages: [],
    };
    
    set((state) => ({
      conversations: [...state.conversations, newConversation],
    }));
    
    logger.info('[MessageStore] Conversation created:', conversationId);
    return conversationId;
  },
  
  getOrCreateConversation: (participants: string[], listingId: string) => {
    const state = get();
    const existingConv = state.conversations.find((conv) => 
      conv.participants.length === participants.length &&
      conv.participants.every((p) => participants.includes(p))
    );
    
    if (existingConv) {
      logger.debug('MessageStore - Found existing conversation:', existingConv.id);
      return existingConv.id;
    }
    
    logger.debug('MessageStore - Creating new conversation for participants:', participants);
    const newId = state.createConversation(participants, listingId);
    logger.debug('MessageStore - Created new conversation with ID:', newId);
    return newId;
  },
  
  simulateIncomingMessage: () => {
    const incomingMessages = [
      'Salam, bu elan hələ aktualdırmı?',
      'Qiymət barədə danışa bilərikmi?',
      'Şəkillər çox gözəldir, görüşə bilərəmmi?',
      'Bu məhsul hələ satılırmı?',
      'Endirim mümkündürmü?',
      'Çatdırılma xidmətiniz varmı?',
      'Əlavə məlumat verə bilərsinizmi?',
      'Bu qiymət son qiymətdirmi?',
    ];
    
    const state = get();
    const randomConversation = state.conversations[Math.floor(Math.random() * state.conversations.length)];
    const randomMessage = incomingMessages[Math.floor(Math.random() * incomingMessages.length)];
    const currentUserId = useUserStore.getState().currentUser?.id || 'user1';
    const otherUserId = randomConversation.participants.find(id => id !== currentUserId);
    
    if (randomConversation && otherUserId) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: otherUserId,
        receiverId: currentUserId,
        listingId: randomConversation.listingId,
        text: randomMessage,
        type: 'text',
        createdAt: new Date().toISOString(),
        isRead: false,
        isDelivered: true,
      };
      
      get().addMessage(randomConversation.id, newMessage);
    }
  },
  
  getFilteredConversations: () => {
    const { conversations } = get();
    const { isUserBlocked } = useUserStore.getState();
    
    return conversations.filter(conversation => {
      const currentUserId = useUserStore.getState().currentUser?.id || 'user1';
      const otherUserId = conversation.participants.find(id => id !== currentUserId);
      return otherUserId ? !isUserBlocked(otherUserId) : true;
    });
  },
  
  deleteMessage: (conversationId: string, messageId: string) => {
    logger.debug('MessageStore - deleteMessage called:', { conversationId, messageId });
    
    // BUG FIX: Validate input parameters
    if (!conversationId || !messageId) {
      logger.error('[MessageStore] Invalid parameters for deleteMessage');
      return;
    }
    
    set((state) => {
      const conversationIndex = state.conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex === -1) {
        logger.warn('MessageStore - Conversation not found for deletion:', conversationId);
        return state;
      }
      
      const conversation = state.conversations[conversationIndex];
      
      // BUG FIX: Check if message exists before deleting
      const messageExists = conversation.messages.some(msg => msg.id === messageId);
      if (!messageExists) {
        logger.warn('MessageStore - Message not found for deletion:', messageId);
        return state;
      }
      
      const updatedMessages = conversation.messages.filter(msg => msg.id !== messageId);
      
      // Update last message if the deleted message was the last one
      let lastMessage = conversation.lastMessage;
      let lastMessageDate = conversation.lastMessageDate;
      
      if (updatedMessages.length > 0) {
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        lastMessage = lastMsg.text?.trim() || 
          (lastMsg.attachments?.length ? 
            (lastMsg.attachments[0].type === 'audio' ? 'Səs mesajı' : 
             lastMsg.attachments[0].type === 'image' ? 'Şəkil göndərildi' :
             'Fayl göndərildi') : 
            '');
        lastMessageDate = lastMsg.createdAt;
      } else {
        lastMessage = undefined;
        lastMessageDate = undefined;
      }
      
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        lastMessage,
        lastMessageDate,
      };
      
      const updatedConversations = [...state.conversations];
      updatedConversations[conversationIndex] = updatedConversation;
      
      logger.debug('MessageStore - Message deleted, remaining messages:', updatedMessages.length);
      
      return { 
        conversations: updatedConversations.map(conv => ({ ...conv })) 
      };
    });
  },
  
  deleteAllMessagesFromUser: (userId: string) => {
    logger.debug('MessageStore - deleteAllMessagesFromUser called:', userId);
    
    set((state) => {
      const updatedConversations = state.conversations.map(conversation => {
        // Check if this conversation involves the specified user
        if (!conversation.participants.includes(userId)) {
          return conversation;
        }
        
        // Remove all messages from this user
        const updatedMessages = conversation.messages.filter(msg => msg.senderId !== userId);
        
        // Update last message and date
        let lastMessage = conversation.lastMessage;
        let lastMessageDate = conversation.lastMessageDate;
        
        if (updatedMessages.length > 0) {
          const lastMsg = updatedMessages[updatedMessages.length - 1];
          lastMessage = lastMsg.text?.trim() || 
            (lastMsg.attachments?.length ? 
              (lastMsg.attachments[0].type === 'audio' ? 'Səs mesajı' : 
               lastMsg.attachments[0].type === 'image' ? 'Şəkil göndərildi' :
               'Fayl göndərildi') : 
              '');
          lastMessageDate = lastMsg.createdAt;
        } else {
          lastMessage = undefined;
          lastMessageDate = undefined;
        }
        
        return {
          ...conversation,
          messages: updatedMessages,
          lastMessage,
          lastMessageDate,
          unreadCount: 0, // Reset unread count since we're deleting messages
        };
      });
      
      logger.debug('MessageStore - All messages from user deleted:', userId);
      
      return { 
        conversations: updatedConversations.map(conv => ({ ...conv })) 
      };
    });
  },
}));