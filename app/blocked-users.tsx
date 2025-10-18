import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
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
  const { blockedUsers, unblockUser } = useUserStore();
  const colors = getColors(themeMode, colorTheme);

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

  logger.info('[BlockedUsers] Screen opened:', { 
    totalBlocked: blockedUsers.length,
    userId: users[0]?.id // Just for context
  });
  
  const blockedUsersList = users.filter(user => {
    if (!user || !user.id) {
      logger.warn('[BlockedUsers] Invalid user in users list:', user);
      return false;
    }
    return blockedUsers.includes(user.id);
  });

  const handleUnblock = (userId: string) => {
    if (!userId || typeof userId !== 'string') {
      logger.error('[BlockedUsers] Invalid userId for unblock:', userId);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi tapılmadı' : 'Пользователь не найден'
      );
      return;
    }
    
    logger.info('[BlockedUsers] Unblock confirmation requested:', { userId });
    
    Alert.alert(
      '',
      t.unblockConfirm,
      [
        { 
          text: t.no, 
          style: 'cancel',
          onPress: () => logger.info('[BlockedUsers] Unblock cancelled:', { userId })
        },
        {
          text: t.yes,
          onPress: () => {
            try {
              logger.info('[BlockedUsers] Unblocking user:', { userId });
              unblockUser(userId);
              logger.info('[BlockedUsers] User unblocked successfully:', { userId });
              Alert.alert('', t.unblockSuccess);
            } catch (error) {
              logger.error('[BlockedUsers] Failed to unblock user:', error);
              Alert.alert(
                language === 'az' ? 'Xəta' : 'Ошибка',
                language === 'az' 
                  ? 'Blokdan çıxarma uğursuz oldu' 
                  : 'Не удалось разблокировать'
              );
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: typeof users[0] }) => {
    if (!item) {
      logger.warn('[BlockedUsers] Null item in renderBlockedUser');
      return null;
    }
    
    if (!item.id || !item.name) {
      logger.warn('[BlockedUsers] Invalid user data:', { id: item.id, hasName: !!item.name });
      return null;
    }
    
    return (
      <View style={[styles.userCard, { backgroundColor: colors.card }]}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar}
          onError={(error) => {
            logger.warn('[BlockedUsers] Avatar load failed:', { userId: item.id, error });
          }}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.userLocation, { color: colors.textSecondary }]}>
            {item.location?.[language] || item.location?.az || ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, { backgroundColor: colors.success + '20' }]}
          onPress={() => handleUnblock(item.id)}
        >
          <UserCheck size={20} color={colors.success} />
          <Text style={[styles.unblockText, { color: colors.success }]}>{t.unblock}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <UserCheck size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.noBlockedUsers}</Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>{t.noBlockedUsersDesc}</Text>
    </View>
  );

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
});