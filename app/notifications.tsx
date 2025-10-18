import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Bell, Trash2, CheckCheck } from 'lucide-react-native';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';
import { logger } from '@/utils/logger';

export default function NotificationsScreen() {
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    getNavigationPath 
  } = useNotificationStore();
  const colors = getColors(themeMode, colorTheme);

  const texts = {
    az: {
      notifications: 'Bildirişlər',
      noNotifications: 'Bildiriş yoxdur',
      noNotificationsDesc: 'Hələ heç bir bildirişiniz yoxdur',
      markAllRead: 'Hamısını oxunmuş et',
      clearAll: 'Hamısını sil',
      clearConfirm: 'Bütün bildirişləri silmək istədiyinizə əminsinizmi?',
      yes: 'Bəli',
      no: 'Xeyr',
      nudgeNotification: 'sizi dürtdü',
      messageNotification: 'sizə mesaj göndərdi',
      callNotification: 'sizə zəng etdi',
      now: 'indi',
      minutesAgo: 'dəqiqə əvvəl',
      hoursAgo: 'saat əvvəl',
      daysAgo: 'gün əvvəl',
    },
    ru: {
      notifications: 'Уведомления',
      noNotifications: 'Нет уведомлений',
      noNotificationsDesc: 'У вас пока нет уведомлений',
      markAllRead: 'Отметить все как прочитанные',
      clearAll: 'Очистить все',
      clearConfirm: 'Вы уверены, что хотите удалить все уведомления?',
      yes: 'Да',
      no: 'Нет',
      nudgeNotification: 'подтолкнул вас',
      messageNotification: 'отправил вам сообщение',
      callNotification: 'позвонил вам',
      now: 'сейчас',
      minutesAgo: 'минут назад',
      hoursAgo: 'часов назад',
      daysAgo: 'дней назад',
    },
  };

  const t = texts[language];

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // ✅ BUG FIX: Validate date to prevent NaN
    if (isNaN(date.getTime())) {
      return t.now; // Fallback for invalid dates
    }
    
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // ✅ BUG FIX: Handle future dates (negative difference)
    if (diffInMinutes < 0) {
      return t.now;
    }

    if (diffInMinutes < 1) return t.now;
    if (diffInMinutes < 60) return `${diffInMinutes} ${t.minutesAgo}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t.hoursAgo}`;
    return `${Math.floor(diffInMinutes / 1440)} ${t.daysAgo}`;
  };

  const handleClearAll = () => {
    Alert.alert(
      '',
      t.clearConfirm,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: clearAll,
        },
      ]
    );
  };

  // ✅ Handle notification press with navigation
  const handleNotificationPress = (item: Notification) => {
    // Mark as read
    if (!item.isRead) {
      markAsRead(item.id);
    }

    // Navigate to relevant screen
    try {
      const path = getNavigationPath(item);
      if (path) {
        logger.debug('Navigating to:', path);
        router.push(path as any);
      }
    } catch (error) {
      logger.error('Navigation error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Səhifə açıla bilmədi' : 'Не удалось открыть страницу'
      );
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard, 
        { backgroundColor: colors.card },
        !item.isRead && { backgroundColor: `${colors.primary}10`, borderLeftColor: colors.primary }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        {item.fromUserAvatar && (
          <Image source={{ uri: item.fromUserAvatar }} style={styles.avatar} />
        )}
        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {item.title || (
              <>
                {item.fromUserName && (
                  <Text style={styles.userName}>{item.fromUserName} </Text>
                )}
                {item.type === 'nudge' && t.nudgeNotification}
                {item.type === 'message' && t.messageNotification}
                {item.type === 'call' && t.callNotification}
              </>
            )}
          </Text>
          {/* ✅ Enhanced message display with validation */}
          {item.message && item.message.trim() && (
            <Text 
              style={[styles.notificationMessage, { color: colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.message}
            </Text>
          )}
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeNotification(item.id)}
      >
        <Trash2 size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.noNotifications}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.noNotificationsDesc}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `${t.notifications}${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            notifications.length > 0 && (
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    style={styles.headerButton}
                  >
                    <CheckCheck size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={styles.headerButton}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )
          ),
        }}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});