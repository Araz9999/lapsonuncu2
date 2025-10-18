import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // ✅ Import Platform

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
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
        
        // ✅ Trigger haptic feedback for notification on mobile (simplified)
        if (Platform.OS !== 'web') {
          (async () => {
            try {
              const Haptics = await import('expo-haptics');
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            } catch (error) {
              // Haptics not available - silent fail (optional feature)
            }
          })();
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