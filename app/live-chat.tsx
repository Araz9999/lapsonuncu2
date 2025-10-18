import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useSupportStore } from '@/store/supportStore';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';
import {
  Send,
  Paperclip,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';
import FileAttachmentPicker, { FileAttachment } from '@/components/FileAttachmentPicker';

import { logger } from '@/utils/logger';
const { width } = Dimensions.get('window');

export default function LiveChatScreen() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const { 
    liveChats, 
    operators, 
    sendMessage, 
    setTyping, 
    markMessagesAsRead,
    startLiveChat,
    categories
  } = useSupportStore();
  const colors = getColors(themeMode, colorTheme);

  const [message, setMessage] = useState<string>('');
  const [showStartForm, setShowStartForm] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState<boolean>(true);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showAttachments, setShowAttachments] = useState<boolean>(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentChat = currentChatId ? liveChats.find(chat => chat.id === currentChatId) : undefined;
  const operator = currentChat?.operatorId ? operators.find(op => op.id === currentChat.operatorId) : undefined;

  // Check if user has an active chat
  useEffect(() => {
    if (currentUser) {
      const userActiveChat = liveChats.find(chat => 
        chat.userId === currentUser.id && chat.status !== 'closed'
      );
      if (userActiveChat) {
        setCurrentChatId(userActiveChat.id);
        setShowStartForm(false);
      }
    }
  }, [currentUser, liveChats]);

  useEffect(() => {
    if (currentChat && currentUser) {
      markMessagesAsRead(currentChat.id, currentUser.id);
    }
  }, [currentChat, currentUser, markMessagesAsRead]);

  useEffect(() => {
    if (currentChat?.messages.length && shouldScrollToEnd && !isScrolling) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [currentChat?.messages.length, shouldScrollToEnd, isScrolling]);

  // Cleanup timeouts on unmount or chat change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentChatId]);

  const handleStartChat = () => {
    if (!currentUser) {
      logger.debug('[LiveChat] Cannot start chat: user not logged in');
      // Cannot start chat: user not logged in
      return;
    }
    if (!selectedCategory || !subject.trim()) return;

    const newChatId = startLiveChat(
      currentUser.id,
      subject.trim(),
      selectedCategory,
      priority
    );
    
    setCurrentChatId(newChatId);
    setShowStartForm(false);
    setSelectedCategory('');
    setSubject('');
    setPriority('medium');
  };

  const handleSendMessage = () => {
    if ((!message.trim() && attachments.length === 0) || !currentChatId || !currentUser) return;

    const attachmentUrls = attachments.map(att => att.uri);
    const messageText = message.trim() || (attachments.length > 0 ? `📎 ${attachments.length} fayl göndərildi` : '');
    
    sendMessage(
      currentChatId, 
      currentUser.id, 
      'user', 
      messageText, 
      attachmentUrls.length > 0 ? attachmentUrls : undefined
    );
    
    setMessage('');
    setAttachments([]);
    setShowAttachments(false);
    setShouldScrollToEnd(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(currentChatId, 'user', false);
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    
    if (!currentChatId) return;
    
    setTyping(currentChatId, 'user', true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(currentChatId, 'user', false);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    // ✅ Validate date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '--:--';
    }
    return date.toLocaleTimeString('az-AZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ msg }: { msg: any }) => {
    const isUser = msg.senderType === 'user';
    const isSystem = msg.senderType === 'system';
    const isOperator = msg.senderType === 'operator';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
            {msg.message}
          </Text>
          <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
            {formatTime(msg.timestamp)}
          </Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userMessage : styles.operatorMessage
      ]}>
        {isOperator && operator && (
          <View style={styles.operatorInfo}>
            <Image 
              source={{ uri: operator.avatar || 'https://via.placeholder.com/30' }}
              style={styles.operatorAvatar}
            />
            <Text style={[styles.operatorName, { color: colors.textSecondary }]}>
              {operator.name}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageContent,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            alignSelf: isUser ? 'flex-end' : 'flex-start'
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? '#fff' : colors.text }
          ]}>
            {msg.message}
          </Text>
          
          {msg.attachments && msg.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {msg.attachments.map((attachment: string, index: number) => {
                const isImage = attachment.toLowerCase().includes('.jpg') || 
                               attachment.toLowerCase().includes('.jpeg') || 
                               attachment.toLowerCase().includes('.png') || 
                               attachment.toLowerCase().includes('.gif') ||
                               attachment.startsWith('file://') ||
                               attachment.startsWith('content://') ||
                               attachment.startsWith('ph://');
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.attachmentPreview,
                      { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.border }
                    ]}
                  >
                    {isImage ? (
                      <Image 
                        source={{ uri: attachment }} 
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.documentPreview}>
                        <Text style={[styles.documentText, { color: isUser ? '#fff' : colors.text }]}>📄</Text>
                        <Text style={[styles.documentName, { color: isUser ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]} numberOfLines={1}>
                          {attachment.split('/').pop() || 'Sənəd'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
            ]}>
              {formatTime(msg.timestamp)}
            </Text>
            {isUser && (
              <View style={styles.messageStatus}>
                {msg.isRead ? (
                  <CheckCircle2 size={12} color="rgba(255,255,255,0.7)" />
                ) : (
                  <Clock size={12} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const StartChatForm = () => (
    <View style={styles.startForm}>
      <Text style={[styles.startTitle, { color: colors.text }]}>
        {language === 'az' ? 'Canlı Dəstək' : 'Живая поддержка'}
      </Text>
      <Text style={[styles.startSubtitle, { color: colors.textSecondary }]}>
        {language === 'az' 
          ? 'Operatorumuzla birbaşa əlaqə saxlayın'
          : 'Свяжитесь напрямую с нашим оператором'
        }
      </Text>

      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>
          {language === 'az' ? 'Kateqoriya' : 'Категория'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            {categories.slice(0, 3).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === category.id ? colors.primary : colors.card,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  { 
                    color: selectedCategory === category.id ? '#fff' : colors.text 
                  }
                ]}>
                  {language === 'az' ? category.name : category.nameRu}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.formLabel, { color: colors.text }]}>
          {language === 'az' ? 'Mövzu' : 'Тема'}
        </Text>
        <TextInput
          style={[
            styles.subjectInput,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }
          ]}
          placeholder={language === 'az' ? 'Probleminizi qısaca yazın' : 'Кратко опишите проблему'}
          placeholderTextColor={colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
          multiline={false}
          maxLength={100}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          {
            backgroundColor: colors.primary,
            opacity: (!selectedCategory || !subject.trim()) ? 0.5 : 1
          }
        ]}
        onPress={handleStartChat}
        disabled={!selectedCategory || !subject.trim()}
      >
        <Text style={styles.startButtonText}>
          {language === 'az' ? 'Söhbət Başlat' : 'Начать чат'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: language === 'az' ? 'Canlı Dəstək' : 'Живая поддержка',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }} 
        />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {language === 'az' ? 'Daxil olun' : 'Войдите в систему'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: language === 'az' ? 'Canlı Dəstək' : 'Живая поддержка',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }} 
      />
      {showStartForm ? (
        <StartChatForm />
      ) : currentChat ? (
        <View style={styles.chatContent}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
            onContentSizeChange={() => {
              if (shouldScrollToEnd && !isScrolling) {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }
            }}
            onScrollBeginDrag={() => {
              setIsScrolling(true);
              setShouldScrollToEnd(false);
            }}
            onScrollEndDrag={() => {
              setIsScrolling(false);
            }}
            onMomentumScrollEnd={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
              setShouldScrollToEnd(isAtBottom);
              setIsScrolling(false);
            }}
          >
            {currentChat.messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            
            {currentChat.operatorTyping && (
              <View style={styles.typingIndicator}>
                <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.textSecondary }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {currentChat.status !== 'closed' ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={0}
              style={styles.inputSection}
            >
              {showAttachments && (
                <View style={[styles.attachmentsSection, { backgroundColor: colors.card }]}>
                  <FileAttachmentPicker
                    attachments={attachments}
                    onAttachmentsChange={(newAttachments) => {
                      setAttachments(newAttachments);
                    }}
                    maxFiles={3}
                  />
                </View>
              )}
              
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.background
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.attachButton,
                    {
                      backgroundColor: showAttachments ? colors.primary : colors.card,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setShowAttachments(!showAttachments)}
                >
                  <Paperclip size={18} color={showAttachments ? '#fff' : colors.textSecondary} />
                </TouchableOpacity>
                
                <TextInput
                  testID="livechat-input"
                  style={[
                    styles.messageInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    }
                  ]}
                  placeholder={language === 'az' ? 'Mesajınızı yazın...' : 'Напишите сообщение...'}
                  placeholderTextColor={colors.textSecondary}
                  value={message}
                  onChangeText={handleTyping}
                  multiline={false}
                  numberOfLines={1}
                  textAlignVertical="center"
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                  autoCorrect={false}
                  autoCapitalize="sentences"
                  enablesReturnKeyAutomatically={false}
                  scrollEnabled={false}
                  onContentSizeChange={() => {}}
                  keyboardAppearance={Platform.OS === 'ios' ? (themeMode === 'dark' ? 'dark' : 'light') : 'default'}
                  maxLength={1000}
                />
                
                <TouchableOpacity
                  testID="livechat-send"
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: (message.trim() || attachments.length > 0) ? colors.primary : colors.border
                    }
                  ]}
                  onPress={handleSendMessage}
                  disabled={!message.trim() && attachments.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'az' ? 'Mesajı göndər' : 'Отправить сообщение'}
                >
                  <Send size={18} color={(message.trim() || attachments.length > 0) ? '#fff' : colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={[styles.closedChatContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.closedChatText, { color: colors.textSecondary }]}>
                {language === 'az' 
                  ? 'Bu söhbət bağlanıb.'
                  : 'Этот чат закрыт.'
                }
              </Text>
              <TouchableOpacity
                style={[styles.reopenButton, { backgroundColor: colors.primary }]}
                onPress={() => router.back()}
              >
                <RefreshCw size={16} color="#fff" />
                <Text style={styles.reopenButtonText}>
                  {language === 'az' ? 'Geri' : 'Назад'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {language === 'az' ? 'Söhbət tapılmadı' : 'Чат не найден'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  chatContent: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  operatorMessage: {
    alignItems: 'flex-start',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  operatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  operatorName: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageContent: {
    maxWidth: width * 0.75,
    borderRadius: 16,
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 11,
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    borderRadius: 16,
    padding: 12,
    minWidth: 60,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  inputSection: {
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    minHeight: 76,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    height: 44,
    lineHeight: Platform.OS === 'android' ? 20 : 22,
    marginRight: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  attachmentPreview: {
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 60,
    height: 60,
  },
  documentPreview: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  documentText: {
    fontSize: 20,
    marginBottom: 2,
  },
  documentName: {
    fontSize: 8,
    textAlign: 'center',
  },
  closedChatContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  closedChatText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reopenButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  startForm: {
    padding: 20,
    flex: 1,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 50,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
