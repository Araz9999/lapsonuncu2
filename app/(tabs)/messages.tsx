import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import Colors from '@/constants/colors';
import { users } from '@/mocks/users';
import { listings } from '@/mocks/listings';
import { MessageCircle } from 'lucide-react-native';

import { logger } from '@/utils/logger';
export default function MessagesScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { isAuthenticated, currentUser } = useUserStore();
  const { conversations, simulateIncomingMessage, getFilteredConversations, deleteAllMessagesFromUser } = useMessageStore();
  
  logger.debug('MessagesScreen - isAuthenticated:', isAuthenticated);
  logger.debug('MessagesScreen - currentUser:', currentUser?.name);
  logger.debug('MessagesScreen - conversations count:', conversations.length);

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>
          {language === 'az' ? 'Mesajlarınızı görmək üçün daxil olun' : 'Войдите, чтобы увидеть свои сообщения'}
        </Text>
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.authButtonText}>
            {language === 'az' ? 'Daxil ol' : 'Войти'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return language === 'az' ? 'Bu gün' : 'Сегодня';
    } else if (diffDays === 1) {
      return language === 'az' ? 'Dünən' : 'Вчера';
    } else {
      return diffDays + (language === 'az' ? ' gün əvvəl' : ' дней назад');
    }
  }, [language]);

  const getOtherUser = (participants: string[]) => {
    const selfId = currentUser?.id || 'user1';
    const otherUserId = participants.find(id => id !== selfId);
    return users.find(user => user.id === otherUserId);
  };

  const getListing = (listingId: string) => {
    return listings.find(listing => listing.id === listingId);
  };

  const renderItem = ({ item }: { item: typeof conversations[0] }) => {
    const otherUser = getOtherUser(item.participants);
    const listing = getListing(item.listingId);
    
    if (!otherUser || !listing) return null;
    
    const handlePress = () => {
      logger.debug('Navigating to conversation:', item.id);
      logger.debug('Other user:', otherUser?.name);
      logger.debug('Listing:', listing?.title);
      const conversationId = item.id;
      if (conversationId && typeof conversationId === 'string') {
        logger.debug('Pushing to conversation route:', `/conversation/${conversationId}`);
        try {
          router.push(`/conversation/${conversationId}`);
        } catch (error) {
          logger.error('Navigation error:', error);
        }
      } else {
        logger.error('Invalid conversation ID:', conversationId);
      }
    };
    
    const handleLongPress = () => {
      if (!otherUser) return;
      
      const title = language === 'az' ? 'Mesaj əməliyyatları' : 'Операции с сообщениями';
      const deleteAllMessage = language === 'az' 
        ? `${otherUser.name} istifadəçisinin bütün mesajlarını silmək istəyirsinizmi?`
        : `Удалить все сообщения от пользователя ${otherUser.name}?`;
      const deleteAllButton = language === 'az' ? 'Bütün mesajları sil' : 'Удалить все сообщения';
      const cancelButton = language === 'az' ? 'Ləğv et' : 'Отмена';
      
      Alert.alert(
        title,
        deleteAllMessage,
        [
          {
            text: cancelButton,
            style: 'cancel',
          },
          {
            text: deleteAllButton,
            style: 'destructive',
            onPress: () => {
              logger.debug('Deleting all messages from user:', otherUser.id);
              deleteAllMessagesFromUser(otherUser.id);
            },
          },
        ]
      );
    };
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{otherUser.name}</Text>
            <Text style={styles.date}>{item.lastMessageDate ? formatDate(item.lastMessageDate) : ''}</Text>
          </View>
          
          <Text style={styles.listingTitle} numberOfLines={1}>
            {listing.title[language]}
          </Text>
          
          <View style={styles.messageRow}>
            <Text 
              style={[
                styles.lastMessage, 
                item.unreadCount > 0 && styles.unreadMessage
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage || (language === 'az' ? 'Mesaj yoxdur' : 'Нет сообщений')}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Get filtered conversations (excluding blocked users) and sort by last message date
  const sortedConversations = useMemo(() => {
    const filteredConversations = getFilteredConversations();
    return [...filteredConversations].sort((a, b) => {
      const dateA = new Date(a.lastMessageDate || 0).getTime();
      const dateB = new Date(b.lastMessageDate || 0).getTime();
      return dateB - dateA;
    });
  }, [getFilteredConversations]);

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedConversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <TouchableOpacity 
            style={styles.simulateButton}
            onPress={simulateIncomingMessage}
          >
            <MessageCircle size={16} color={Colors.primary} />
            <Text style={styles.simulateButtonText}>
              {language === 'az' ? 'Yeni mesaj simulyasiyası' : 'Симуляция нового сообщения'}
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listingTitle: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  simulateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});