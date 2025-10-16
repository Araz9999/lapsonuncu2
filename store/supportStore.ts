import { create } from 'zustand';
import { SupportTicket, SupportResponse, SupportCategory, LiveChat, LiveChatMessage, Operator, ChatNotification } from '@/types/support';
import { useNotificationStore } from '@/store/notificationStore';

import { logger } from '@/utils/logger';
interface SupportStore {
  tickets: SupportTicket[];
  categories: SupportCategory[];
  liveChats: LiveChat[];
  operators: Operator[];
  notifications: ChatNotification[];
  isLoading: boolean;
  
  // Ticket Actions
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => void;
  addResponse: (ticketId: string, response: Omit<SupportResponse, 'id' | 'createdAt'>) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  getTicketsByUser: (userId: string) => SupportTicket[];
  getTicketById: (ticketId: string) => SupportTicket | undefined;
  
  // Live Chat Actions
  startLiveChat: (userId: string, subject: string, category: string, priority: LiveChat['priority']) => string;
  sendMessage: (chatId: string, senderId: string, senderType: LiveChatMessage['senderType'], message: string, attachments?: string[]) => void;
  assignOperator: (chatId: string, operatorId: string) => void;
  closeLiveChat: (chatId: string) => void;
  setTyping: (chatId: string, userType: 'user' | 'operator', isTyping: boolean) => void;
  markMessagesAsRead: (chatId: string, userId: string) => void;
  getChatsByUser: (userId: string) => LiveChat[];
  getChatsByOperator: (operatorId: string) => LiveChat[];
  getAvailableOperators: () => Operator[];
  addNotification: (notification: Omit<ChatNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
}

const supportCategories: SupportCategory[] = [
  {
    id: '1',
    name: 'Texniki problem',
    nameRu: 'Техническая проблема',
    icon: 'Settings',
    description: 'Tətbiqdə texniki problemlər',
    descriptionRu: 'Технические проблемы в приложении'
  },
  {
    id: '2',
    name: 'Şikayət',
    nameRu: 'Жалоба',
    icon: 'AlertTriangle',
    description: 'İstifadəçi və ya elan şikayəti',
    descriptionRu: 'Жалоба на пользователя или объявление'
  },
  {
    id: '3',
    name: 'Təklif',
    nameRu: 'Предложение',
    icon: 'Lightbulb',
    description: 'Yaxşılaşdırma təklifləri',
    descriptionRu: 'Предложения по улучшению'
  },
  {
    id: '4',
    name: 'Ödəniş',
    nameRu: 'Оплата',
    icon: 'CreditCard',
    description: 'Ödəniş və faktura problemləri',
    descriptionRu: 'Проблемы с оплатой и счетами'
  },
  {
    id: '5',
    name: 'Digər',
    nameRu: 'Другое',
    icon: 'HelpCircle',
    description: 'Digər suallar',
    descriptionRu: 'Другие вопросы'
  }
];

// Mock operators data
const mockOperators: Operator[] = [
  {
    id: 'op1',
    name: 'Ayşə Məmmədova',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    isAvailable: true,
    activeChats: 2,
    maxChats: 5,
    specialties: ['texniki_problem', 'odenis'],
    rating: 4.8,
    totalChats: 1250,
    responseTime: 45
  },
  {
    id: 'op2',
    name: 'Rəşad Əliyev',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isOnline: true,
    isAvailable: true,
    activeChats: 1,
    maxChats: 4,
    specialties: ['sikayet', 'diger'],
    rating: 4.9,
    totalChats: 980,
    responseTime: 32
  },
  {
    id: 'op3',
    name: 'Leyla Həsənova',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    isAvailable: false,
    activeChats: 0,
    maxChats: 6,
    specialties: ['teklif', 'texniki_problem'],
    rating: 4.7,
    totalChats: 1450,
    responseTime: 28
  }
];

export const useSupportStore = create<SupportStore>((set, get) => ({
  tickets: [],
  categories: supportCategories,
  liveChats: [],
  operators: mockOperators,
  notifications: [],
  isLoading: false,

  createTicket: (ticketData) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
      status: 'open'
    };

    set((state) => ({
      tickets: [newTicket, ...state.tickets]
    }));

    // Add notification to main notification system
    try {
      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        type: 'general',
        title: 'Müraciət Göndərildi',
        message: `"${ticketData.subject}" mövzusunda müraciətiniz qəbul edildi`,
        data: { ticketId: newTicket.id, type: 'support_ticket' }
      });
    } catch (error) {
      logger.debug('Notification store not available:', error);
    }

    // Simulate admin auto-response after 2 seconds
    setTimeout(() => {
      const store = get();
      const responseMessage = ticketData.category === '1' 
        ? 'Texniki problemlə bağlı müraciətiniz qəbul edildi. Tezliklə cavab veriləcək.'
        : 'Müraciətiniz qəbul edildi və araşdırılır. 24 saat ərzində cavab veriləcək.';
      
      store.addResponse(newTicket.id, {
        ticketId: newTicket.id,
        userId: 'admin',
        message: responseMessage,
        isAdmin: true
      });
      
      // Add notification for admin response
      try {
        const notificationStore = useNotificationStore.getState();
        notificationStore.addNotification({
          type: 'message',
          title: 'Dəstək Cavabı',
          message: responseMessage.substring(0, 50) + '...',
          fromUserName: 'Dəstək Komandası',
          data: { ticketId: newTicket.id, type: 'support_response' }
        });
      } catch (error) {
        logger.debug('Notification store not available:', error);
      }
    }, 2000);
  },

  addResponse: (ticketId, responseData) => {
    const newResponse: SupportResponse = {
      ...responseData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    set((state) => ({
      tickets: state.tickets.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              responses: [...ticket.responses, newResponse],
              updatedAt: new Date(),
              status: responseData.isAdmin ? 'in_progress' : ticket.status
            }
          : ticket
      )
    }));

    logger.debug('Response added to ticket:', ticketId, newResponse);
  },

  updateTicketStatus: (ticketId, status) => {
    set((state) => ({
      tickets: state.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status, updatedAt: new Date() }
          : ticket
      )
    }));
  },

  getTicketsByUser: (userId) => {
    return get().tickets.filter(ticket => ticket.userId === userId);
  },

  getTicketById: (ticketId) => {
    return get().tickets.find(ticket => ticket.id === ticketId);
  },

  // Live Chat Actions
  startLiveChat: (userId, subject, category, priority) => {
    const chatId = `chat_${Date.now()}`;
    const newChat: LiveChat = {
      id: chatId,
      userId,
      subject,
      category,
      priority,
      status: 'waiting',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      userTyping: false,
      operatorTyping: false
    };

    // Add system welcome message
    const welcomeMessage: LiveChatMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: 'system',
      senderType: 'system',
      message: 'Salam! Dəstək komandamız tezliklə sizinlə əlaqə saxlayacaq. Zəhmət olmasa gözləyin.',
      timestamp: new Date(),
      isRead: false
    };

    newChat.messages.push(welcomeMessage);
    newChat.lastMessageAt = new Date();

    set((state) => ({
      liveChats: [newChat, ...state.liveChats]
    }));

    // Auto-assign available operator after 3 seconds
    setTimeout(() => {
      const availableOperators = get().getAvailableOperators();
      if (availableOperators.length > 0) {
        const bestOperator = availableOperators.reduce((best, current) => 
          current.activeChats < best.activeChats ? current : best
        );
        get().assignOperator(chatId, bestOperator.id);
      }
    }, 3000);

    // Add notification to main notification system
    try {
      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        type: 'general',
        title: 'Yeni Dəstək Söhbəti',
        message: `Yeni söhbət başladı: ${subject}`,
        data: { chatId, type: 'support_chat' }
      });
    } catch (error) {
      logger.debug('Notification store not available:', error);
    }

    // Add notification
    get().addNotification({
      chatId,
      type: 'user_joined',
      message: `Yeni söhbət başladı: ${subject}`
    });

    logger.debug('Live chat started:', chatId);
    return chatId;
  },

  sendMessage: (chatId, senderId, senderType, message, attachments) => {
    const newMessage: LiveChatMessage = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId,
      senderType,
      message,
      timestamp: new Date(),
      isRead: false,
      attachments
    };

    set((state) => ({
      liveChats: state.liveChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessageAt: new Date(),
              updatedAt: new Date(),
              userTyping: false,
              operatorTyping: false
            }
          : chat
      )
    }));

    // Add notification for new message
    if (senderType !== 'system') {
      // Add to main notification system
      try {
        const notificationStore = useNotificationStore.getState();
        const chat = get().liveChats.find(c => c.id === chatId);
        
        if (senderType === 'operator' && chat) {
          const operator = get().operators.find(op => op.id === senderId);
          notificationStore.addNotification({
            type: 'message',
            title: 'Dəstək Mesajı',
            message: `${operator?.name || 'Operator'}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            fromUserId: senderId,
            fromUserName: operator?.name,
            fromUserAvatar: operator?.avatar,
            data: { chatId, type: 'support_message' }
          });
        }
      } catch (error) {
        logger.debug('Notification store not available:', error);
      }
      
      get().addNotification({
        chatId,
        type: 'new_message',
        message: `Yeni mesaj: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
      });
    }

    // Simulate operator response for demo
    if (senderType === 'user') {
      const chat = get().liveChats.find(c => c.id === chatId);
      if (chat?.operatorId) {
        setTimeout(() => {
          const responses = [
            'Anladım, probleminizlə bağlı araşdırma aparıram.',
            'Bu məsələni həll etmək üçün bir neçə dəqiqə vaxt lazımdır.',
            'Əlavə məlumat lazımdırsa, mənə yazın.',
            'Probleminizi həll etməyə çalışıram, zəhmət olmasa gözləyin.'
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          get().sendMessage(chatId, chat.operatorId!, 'operator', randomResponse);
        }, 2000 + Math.random() * 3000);
      }
    }

    logger.debug('Message sent:', newMessage);
  },

  assignOperator: (chatId, operatorId) => {
    set((state) => ({
      liveChats: state.liveChats.map(chat =>
        chat.id === chatId
          ? { ...chat, operatorId, status: 'active', updatedAt: new Date() }
          : chat
      ),
      operators: state.operators.map(op =>
        op.id === operatorId
          ? { ...op, activeChats: op.activeChats + 1 }
          : op
      )
    }));

    // Send operator introduction message
    const operator = get().operators.find(op => op.id === operatorId);
    if (operator) {
      get().sendMessage(
        chatId,
        operatorId,
        'operator',
        `Salam! Mən ${operator.name}. Sizə necə kömək edə bilərəm?`
      );
    }

    // Add notification to main notification system
    try {
      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        type: 'general',
        title: 'Operator Təyin Edildi',
        message: `${operator?.name} sizə kömək etməyə hazırdır`,
        fromUserId: operatorId,
        fromUserName: operator?.name,
        fromUserAvatar: operator?.avatar,
        data: { chatId, operatorId, type: 'operator_assigned' }
      });
    } catch (error) {
      logger.debug('Notification store not available:', error);
    }

    // Add notification
    get().addNotification({
      chatId,
      type: 'chat_assigned',
      message: `Operator təyin edildi: ${operator?.name}`
    });

    logger.debug('Operator assigned:', operatorId, 'to chat:', chatId);
  },

  closeLiveChat: (chatId) => {
    const chat = get().liveChats.find(c => c.id === chatId);
    
    set((state) => ({
      liveChats: state.liveChats.map(c =>
        c.id === chatId
          ? { ...c, status: 'closed', updatedAt: new Date() }
          : c
      ),
      operators: chat?.operatorId
        ? state.operators.map(op =>
            op.id === chat.operatorId
              ? { ...op, activeChats: Math.max(0, op.activeChats - 1) }
              : op
          )
        : state.operators
    }));

    // Send closing message
    get().sendMessage(
      chatId,
      'system',
      'system',
      'Söhbət bağlandı. Əlavə sualınız varsa, yenidən əlaqə saxlaya bilərsiniz.'
    );

    // Add notification to main notification system
    try {
      const notificationStore = useNotificationStore.getState();
      notificationStore.addNotification({
        type: 'general',
        title: 'Söhbət Bağlandı',
        message: 'Dəstək söhbətiniz tamamlandı',
        data: { chatId, type: 'chat_closed' }
      });
    } catch (error) {
      logger.debug('Notification store not available:', error);
    }

    // Add notification
    get().addNotification({
      chatId,
      type: 'chat_closed',
      message: 'Söhbət bağlandı'
    });

    logger.debug('Chat closed:', chatId);
  },

  setTyping: (chatId, userType, isTyping) => {
    set((state) => ({
      liveChats: state.liveChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              userTyping: userType === 'user' ? isTyping : chat.userTyping,
              operatorTyping: userType === 'operator' ? isTyping : chat.operatorTyping
            }
          : chat
      )
    }));
  },

  markMessagesAsRead: (chatId, userId) => {
    set((state) => ({
      liveChats: state.liveChats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.senderId !== userId ? { ...msg, isRead: true } : msg
              )
            }
          : chat
      )
    }));
  },

  getChatsByUser: (userId) => {
    return get().liveChats.filter(chat => chat.userId === userId);
  },

  getChatsByOperator: (operatorId) => {
    return get().liveChats.filter(chat => chat.operatorId === operatorId);
  },

  getAvailableOperators: () => {
    return get().operators.filter(op => 
      op.isOnline && op.isAvailable && op.activeChats < op.maxChats
    );
  },

  addNotification: (notificationData) => {
    const newNotification: ChatNotification = {
      ...notificationData,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      isRead: false
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications.slice(0, 49)] // Keep only last 50
    }));
  },

  markNotificationAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    }));
  }
}));