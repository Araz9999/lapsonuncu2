import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { useUserStore } from '@/store/userStore';
import { useListingStore } from '@/store/listingStore';
import { useStoreStore } from '@/store/storeStore';
import Colors from '@/constants/colors';
import { users } from '@/mocks/users';
import { Star, LogOut, Heart, Settings, Bell, HelpCircle, Shield, Package, MessageCircle, ChevronRight, Wallet, Store, Trash2, Headphones } from 'lucide-react-native';
import LiveChatWidget from '@/components/LiveChatWidget';
import { authService } from '@/services/authService';
import { useSupportStore } from '@/store/supportStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { isAuthenticated, logout, favorites, freeAdsThisMonth, walletBalance, bonusBalance } = useUserStore();
  const { listings } = useListingStore();
  const { getUserStore } = useStoreStore();
  const { liveChats, getAvailableOperators } = useSupportStore();
  
  const [showLiveChat, setShowLiveChat] = React.useState<boolean>(false);
  
  // Mock current user (first user in the list)
  const currentUser = users[0];
  const userStore = getUserStore(currentUser.id);
  
  // Get user's active chats for live support
  const userChats = isAuthenticated ? liveChats.filter(chat => 
    chat.userId === currentUser.id && chat.status !== 'closed'
  ) : [];
  const availableOperators = getAvailableOperators();
  const hasActiveChat = userChats.length > 0;
  
  const favoriteListings = listings.filter(listing => favorites.includes(listing.id));
  const userListings = listings.filter(listing => listing.userId === currentUser.id);

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleDeleteProfile = () => {
    console.log('[handleDeleteProfile] Delete profile button pressed');
    Alert.alert(
      t('deleteProfile'),
      t('cannotBeUndone'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
          onPress: () => console.log('[handleDeleteProfile] First confirmation cancelled')
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            console.log('[handleDeleteProfile] First confirmation accepted, showing second confirmation');
            setTimeout(() => {
              Alert.alert(
                t('confirmDelete'),
                t('areYouSure'),
                [
                  {
                    text: t('cancel'),
                    style: 'cancel',
                    onPress: () => console.log('[handleDeleteProfile] Second confirmation cancelled')
                  },
                  {
                    text: t('yes'),
                    style: 'destructive',
                    onPress: async () => {
                      console.log('[handleDeleteProfile] Profile deletion confirmed, calling API');
                      try {
                        await authService.deleteAccount();
                        logout();
                        console.log('[handleDeleteProfile] Account deleted and logged out, navigating to login');
                        Alert.alert(
                          t('success'),
                          language === 'az' ? 'Profil uğurla silindi' : 'Профиль успешно удален',
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                console.log('[handleDeleteProfile] Navigating to login screen');
                                router.push('/auth/login');
                              }
                            }
                          ],
                          { cancelable: false }
                        );
                      } catch (error) {
                        console.error('[handleDeleteProfile] Error during profile deletion:', error);
                        Alert.alert(
                          t('error'),
                          language === 'az' ? 'Profil silinərkən xəta baş verdi' : 'Произошла ошибка при удалении профиля'
                        );
                      }
                    },
                  },
                ]
              );
            }, 100);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString(language === 'az' ? 'az-AZ' : 'ru-RU', { month: 'long' });
    const year = date.getFullYear();
    
    return language === 'az' 
      ? `${month} ${year}` 
      : `${month} ${year}`;
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>
          {t('loginToAccessProfile')}
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={handleLogin}
        >
          <Text style={styles.authButtonText}>
            {t('login')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color={Colors.secondary} fill={Colors.secondary} />
            <Text style={styles.rating}>{currentUser.rating}</Text>
          </View>
          <Text style={styles.memberSince}>
            {t('memberSince')} {formatDate(currentUser.memberSince)}
          </Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userListings.length}</Text>
          <Text style={styles.statLabel}>
            {t('listings')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favoriteListings.length}</Text>
          <Text style={styles.statLabel}>
            {t('favorites')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{3 - freeAdsThisMonth}</Text>
          <Text style={styles.statLabel}>
            {t('freeAds')}
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/wallet')}
        >
          <View style={styles.menuIconContainer}>
            <Wallet size={20} color={Colors.primary} />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.menuItemText}>
              {t('wallet')}
            </Text>
            <Text style={styles.walletBalance}>
              {walletBalance.toFixed(2)} AZN + {bonusBalance.toFixed(2)} AZN bonus
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/my-listings')}
        >
          <View style={styles.menuIconContainer}>
            <Package size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('myListings')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/favorites')}
        >
          <View style={styles.menuIconContainer}>
            <Heart size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('favorites')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/store-management')}
        >
          <View style={styles.menuIconContainer}>
            <Store size={20} color={Colors.primary} />
          </View>
          <View style={styles.storeMenuInfo}>
            <Text style={styles.menuItemText}>
              {t('createStore')}
            </Text>
            {userStore && (
              <Text style={styles.storeStatus}>
                {userStore.adsUsed}/{userStore.maxAds} {t('listings').toLowerCase()}
              </Text>
            )}
          </View>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            console.log('Navigating to messages from profile');
            router.push('/(tabs)/messages');
          }}
        >
          <View style={styles.menuIconContainer}>
            <MessageCircle size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('messages')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/live-chat')}
        >
          <View style={styles.menuIconContainer}>
            <Headphones size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('liveSupport')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Bell size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('notifications')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/about')}
        >
          <View style={styles.menuIconContainer}>
            <HelpCircle size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('about')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.menuIconContainer}>
            <Settings size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuItemText}>
            {t('settings')}
          </Text>
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          onPress={handleDeleteProfile}
          activeOpacity={0.7}
          testID="delete-profile-button"
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Trash2 size={20} color={Colors.error} />
          </View>
          <Text style={[styles.menuItemText, { color: Colors.error }]}>
            {t('deleteProfile')}
          </Text>
          <ChevronRight size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>
          {t('logout')}
        </Text>
      </TouchableOpacity>
      
      <LiveChatWidget
        visible={showLiveChat}
        onClose={() => setShowLiveChat(false)}
        chatId={hasActiveChat ? userChats[0].id : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginTop: 1,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  section: {
    marginTop: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  walletInfo: {
    flex: 1,
  },
  walletBalance: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storeMenuInfo: {
    flex: 1,
  },
  storeStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  liveChatInfo: {
    flex: 1,
  },
  activeChatStatus: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  operatorStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error,
    marginLeft: 8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.text,
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});