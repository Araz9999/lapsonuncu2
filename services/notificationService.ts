import config from '@/constants/config';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';
// Configure notification behavior only for mobile platforms
// Note: Push notifications are not available in Expo Go SDK 53+
let Notifications: typeof import('expo-notifications') | null = null;
let isNotificationsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    // Check if we're in Expo Go or a development build
    const isExpoGo = !__DEV__ ? false : true;
    
    if (isExpoGo) {
      // In Expo Go, we can only use local notifications
      logger.debug('Running in Expo Go - remote push notifications not available');
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
      // Check if we can get push token (only in development builds, not Expo Go)
      if (Notifications.getExpoPushTokenAsync) {
        logger.debug('Attempting to get push token...');
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-expo-project-id',
        });
        logger.debug('Push token obtained');
        return token.data;
      } else {
        logger.debug('Push token API not available in Expo Go');
        return null;
      }
    } catch (error) {
      // This is expected in Expo Go SDK 53+
      logger.debug('Push tokens not available in current environment');
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
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/assets/images/icon.png',
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
    // Consider configured only if at least one credential is non-placeholder
    const hasExpo = this.expoPushToken && !this.expoPushToken.includes('your-');
    const hasFcm = this.fcmServerKey && !this.fcmServerKey.includes('your-');
    return Boolean(hasExpo || hasFcm);
  }
}

export const notificationService = new NotificationService();