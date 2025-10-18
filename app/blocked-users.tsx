import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { UserCheck, ArrowLeft } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';
import { users } from '@/mocks/users';
import { logger } from '@/utils/logger';

export default function BlockedUsersScreen() {
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const { blockedUsers, unblockUser, currentUser, isAuthenticated } = useUserStore();
  const colors = getColors(themeMode, colorTheme);
  
  const [isUnblocking, setIsUnblocking] = useState<string | null>(null);
  
  // ✅ Check authentication on mount
  React.useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      logger.error('[BlockedUsersScreen] User not authenticated');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Hesaba daxil olmalısınız' : 'Вы должны войти в систему',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [isAuthenticated, currentUser]);

  const texts = {
    az: {
      title: 'Blok edilmiş istifadəçilər',
      noBlockedUsers: 'Blok edilmiş istifadəçi yoxdur',
      noBlockedUsersDesc: 'Hələ heç bir istifadəçini blok etməmisiniz',
      unblock: 'Blokdan çıxar',
      unblockConfirm: 'Bu istifadəçini blokdan çıxarmaq istədiyinizə əminsinizmi?',
      unblockSuccess: 'İstifadəçi blokdan çıxarıldı',
      yes: 'Bəli',
      no: 'Xeyr',
    },
    ru: {
      title: 'Заблокированные пользователи',
      noBlockedUsers: 'Нет заблокированных пользователей',
      noBlockedUsersDesc: 'Вы еще не заблокировали ни одного пользователя',
      unblock: 'Разблокировать',
      unblockConfirm: 'Вы уверены, что хотите разблокировать этого пользователя?',
      unblockSuccess: 'Пользователь разблокирован',
      yes: 'Да',
      no: 'Нет',
    },
  };

  const t = texts[language];

  // ✅ Validate and filter blocked users
  const blockedUsersList = React.useMemo(() => {
    if (!Array.isArray(blockedUsers)) {
      logger.error('[BlockedUsersScreen] Invalid blockedUsers array');
      return [];
    }
    
    return users.filter(user => 
      user && 
      typeof user.id === 'string' && 
      blockedUsers.includes(user.id)
    );
  }, [blockedUsers]);

  const handleUnblock = async (userId: string, userName: string) => {
    // ✅ Validate authentication
    if (!isAuthenticated || !currentUser) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Hesaba daxil olmamısınız' : 'Вы не авторизованы'
      );
      return;
    }
    
    // ✅ Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error('[BlockedUsersScreen] Invalid userId for unblock');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Yanlış istifadəçi' : 'Неверный пользователь'
      );
      return;
    }
    
    // ✅ Check if already unblocking
    if (isUnblocking) {
      logger.warn('[BlockedUsersScreen] Unblock already in progress');
      return;
    }
    
    Alert.alert(
      language === 'az' ? 'Blokdan çıxar' : 'Разблокировать',
      language === 'az' 
        ? `${userName} istifadəçisini blokdan çıxarmaq istədiyinizə əminsinizmi?\n\nOnunla yenidən əlaqə saxlaya biləcəksiniz.`
        : `Вы уверены, что хотите разблокировать ${userName}?\n\nВы снова сможете связаться с ним.`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          onPress: async () => {
            setIsUnblocking(userId);
            
            try {
              logger.debug('[BlockedUsersScreen] Unblocking user:', userId);
              unblockUser(userId);
              
              Alert.alert(
                language === 'az' ? 'Uğurlu' : 'Успешно',
                language === 'az' 
                  ? `${userName} blokdan çıxarıldı` 
                  : `${userName} разблокирован`,
                [{ text: 'OK' }]
              );
              
              logger.info('[BlockedUsersScreen] User unblocked successfully:', userId);
            } catch (error) {
              logger.error('[BlockedUsersScreen] Error unblocking user:', error);
              
              let errorMessage = language === 'az' 
                ? 'Blokdan çıxarılarkən xəta baş verdi' 
                : 'Произошла ошибка при разблокировке';
              
              if (error instanceof Error) {
                if (error.message.includes('blok edilməyib') || error.message.includes('not blocked')) {
                  errorMessage = language === 'az'
                    ? 'İstifadəçi artıq blok edilməyib'
                    : 'Пользователь уже разблокирован';
                } else if (error.message.includes('daxil olmamısınız') || error.message.includes('authenticated')) {
                  errorMessage = language === 'az'
                    ? 'Hesaba daxil olmamısınız'
                    : 'Вы не авторизованы';
                }
              }
              
              Alert.alert(
                language === 'az' ? 'Xəta' : 'Ошибка',
                errorMessage
              );
            } finally {
              setIsUnblocking(null);
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: typeof users[0] }) => {
    // ✅ Validate item
    if (!item || !item.id || !item.name) {
      logger.error('[BlockedUsersScreen] Invalid user item');
      return null;
    }
    
    const isCurrentlyUnblocking = isUnblocking === item.id;
    
    return (
      <View style={[styles.userCard, { backgroundColor: colors.card }]}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar}
          defaultSource={require('@/assets/images/default-avatar.png')}
          onError={() => logger.warn('[BlockedUsersScreen] Avatar load error for:', item.id)}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.userLocation, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location?.[language] || item.location?.az || ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.unblockButton, 
            { backgroundColor: colors.success + '20' },
            isCurrentlyUnblocking && styles.unblockButtonDisabled
          ]}
          onPress={() => handleUnblock(item.id, item.name)}
          disabled={isCurrentlyUnblocking || !!isUnblocking}
        >
          {isCurrentlyUnblocking ? (
            <ActivityIndicator size="small" color={colors.success} />
          ) : (
            <UserCheck size={20} color={colors.success} />
          )}
          <Text style={[styles.unblockText, { color: colors.success }]}>
            {isCurrentlyUnblocking 
              ? (language === 'az' ? 'Çıxarılır...' : 'Разблокировка...')
              : t.unblock
            }
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <UserCheck size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.noBlockedUsers}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.noBlockedUsersDesc}</Text>
      <TouchableOpacity 
        style={[styles.backToSettingsButton, { backgroundColor: colors.primary }]}
        onPress={() => router.back()}\n      >\n        <Text style={styles.backToSettingsText}>\n          {language === 'az' ? 'Geri qayıt' : 'Назад'}\n        </Text>\n      </TouchableOpacity>\n    </View>\n  );"}, {"old_string": "  emptyDesc: {\n    fontSize: 16,\n    textAlign: 'center',\n    lineHeight: 22,\n  },\n  unblockButtonDisabled: {\n    opacity: 0.5,\n  },\n});", "new_string": "  emptyDesc: {\n    fontSize: 16,\n    textAlign: 'center',\n    lineHeight: 22,\n  },\n  unblockButtonDisabled: {\n    opacity: 0.5,\n  },\n  backToSettingsButton: {\n    marginTop: 24,\n    paddingHorizontal: 24,\n    paddingVertical: 12,\n    borderRadius: 8,\n  },\n  backToSettingsText: {\n    color: '#fff',\n    fontSize: 16,\n    fontWeight: '600',\n  },\n});"}]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t.title,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={blockedUsersList}
        renderItem={renderBlockedUser}
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
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
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
  },
  unblockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  unblockButtonDisabled: {
    opacity: 0.5,
  },
});