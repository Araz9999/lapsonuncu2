import { create } from 'zustand';
import { SupportTicket, SupportResponse, SupportCategory } from '@/types/support';

interface SupportStore {
  tickets: SupportTicket[];
  categories: SupportCategory[];
  isLoading: boolean;
  
  // Actions
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => void;
  addResponse: (ticketId: string, response: Omit<SupportResponse, 'id' | 'createdAt'>) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  getTicketsByUser: (userId: string) => SupportTicket[];
  getTicketById: (ticketId: string) => SupportTicket | undefined;
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

export const useSupportStore = create<SupportStore>((set, get) => ({
  tickets: [],
  categories: supportCategories,
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

    // Simulate admin auto-response after 2 seconds
    setTimeout(() => {
      const store = get();
      store.addResponse(newTicket.id, {
        ticketId: newTicket.id,
        userId: 'admin',
        message: ticketData.category === '1' 
          ? 'Texniki problemlə bağlı müraciətiniz qəbul edildi. Tezliklə cavab veriləcək.'
          : 'Müraciətiniz qəbul edildi və araşdırılır. 24 saat ərzində cavab veriləcək.',
        isAdmin: true
      });
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

    // Log the response for debugging
    console.log('Response added to ticket:', ticketId, newResponse);
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
  }
}));