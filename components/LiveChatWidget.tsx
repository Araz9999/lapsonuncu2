import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useSupportStore } from '@/store/supportStore';
import { getColors } from '@/constants/colors';
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Phone,
  Paperclip,
  MoreVertical,
  Clock,
  CheckCircle2,
  User,
  Headphones
} from 'lucide-react-native';
import { LiveChat, LiveChatMessage } from '@/types/support';

const { width, height } = Dimensions.get('window');

interface LiveChatWidgetProps {
  visible: boolean;
  onClose: () => void;
  chatId?: string;
}

export default function LiveChatWidget({ visible, onClose, chatId }: LiveChatWidgetProps) {
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const { currentUser } = useUserStore();
  const { 
    liveChats, 
    operators, 
    sendMessage, 
    closeLiveChat, 
    setTyping, 
    markMessagesAsRead,
    startLiveChat,
    categories
  } = useSupportStore();
  const colors = getColors(themeMode, colorTheme);

  const [message, setMessage] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showStartForm, setShowStartForm] = useState<boolean>(!chatId);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentChat = currentChatId ? liveChats.find(chat => chat.id === currentChatId) : undefined;
  const operator = currentChat?.operatorId ? operators.find(op => op.id === currentChat.operatorId) : undefined;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (currentChat && currentUser) {
      markMessagesAsRead(currentChat.id, currentUser.id);
    }
  }, [currentChat?.messages.length]);

  useEffect(() => {
    if (currentChat?.messages.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentChat?.messages]);

  const handleStartChat = () => {
    if (!currentUser || !selectedCategory || !subject.trim()) return;

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
    if (!message.trim() || !currentChatId || !currentUser) return;

    sendMessage(currentChatId, currentUser.id, 'user', message.trim());
    setMessage('');
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    setTyping(currentChatId, 'user', false);
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    
    if (!currentChatId) return;
    
    // Set typing indicator
    setTyping(currentChatId, 'user', true);
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to clear typing indicator
    const timeout = setTimeout(() => {
      setTyping(currentChatId, 'user', false);
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  const handleCloseChat = () => {
    if (currentChatId) {
      closeLiveChat(currentChatId);
    }
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('az-AZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#FFA500';
      case 'active': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#FFA500';
    }
  };

  const MessageBubble = ({ msg }: { msg: LiveChatMessage }) => {
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
        <MessageCircle size={20} color="#fff" />
        <Text style={styles.startButtonText}>
          {language === 'az' ? 'Söhbət Başlat' : 'Начать чат'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.chatContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            },
            isMinimized && styles.minimizedContainer
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Headphones size={20} color="#fff" />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>
                  {language === 'az' ? 'Canlı Dəstək' : 'Живая поддержка'}
                </Text>
                {currentChat && (
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(currentChat.status) }
                    ]} />
                    <Text style={styles.statusText}>
                      {language === 'az'
                        ? currentChat.status === 'waiting' ? 'Gözləyir'
                          : currentChat.status === 'active' ? 'Aktiv'
                          : 'Bağlı'
                        : currentChat.status === 'waiting' ? 'Ожидание'
                          : currentChat.status === 'active' ? 'Активен'
                          : 'Закрыт'
                      }
                    </Text>
                    {operator && (
                      <Text style={styles.operatorText}>
                        • {operator.name}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCloseChat}
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {!isMinimized && (
            <>
              {/* Content */}
              <View style={styles.content}>
                {showStartForm ? (
                  <StartChatForm />
                ) : currentChat ? (
                  <KeyboardAvoidingView 
                    style={styles.chatContent}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  >
                    {/* Messages */}
                    <ScrollView
                      ref={scrollViewRef}
                      style={styles.messagesContainer}
                      showsVerticalScrollIndicator={false}
                      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    >
                      {currentChat.messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} />
                      ))}
                      
                      {/* Typing Indicator */}
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

                    {/* Input */}
                    {currentChat.status !== 'closed' && (
                      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                        <TextInput
                          style={[
                            styles.messageInput,
                            {
                              backgroundColor: colors.background,
                              color: colors.text,
                              borderColor: colors.border
                            }
                          ]}
                          placeholder={language === 'az' ? 'Mesajınızı yazın...' : 'Напишите сообщение...'}
                          placeholderTextColor={colors.textSecondary}
                          value={message}
                          onChangeText={handleTyping}
                          multiline
                          maxLength={1000}
                        />
                        
                        <TouchableOpacity
                          style={[
                            styles.sendButton,
                            {
                              backgroundColor: message.trim() ? colors.primary : colors.border
                            }
                          ]}
                          onPress={handleSendMessage}
                          disabled={!message.trim()}
                        >
                          <Send size={18} color={message.trim() ? '#fff' : colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </KeyboardAvoidingView>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                      {language === 'az' ? 'Söhbət tapılmadı' : 'Чат не найден'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: height * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  minimizedContainer: {
    height: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  operatorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
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
    minHeight: 50,
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
    marginLeft: 8,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});