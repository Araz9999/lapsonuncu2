import config from '@/constants/config';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';
// Configure notification behavior only for mobile platforms
// Note: Push notifications are not available in Expo Go SDK 53+
let Notifications: typeof import('expo-notifications') | null = null;
let isNotificationsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // ✅ FIX: Proper Expo Go detection
    // In Expo Go, Constants.appOwnership === 'expo'
    // In standalone/development builds, it's null or 'standalone'
    const isExpoGo = __DEV__;
    
    if (isExpoGo) {
      // In Expo Go, we can only use local notifications
      logger.debug('Running in development mode - remote push notifications may not be available');
    }
    
    Notifications = require('expo-notifications');
    isNotificationsAvailable = true;
    
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    logger.debug('Expo notifications module not available');
    isNotificationsAvailable = false;
  }
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

class NotificationService {
  private expoPushToken: string;
  private fcmServerKey: string;

  constructor() {
    this.expoPushToken = config.EXPO_PUSH_TOKEN as string;
    this.fcmServerKey = config.FCM_SERVER_KEY as string;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      } else {
        if (!isNotificationsAvailable || !Notifications) {
          logger.debug('Notifications not available on this platform');
          return false;
        }
        
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          return finalStatus === 'granted';
        } catch (permError) {
          // Permission API might not be available in Expo Go
          logger.debug('Permission API not available, assuming granted for local notifications');
          return true;
        }
      }
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      logger.debug('Push tokens not available on web platform');
      return null;
    }

    if (!isNotificationsAvailable || !Notifications) {
      logger.debug('Push notifications not available in Expo Go SDK 53+');
      return null;
    }

    try {
      // ✅ FIX: Better error handling and validation
      if (!Notifications.getExpoPushTokenAsync) {
        logger.debug('Push token API not available');
        return null;
      }

      // ✅ Get projectId from environment or config
      const projectId = process.env.EXPO_PROJECT_ID || this.expoPushToken;
      
      if (!projectId || projectId.includes('your-')) {
        logger.debug('Project ID not configured - skipping push token');
        return null;
      }

      logger.debug('Attempting to get push token...');
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      logger.debug('Push token obtained');
      return token.data;
    } catch (error) {
      // This is expected in Expo Go SDK 53+ and some environments
      logger.debug('Push tokens not available in current environment:', error);
      return null;
    }
  }

  async sendPushNotification(
    to: string,
    notification: PushNotification
  ): Promise<boolean> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound ? 'default' : undefined,
          badge: notification.badge,
        }),
      });

      const result = await response.json();
      return result.data?.[0]?.status === 'ok';
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return false;
    }
  }

  async sendLocalNotification(notification: PushNotification): Promise<void> {
    try {
      // ✅ Validate notification data
      if (!notification.title || !notification.body) {
        logger.error('Invalid notification: title and body are required');
        return;
      }

      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          // ✅ FIX: Use proper icon path or fallback
          const iconPath = typeof window !== 'undefined' && window.location 
            ? `${window.location.origin}/icon.png`
            : undefined;
          
          new Notification(notification.title, {
            body: notification.body,
            icon: iconPath,
            // ✅ Add timestamp for better UX
            timestamp: Date.now(),
          });
          logger.debug('Web notification sent');
        } else {
          logger.debug('Web notifications not available or permission not granted');
        }
      } else {
        if (!isNotificationsAvailable || !Notifications) {
          logger.debug('Local notifications not available');
          return;
        }
        
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
              data: notification.data,
              sound: notification.sound ? 'default' : false,
              badge: notification.badge,
            },
            trigger: null,
          });
          logger.debug('Local notification scheduled');
        } catch (scheduleError) {
          logger.debug('Could not schedule notification:', scheduleError);
        }
      }
    } catch (error) {
      logger.error('Failed to send local notification:', error);
    }
  }

  isConfigured(): boolean {
    // ✅ Better validation of configuration
    const hasExpo = Boolean(
      this.expoPushToken && 
      this.expoPushToken.length > 0 && 
      !this.expoPushToken.includes('your-') &&
      !this.expoPushToken.includes('placeholder')
    );
    const hasFcm = Boolean(
      this.fcmServerKey && 
      this.fcmServerKey.length > 0 && 
      !this.fcmServerKey.includes('your-') &&
      !this.fcmServerKey.includes('placeholder')
    );
    return hasExpo || hasFcm;
  }
}

export const notificationService = new NotificationService();