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
        
        // \u2705 Use projectId from config instead of hardcoded value
        const projectId = config.EXPO_PROJECT_ID || process.env.EXPO_PUBLIC_PROJECT_ID;
        
        if (!projectId || projectId.includes('your-')) {
          logger.debug('Expo project ID not configured');
          return null;
        }
        
        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
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
    // ===== VALIDATION START =====
    
    // 1. Validate 'to' parameter
    if (!to || typeof to !== 'string' || to.trim().length === 0) {
      logger.error('Invalid push token: empty or not a string');
      return false;
    }
    
    // 2. Validate notification object
    if (!notification || typeof notification !== 'object') {
      logger.error('Invalid notification object');
      return false;
    }
    
    // 3. Validate title
    if (!notification.title || typeof notification.title !== 'string' || notification.title.trim().length === 0) {
      logger.error('Invalid notification title');
      return false;
    }
    
    if (notification.title.trim().length > 100) {
      logger.error('Notification title too long (max 100 chars)');
      return false;
    }
    
    // 4. Validate body
    if (!notification.body || typeof notification.body !== 'string' || notification.body.trim().length === 0) {
      logger.error('Invalid notification body');
      return false;
    }
    
    if (notification.body.trim().length > 500) {
      logger.error('Notification body too long (max 500 chars)');
      return false;
    }
    
    // 5. Validate badge (if provided)
    if (notification.badge !== undefined) {
      if (typeof notification.badge !== 'number' || notification.badge < 0 || !Number.isInteger(notification.badge)) {
        logger.error('Invalid badge value');
        return false;
      }
    }
    
    // ===== VALIDATION END =====
    
    // \u2705 Implement retry logic with exponential backoff
    const MAX_RETRIES = 3;
    const TIMEOUT = 15000; // 15 seconds
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: to.trim(),
            title: notification.title.trim(),
            body: notification.body.trim(),
            data: notification.data,
            sound: notification.sound ? 'default' : undefined,
            badge: notification.badge,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.error(`Push notification failed with status ${response.status}`);
          
          // \u2705 Retry on 5xx errors
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            logger.debug(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          return false;
        }

        const result = await response.json();
        const success = result.data?.[0]?.status === 'ok';
        
        if (!success) {
          logger.error('Push notification rejected by server:', result.data?.[0]);
        }
        
        return success;
      } catch (error) {
        logger.error(`Push notification attempt ${attempt} failed:`, error);
        
        // \u2705 Retry on network errors
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.debug(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return false;
      }
    }
    
    return false;
  }

  async sendLocalNotification(notification: PushNotification): Promise<void> {
    // ===== VALIDATION START =====
    
    if (!notification || typeof notification !== 'object') {
      logger.error('Invalid notification object');
      return;
    }
    
    if (!notification.title || typeof notification.title !== 'string' || notification.title.trim().length === 0) {
      logger.error('Invalid notification title');
      return;
    }
    
    if (notification.title.trim().length > 100) {
      logger.error('Notification title too long (max 100 chars)');
      return;
    }
    
    if (!notification.body || typeof notification.body !== 'string' || notification.body.trim().length === 0) {
      logger.error('Invalid notification body');
      return;
    }
    
    if (notification.body.trim().length > 500) {
      logger.error('Notification body too long (max 500 chars)');
      return;
    }
    
    // ===== VALIDATION END =====
    
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title.trim(), {
            body: notification.body.trim(),
            icon: '/assets/images/icon.png',
            badge: '/assets/images/badge.png',
            data: notification.data,
            requireInteraction: false,
            silent: !notification.sound,
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
              title: notification.title.trim(),
              body: notification.body.trim(),
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