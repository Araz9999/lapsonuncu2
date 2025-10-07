import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useLiveChatStore } from '@/store/liveChatStore';
import { trpc } from '@/lib/trpc';
import LiveChatHeader from '@/components/LiveChatHeader';
import LiveChatBubble from '@/components/LiveChatBubble';
import LiveChatInput from '@/components/LiveChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import { LiveChatMessage } from '@/types/liveChat';
import { useTranslation } from '@/constants/translations';

export default function LiveChatScreen() {
  const { currentUser } = useUserStore();
  const { setActiveConversation, addMessage, setMessages } = useLiveChatStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const autoReplyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const createConversationMutation = trpc.liveChat.createConversation.useMutation();
  const sendMessageMutation = trpc.liveChat.sendMessage.useMutation();
  const markAsReadMutation = trpc.liveChat.markAsRead.useMutation();

  const messagesQuery = trpc.liveChat.getMessages.useQuery(
    { conversationId: conversationId || '' },
    {
      enabled: !!conversationId,
      refetchInterval: 2000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || conversationId) {
      return;
    }

    const initConversation = async () => {
      try {
        console.log('[LiveChat] Initializing conversation for user:', currentUser.id);
        const conversation = await createConversationMutation.mutateAsync({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
        });
        console.log('[LiveChat] Conversation initialized:', conversation.id);
        setConversationId(conversation.id);
        setActiveConversation(conversation.id);
        setError(null);
      } catch (error) {
        console.error('[LiveChat] Failed to create conversation:', error);
        setError('Canlı dəstək xidməti hazırda əlçatan deyil. Zəhmət olmasa daha sonra yenidən cəhd edin.');
      }
    };

    initConversation();
  }, [currentUser, conversationId]);

  useEffect(() => {
    if (messagesQuery.data && conversationId) {
      console.log('[LiveChat] Updating messages from query:', messagesQuery.data.length, 'messages');
      setMessages(conversationId, messagesQuery.data);
    }
  }, [messagesQuery.data, conversationId, setMessages]);

  useEffect(() => {
    if (conversationId && messagesQuery.data && messagesQuery.data.length > 0) {
      const unreadMessages = messagesQuery.data.filter(m => m.isSupport && m.status !== 'seen');
      if (unreadMessages.length > 0) {
        console.log('[LiveChat] Marking', unreadMessages.length, 'messages as read');
        markAsReadMutation.mutate({ conversationId });
      }
    }
  }, [conversationId, messagesQuery.data, markAsReadMutation]);

  useEffect(() => {
    return () => {
      if (autoReplyTimeoutRef.current) {
        clearTimeout(autoReplyTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!currentUser || !conversationId) {
      console.warn('[LiveChat] Cannot send message: missing user or conversation');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[LiveChat] Sending message:', { tempId, conversationId, message: message.substring(0, 50) });

    const newMessage: LiveChatMessage = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      message,
      timestamp: new Date().toISOString(),
      status: 'sending',
      isSupport: false,
    };

    addMessage(newMessage);

    try {
      const sentMessage = await sendMessageMutation.mutateAsync({
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        message,
        isSupport: false,
      });

      console.log('[LiveChat] Message sent successfully:', sentMessage.id);
      
      await messagesQuery.refetch();

      simulateSupportReply(message);
    } catch (error) {
      console.error('[LiveChat] Failed to send message:', error);
      
      const failedMessage: LiveChatMessage = {
        ...newMessage,
        status: 'sending',
      };
      addMessage(failedMessage);
    }
  };

  const simulateSupportReply = (userMessage: string) => {
    if (autoReplyTimeoutRef.current) {
      clearTimeout(autoReplyTimeoutRef.current);
    }

    console.log('[LiveChat] Simulating support reply for message:', userMessage.substring(0, 50));
    setIsTyping(true);

    const timeout = setTimeout(async () => {
      setIsTyping(false);

      if (!conversationId) {
        console.warn('[LiveChat] Cannot send support reply: no conversation');
        return;
      }

      const replies = [
        'Thank you for contacting us! How can I help you today?',
        'I understand your concern. Let me look into that for you.',
        'Could you please provide more details about your issue?',
        'I\'m here to help! What specific information do you need?',
        'That\'s a great question. Let me assist you with that.',
      ];

      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      try {
        console.log('[LiveChat] Sending support reply:', randomReply.substring(0, 50));
        await sendMessageMutation.mutateAsync({
          conversationId,
          senderId: 'agent-1',
          senderName: 'Support Agent',
          senderAvatar: 'https://i.pravatar.cc/150?img=1',
          message: randomReply,
          isSupport: true,
        });

        console.log('[LiveChat] Support reply sent, refetching messages');
        await messagesQuery.refetch();
      } catch (error) {
        console.error('[LiveChat] Failed to send support reply:', error);
      }
    }, 2000 + Math.random() * 2000);

    autoReplyTimeoutRef.current = timeout;
  };

  const renderMessage = useCallback(({ item }: { item: LiveChatMessage }) => {
    const isCurrentUser = item.senderId === currentUser?.id;
    return <LiveChatBubble message={item} isCurrentUser={isCurrentUser} />;
  }, [currentUser?.id]);

  const keyExtractor = useCallback((item: LiveChatMessage) => item.id, []);

  const getItemLayout = useCallback((_: ArrayLike<LiveChatMessage> | null | undefined, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('loginToAccessProfile')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LiveChatHeader />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>
            Alternativ olaraq dəstək bölməsindən bizimlə əlaqə saxlaya bilərsiniz.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationId || messagesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LiveChatHeader />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <LiveChatHeader agentName="Support Agent" agentStatus="online" />

        <FlatList
          ref={flatListRef}
          data={messagesQuery.data || []}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('noMessages')}</Text>
              <Text style={styles.emptySubtext}>Start a conversation with our support team</Text>
            </View>
          }
        />

        {isTyping && <TypingIndicator name="Support Agent" />}

        <LiveChatInput
          onSend={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
