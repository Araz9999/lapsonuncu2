import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // ✅ Import Platform

export interface Notification {
  id: string;
  type: 'nudge' | 'message' | 'call' | 'general' | 'listing' | 'store';
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  createdAt: string;
  isRead: boolean;
  // ✅ Enhanced data with navigation support
  data?: Record<string, unknown>;
  actionUrl?: string; // For navigation (e.g., '/messages/123', '/listing/456')
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  // ✅ Get navigation path from notification
  getNavigationPath: (notification: Notification) => string | null;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        // ✅ Validate notification data
        if (!notification.title || !notification.type) {
          console.error('Invalid notification: title and type are required');
          return;
        }

        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
        
        // ✅ Trigger haptic feedback based on notification type
        if (Platform.OS !== 'web') {
          (async () => {
            try {
              const Haptics = await import('expo-haptics');
              
              // Different haptic feedback for different notification types
              switch (notification.type) {
                case 'call':
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
                  break;
                case 'message':
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  break;
                case 'nudge':
                  await Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium
                  );
                  break;
                default:
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
              }
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
      
      // ✅ Get navigation path from notification
      getNavigationPath: (notification) => {
        // Use explicit actionUrl if provided
        if (notification.actionUrl) {
          return notification.actionUrl;
        }
        
        // Generate path based on notification type
        switch (notification.type) {
          case 'message':
            return notification.fromUserId ? `/messages/${notification.fromUserId}` : '/messages';
          case 'call':
            return '/call-history';
          case 'listing':
            return notification.data?.listingId ? `/listing/${notification.data.listingId}` : null;
          case 'store':
            return notification.data?.storeId ? `/store/${notification.data.storeId}` : null;
          case 'nudge':
            return notification.fromUserId ? `/user/${notification.fromUserId}` : null;
          default:
            return null;
        }
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);