import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  type: 'nudge' | 'message' | 'call' | 'general';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  createdAt: string;
  isRead: boolean;
  data?: Record<string, unknown>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        // ===== VALIDATION START =====
        
        // 1. Type validation
        const validTypes = ['nudge', 'message', 'call', 'general'];
        if (!notification.type || !validTypes.includes(notification.type)) {
          throw new Error('Bildiri\u015f n\u00f6v\u00fc etibars\u0131zd\u0131r');
        }
        
        // 2. Title validation
        if (!notification.title || typeof notification.title !== 'string' || notification.title.trim().length === 0) {
          throw new Error('Bildiri\u015f ba\u015fl\u0131\u011f\u0131 t\u0259l\u0259b olunur');
        }
        
        if (notification.title.trim().length > 100) {
          throw new Error('Ba\u015fl\u0131q maksimum 100 simvol ola bil\u0259r');
        }
        
        // 3. Message validation
        if (!notification.message || typeof notification.message !== 'string' || notification.message.trim().length === 0) {
          throw new Error('Bildiri\u015f mesaj\u0131 t\u0259l\u0259b olunur');
        }
        
        if (notification.message.trim().length > 500) {
          throw new Error('Mesaj maksimum 500 simvol ola bil\u0259r');
        }
        
        // 4. Optional fields validation
        if (notification.fromUserId !== undefined && typeof notification.fromUserId !== 'string') {
          throw new Error('\u0130stifad\u0259\u00e7i ID-si etibars\u0131zd\u0131r');
        }
        
        if (notification.fromUserName !== undefined) {
          if (typeof notification.fromUserName !== 'string' || notification.fromUserName.trim().length > 50) {
            throw new Error('\u0130stifad\u0259\u00e7i ad\u0131 etibars\u0131zd\u0131r');
          }
        }
        
        if (notification.fromUserAvatar !== undefined) {
          if (typeof notification.fromUserAvatar !== 'string' || notification.fromUserAvatar.trim().length === 0) {
            throw new Error('Avatar URL etibars\u0131zd\u0131r');
          }
        }
        
        // ===== VALIDATION END =====
        
        // \u2705 Use substring() instead of deprecated substr()
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        
        set((state) => {
          // \u2705 Enforce max 100 notifications
          const MAX_NOTIFICATIONS = 100;
          let notifications = [newNotification, ...state.notifications];
          
          // \u2705 Auto-remove old notifications if exceeds limit
          if (notifications.length > MAX_NOTIFICATIONS) {
            notifications = notifications.slice(0, MAX_NOTIFICATIONS);
          }
          
          // \u2705 Auto-cleanup notifications older than 30 days
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          notifications = notifications.filter(n => {
            const notifDate = new Date(n.createdAt).getTime();
            return notifDate > thirtyDaysAgo;
          });
          
          return {
            notifications,
            unreadCount: state.unreadCount + 1,
          };
        });
        
        // Trigger haptic feedback for notification on mobile
        if (typeof window !== 'undefined' && 'navigator' in window) {
          import('react-native').then(({ Platform }) => {
            if (Platform.OS !== 'web') {
              import('expo-haptics').then((Haptics) => {
                if (Haptics && Haptics.notificationAsync) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                }
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      },
      
      markAsRead: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.map((notif) => {
            if (notif.id === notificationId && !notif.isRead) {
              return { ...notif, isRead: true };
            }
            return notif;
          });
          
          const unreadCount = notifications.filter(n => !n.isRead).length;
          
          return { notifications, unreadCount };
        });
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
          unreadCount: 0,
        }));
      },
      
      removeNotification: (notificationId) => {
        set((state) => {
          const notifications = state.notifications.filter(n => n.id !== notificationId);
          const unreadCount = notifications.filter(n => !n.isRead).length;
          
          return { notifications, unreadCount };
        });
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);