import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Stack } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useSupportStore } from '@/store/supportStore';
import { getColors } from '@/constants/colors';
import { prompt } from '@/utils/confirm';
import { 
  MessageSquare, 
  Send, 
  AlertTriangle, 
  Settings, 
  Lightbulb, 
  CreditCard, 
  HelpCircle,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  MessageCircle,
  Headphones,
  Users,
  MessageSquarePlus
} from 'lucide-react-native';
import FileAttachmentPicker, { FileAttachment } from '@/components/FileAttachmentPicker';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function SupportScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const { currentUser } = useUserStore();
  const { categories, createTicket, getTicketsByUser, liveChats, operators, getAvailableOperators, startLiveChat } = useSupportStore();
  const colors = getColors(themeMode, colorTheme);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showLiveChat, setShowLiveChat] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const userTickets = currentUser ? getTicketsByUser(currentUser.id) : [];
  const userChats = currentUser ? liveChats.filter(chat => chat.userId === currentUser.id) : [];
  const availableOperators = getAvailableOperators();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Settings': return Settings;
      case 'AlertTriangle': return AlertTriangle;
      case 'Lightbulb': return Lightbulb;
      case 'CreditCard': return CreditCard;
      case 'HelpCircle': return HelpCircle;
      default: return HelpCircle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock;
      case 'in_progress': return AlertCircle;
      case 'resolved': return CheckCircle;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FFA500';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#FFA500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFA500';
      case 'high': return '#FF5722';
      case 'urgent': return '#F44336';
      default: return '#FFA500';
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory || !subject.trim() || !message.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Bütün sahələri doldurun' : 'Заполните все поля'
      );
      return;
    }

    if (!currentUser) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Daxil olun' : 'Войдите в систему'
      );
      return;
    }

    // Convert FileAttachment to string array for storage
    const attachmentUris = attachments.map(att => att.uri);

    createTicket({
      userId: currentUser.id,
      subject: subject.trim(),
      message: message.trim(),
      category: selectedCategory as any,
      priority,
      status: 'open',
      attachments: attachmentUris
    });

    const attachmentText = attachments.length > 0 
      ? (language === 'az' 
          ? ` ${attachments.length} fayl əlavə edildi.`
          : ` Добавлено ${attachments.length} файлов.`)
      : '';

    Alert.alert(
      language === 'az' ? 'Uğurlu' : 'Успешно',
      (language === 'az' 
        ? 'Müraciətiniz göndərildi. Tezliklə cavab veriləcək.'
        : 'Ваше обращение отправлено. Скоро мы ответим.') + attachmentText,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowForm(false);
            setSelectedCategory('');
            setSubject('');
            setMessage('');
            setPriority('medium');
            setAttachments([]);
          }
        }
      ]
    );
  };

  const CategoryCard = ({ category }: { category: any }) => {
    const IconComponent = getCategoryIcon(category.icon);
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { 
            backgroundColor: colors.card,
            borderColor: selectedCategory === category.id ? colors.primary : colors.border
          }
        ]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: `${colors.primary}15` }]}>
          <IconComponent size={24} color={colors.primary} />
        </View>
        <Text style={[styles.categoryName, { color: colors.text }]}>
          {language === 'az' ? category.name : category.nameRu}
        </Text>
        <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
          {language === 'az' ? category.description : category.descriptionRu}
        </Text>
      </TouchableOpacity>
    );
  };

  const TicketCard = ({ ticket }: { ticket: any }) => {
    const StatusIcon = getStatusIcon(ticket.status);
    
    return (
      <TouchableOpacity
        style={[styles.ticketCard, { backgroundColor: colors.card }]}
        onPress={() => {
          Alert.alert(
            language === 'az' ? 'Müraciət detalları' : 'Детали обращения',
            `${language === 'az' ? 'Mövzu' : 'Тема'}: ${ticket.subject}\n\n${ticket.message}\n\n${language === 'az' ? 'Cavablar' : 'Ответы'}: ${ticket.responses.length}`,
            [
              {
                text: language === 'az' ? 'Bağla' : 'Закрыть',
                style: 'cancel'
              },
              {
                text: language === 'az' ? 'Cavab yaz' : 'Написать ответ',
                onPress: async () => {
                  const text = await prompt(
                    language === 'az' ? 'Cavabınızı yazın' : 'Напишите ваш ответ',
                    language === 'az' ? 'Cavab yazın' : 'Напишите ответ'
                  );
                  if (text && text.trim() && currentUser) {
                    const { addResponse } = useSupportStore.getState();
                    addResponse(ticket.id, {
                      ticketId: ticket.id,
                      userId: currentUser.id,
                      message: text.trim(),
                      isAdmin: false
                    });
                    Alert.alert(
                      language === 'az' ? 'Uğurlu' : 'Успешно',
                      language === 'az' ? 'Cavabınız göndərildi' : 'Ваш ответ отправлен'
                    );
                  }
                }
              }
            ]
          );
        }}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketInfo}>
            <Text style={[styles.ticketSubject, { color: colors.text }]} numberOfLines={1}>
              {ticket.subject}
            </Text>
            <Text style={[styles.ticketDate, { color: colors.textSecondary }]}>
              {ticket.createdAt.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.ticketStatus}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${getStatusColor(ticket.status)}20` }
            ]}>
              <StatusIcon size={12} color={getStatusColor(ticket.status)} />
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(ticket.status) }
              ]}>
                {language === 'az' 
                  ? ticket.status === 'open' ? 'Açıq' 
                    : ticket.status === 'in_progress' ? 'İcrada'
                    : ticket.status === 'resolved' ? 'Həll edilib'
                    : 'Bağlı'
                  : ticket.status === 'open' ? 'Открыт'
                    : ticket.status === 'in_progress' ? 'В работе'
                    : ticket.status === 'resolved' ? 'Решен'
                    : 'Закрыт'
                }
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </View>
        <Text style={[styles.ticketMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {ticket.message}
        </Text>
        {ticket.attachments && ticket.attachments.length > 0 && (
          <View style={styles.attachmentIndicator}>
            <Paperclip size={14} color={colors.textSecondary} />
            <Text style={[styles.attachmentCount, { color: colors.textSecondary }]}>
              {ticket.attachments.length} {language === 'az' ? 'fayl' : 'файлов'}
            </Text>
          </View>
        )}
        <View style={styles.ticketFooter}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: `${getPriorityColor(ticket.priority)}20` }
          ]}>
            <Text style={[
              styles.priorityText,
              { color: getPriorityColor(ticket.priority) }
            ]}>
              {language === 'az'
                ? ticket.priority === 'low' ? 'Aşağı'
                  : ticket.priority === 'medium' ? 'Orta'
                  : ticket.priority === 'high' ? 'Yüksək'
                  : 'Təcili'
                : ticket.priority === 'low' ? 'Низкий'
                  : ticket.priority === 'medium' ? 'Средний'
                  : ticket.priority === 'high' ? 'Высокий'
                  : 'Срочный'
              }
            </Text>
          </View>
          {ticket.responses.length > 0 && (
            <Text style={[styles.responseCount, { color: colors.primary }]}>
              {ticket.responses.length} {language === 'az' ? 'cavab' : 'ответов'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: language === 'az' ? 'Texniki Dəstək' : 'Техническая поддержка',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }} 
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {!showForm ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
              <View style={styles.headerContent}>
                <View style={styles.headerIcon}>
                  <MessageSquare size={32} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>
                  {language === 'az' ? 'Texniki Dəstək' : 'Техническая поддержка'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {language === 'az' 
                    ? 'Suallarınız və problemləriniz üçün bizə yazın'
                    : 'Напишите нам по вопросам и проблемам'
                  }
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Tez əlaqə' : 'Быстрая связь'}
              </Text>
              
              {/* Live Chat Option */}
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card }]}
                onPress={() => {
                  if (!currentUser) {
                    Alert.alert(
                      language === 'az' ? 'Xəta' : 'Ошибка',
                      language === 'az' ? 'Daxil olun' : 'Войдите в систему'
                    );
                    return;
                  }
                  router.push('/live-chat');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <MessageCircle size={20} color={colors.primary} />
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                    {language === 'az' ? 'Canlı dəstək' : 'Живая поддержка'}
                  </Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    {language === 'az' ? 'Operatorla birbaşa söhbət' : 'Прямой чат с оператором'}
                  </Text>
                  {availableOperators.length > 0 && (
                    <View style={styles.operatorStatus}>
                      <View style={styles.onlineDot} />
                      <Text style={[styles.operatorStatusText, { color: colors.primary }]}>
                        {availableOperators.length} {language === 'az' ? 'operator onlayn' : 'операторов онлайн'}
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {/* Traditional Ticket */}
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card }]}
                onPress={() => setShowForm(true)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <MessageSquare size={20} color={colors.primary} />
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                    {language === 'az' ? 'Yeni müraciət' : 'Новое обращение'}
                  </Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    {language === 'az' ? 'Problem və ya sual göndər' : 'Отправить проблему или вопрос'}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Active Chats */}
            {userChats.filter(chat => chat.status !== 'closed').length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {language === 'az' ? 'Aktiv söhbətlər' : 'Активные чаты'}
                </Text>
                {userChats.filter(chat => chat.status !== 'closed').map((chat) => {
                  const operator = chat.operatorId ? operators.find(op => op.id === chat.operatorId) : null;
                  return (
                    <TouchableOpacity
                      key={chat.id}
                      style={[styles.chatCard, { backgroundColor: colors.card }]}
                      onPress={() => {
                        setActiveChatId(chat.id);
                        setShowLiveChat(true);
                      }}
                    >
                      <View style={styles.chatHeader}>
                        <View style={styles.chatInfo}>
                          <Text style={[styles.chatSubject, { color: colors.text }]} numberOfLines={1}>
                            {chat.subject}
                          </Text>
                          <Text style={[styles.chatDate, { color: colors.textSecondary }]}>
                            {chat.createdAt.toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.chatStatus}>
                          <View style={[
                            styles.statusBadge, 
                            { backgroundColor: `${getStatusColor(chat.status)}20` }
                          ]}>
                            <View style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(chat.status) }
                            ]} />
                            <Text style={[
                              styles.statusText, 
                              { color: getStatusColor(chat.status) }
                            ]}>
                              {language === 'az' 
                                ? chat.status === 'waiting' ? 'Gözləyir'
                                  : chat.status === 'active' ? 'Aktiv'
                                  : 'Bağlı'
                                : chat.status === 'waiting' ? 'Ожидание'
                                  : chat.status === 'active' ? 'Активен'
                                  : 'Закрыт'
                              }
                            </Text>
                          </View>
                          <ChevronRight size={16} color={colors.textSecondary} />
                        </View>
                      </View>
                      {operator && (
                        <View style={styles.operatorInfo}>
                          <Headphones size={14} color={colors.textSecondary} />
                          <Text style={[styles.operatorName, { color: colors.textSecondary }]}>
                            {operator.name}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.messageCount, { color: colors.primary }]}>
                        {chat.messages.length} {language === 'az' ? 'mesaj' : 'сообщений'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* My Tickets */}
            {userTickets.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {language === 'az' ? 'Mənim müraciətlərim' : 'Мои обращения'}
                </Text>
                {userTickets.slice(0, 3).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
                {userTickets.length > 3 && (
                  <TouchableOpacity
                    style={[styles.viewAllButton, { backgroundColor: colors.card }]}
                    onPress={() => {
                      Alert.alert(
                        language === 'az' ? 'Bütün müraciətlər' : 'Все обращения',
                        userTickets.map(t => `${t.subject} - ${t.status}`).join('\n')
                      );
                    }}
                  >
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>
                      {language === 'az' ? 'Hamısını gör' : 'Посмотреть все'}
                    </Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* FAQ */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Tez-tez verilən suallar' : 'Часто задаваемые вопросы'}
              </Text>
              
              <TouchableOpacity
                style={[styles.faqItem, { backgroundColor: colors.card }]}
                onPress={() => {
                  Alert.alert(
                    language === 'az' ? 'Elan necə yerləşdirilir?' : 'Как разместить объявление?',
                    language === 'az' 
                      ? 'Ana səhifədə "+" düyməsinə basın və formu doldurun.'
                      : 'Нажмите кнопку "+" на главной странице и заполните форму.'
                  );
                }}
              >
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {language === 'az' ? 'Elan necə yerləşdirilir?' : 'Как разместить объявление?'}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.faqItem, { backgroundColor: colors.card }]}
                onPress={() => {
                  Alert.alert(
                    language === 'az' ? 'Ödəniş necə edilir?' : 'Как произвести оплату?',
                    language === 'az' 
                      ? 'Kart, bank köçürməsi və ya mobil ödəniş üsulları ilə.'
                      : 'Картой, банковским переводом или мобильными платежами.'
                  );
                }}
              >
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {language === 'az' ? 'Ödəniş necə edilir?' : 'Как произвести оплату?'}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowForm(false);
                  setSelectedCategory('');
                  setSubject('');
                  setMessage('');
                  setPriority('medium');
                  setAttachments([]);
                }}
              >
                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                  {language === 'az' ? '← Geri' : '← Назад'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {language === 'az' ? 'Yeni müraciət' : 'Новое обращение'}
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Kateqoriya seçin' : 'Выберите категорию'}
              </Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Prioritet' : 'Приоритет'}
              </Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      { 
                        backgroundColor: priority === p ? getPriorityColor(p) : colors.card,
                        borderColor: getPriorityColor(p)
                      }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[
                      styles.priorityText,
                      { color: priority === p ? '#fff' : getPriorityColor(p) }
                    ]}>
                      {language === 'az'
                        ? p === 'low' ? 'Aşağı'
                          : p === 'medium' ? 'Orta'
                          : p === 'high' ? 'Yüksək'
                          : 'Təcili'
                        : p === 'low' ? 'Низкий'
                          : p === 'medium' ? 'Средний'
                          : p === 'high' ? 'Высокий'
                          : 'Срочный'
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Mövzu' : 'Тема'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder={language === 'az' ? 'Mövzunu qısaca yazın' : 'Кратко опишите тему'}
                placeholderTextColor={colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>

            {/* Message Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {language === 'az' ? 'Mesaj' : 'Сообщение'}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder={language === 'az' 
                  ? 'Probleminizi və ya sualınızı ətraflı yazın...'
                  : 'Подробно опишите вашу проблему или вопрос...'
                }
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {message.length}/1000
              </Text>
            </View>

            {/* File Attachments */}
            <View style={styles.section}>
              <FileAttachmentPicker
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                maxFiles={5}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: (!selectedCategory || !subject.trim() || !message.trim()) ? 0.5 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={!selectedCategory || !subject.trim() || !message.trim()}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {language === 'az' ? 'Göndər' : 'Отправить'}
                {attachments.length > 0 && ` (${attachments.length} fayl)`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
  },
  ticketStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  ticketMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  responseCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 16,
    flex: 1,
  },
  formHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  attachmentCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  operatorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  operatorStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chatInfo: {
    flex: 1,
  },
  chatSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 12,
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  operatorName: {
    fontSize: 12,
    marginLeft: 4,
  },
  messageCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});