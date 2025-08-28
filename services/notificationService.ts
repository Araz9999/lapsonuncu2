import config from '@/constants/config';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
if (Platform.OS !== 'web') {
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
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        return finalStatus === 'granted';
      }
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Push tokens not available on web platform');
      return null;
    }

    try {
      console.log('Getting Expo push token...');
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id',
      });
      console.log('Expo push token obtained successfully');
      return token.data;
    } catch (error) {
      console.error('Failed to get Expo push token:', error);
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
      console.error('Failed to send push notification:', error);
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
          console.log('Web notification sent successfully');
        } else {
          console.log('Web notifications not available or permission not granted');
        }
      } else {
        console.log('Sending local notification on mobile...');
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
        console.log('Mobile notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  isConfigured(): boolean {
    return !this.expoPushToken.includes('your-') || !this.fcmServerKey.includes('your-');
  }
}

export const notificationService = new NotificationService();