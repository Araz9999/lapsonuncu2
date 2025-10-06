import React, { useState, useEffect, useRef } from 'react';
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
      refetchInterval: 3000,
    }
  );

  useEffect(() => {
    if (!currentUser) return;

    const initConversation = async () => {
      try {
        const conversation = await createConversationMutation.mutateAsync({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
        });
        setConversationId(conversation.id);
        setActiveConversation(conversation.id);
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    };

    initConversation();
  }, [currentUser]);

  useEffect(() => {
    if (messagesQuery.data && conversationId) {
      setMessages(conversationId, messagesQuery.data);
    }
  }, [messagesQuery.data, conversationId]);

  useEffect(() => {
    if (conversationId && messagesQuery.data && messagesQuery.data.length > 0) {
      markAsReadMutation.mutate({ conversationId });
    }
  }, [conversationId, messagesQuery.data]);

  useEffect(() => {
    return () => {
      if (autoReplyTimeoutRef.current) {
        clearTimeout(autoReplyTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!currentUser || !conversationId) return;

    const newMessage: LiveChatMessage = {
      id: `temp-${Date.now()}`,
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
      await sendMessageMutation.mutateAsync({
        conversationId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        message,
        isSupport: false,
      });

      messagesQuery.refetch();

      simulateSupportReply(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const simulateSupportReply = (userMessage: string) => {
    if (autoReplyTimeoutRef.current) {
      clearTimeout(autoReplyTimeoutRef.current);
    }

    setIsTyping(true);

    const timeout = setTimeout(async () => {
      setIsTyping(false);

      if (!conversationId) return;

      const replies = [
        'Thank you for contacting us! How can I help you today?',
        'I understand your concern. Let me look into that for you.',
        'Could you please provide more details about your issue?',
        'I\'m here to help! What specific information do you need?',
        'That\'s a great question. Let me assist you with that.',
      ];

      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      try {
        await sendMessageMutation.mutateAsync({
          conversationId,
          senderId: 'agent-1',
          senderName: 'Support Agent',
          senderAvatar: 'https://i.pravatar.cc/150?img=1',
          message: randomReply,
          isSupport: true,
        });

        messagesQuery.refetch();
      } catch (error) {
        console.error('Failed to send support reply:', error);
      }
    }, 2000 + Math.random() * 2000);

    autoReplyTimeoutRef.current = timeout;
  };

  const renderMessage = ({ item }: { item: LiveChatMessage }) => {
    const isCurrentUser = item.senderId === currentUser?.id;
    return <LiveChatBubble message={item} isCurrentUser={isCurrentUser} />;
  };

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
  },
});
