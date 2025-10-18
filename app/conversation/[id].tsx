import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import { useCallStore } from '@/store/callStore';
import Colors from '@/constants/colors';
import { users } from '@/mocks/users';
import { listings } from '@/mocks/listings';
import { Message, MessageAttachment, MessageType } from '@/types/message';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  File,
  X,
  Download,
  Play,
  Pause,
  Phone,
  MessageSquare,
  EyeOff,
  MoreVertical,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import UserActionModal from '@/components/UserActionModal';

import { logger } from '@/utils/logger';
const { width: screenWidth } = Dimensions.get('window');

const ChatInput = memo(({ 
  inputText, 
  onChangeText, 
  onSend, 
  onAttach, 
  onRecord, 
  isRecording, 
  language 
}: { 
  inputText: string; 
  onChangeText: (text: string) => void; 
  onSend: () => void; 
  onAttach: () => void; 
  onRecord: { onPressIn?: () => void; onPressOut?: () => void; onPress?: () => void }; 
  isRecording: boolean; 
  language: string;
}) => {
  logger.debug('ChatInput render');
  // ChatInput component
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity
        testID="chat-attach-button"
        style={styles.attachButton}
        onPress={onAttach}
      >
        <Paperclip size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
      
      <TextInput
        testID="chat-text-input"
        style={styles.textInput}
        value={inputText}
        onChangeText={onChangeText}
        placeholder={language === 'az' ? 'Mesaj yazın...' : 'Напишите сообщение...'}
        placeholderTextColor={Colors.textSecondary}
        multiline
        maxLength={1000}
        onSubmitEditing={() => {
          const textToSend = inputText.trim();
          if (textToSend) {
            onSend();
          }
        }}
        blurOnSubmit={false}
        returnKeyType="send"
      />
      
      {inputText.trim() ? (
        <TouchableOpacity
          testID="chat-send-button"
          style={styles.sendButton}
          onPress={onSend}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          testID="chat-mic-button"
          style={[styles.sendButton, isRecording && styles.recordingButton]}
          onPressIn={onRecord.onPressIn}
          onPressOut={onRecord.onPressOut}
          onPress={onRecord.onPress}
        >
          <Mic size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
});

ChatInput.displayName = 'ChatInput';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;

  const { language } = useLanguageStore();
  const { currentUser } = useUserStore();
  const { conversations, getConversation, addMessage, markAsRead, getOrCreateConversation, deleteMessage } = useMessageStore();
  const { initiateCall } = useCallStore();
  
  // All hooks must be called before any early returns
  const [inputText, setInputText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null); // ✅ Max duration timer
  const [showAttachmentModal, setShowAttachmentModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showUserActionModal, setShowUserActionModal] = useState<boolean>(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  
  const flatListRef = useRef<FlatList>(null);
  
  logger.debug('ConversationScreen - ID:', conversationId);
  
  // Get conversation data or try to find/create one
  const [conversation, setConversation] = useState<any>(null);
  
  // Update conversation when conversations change or conversationId changes
  useEffect(() => {
    if (!conversationId || typeof conversationId !== 'string') {
      setConversation(null);
      return;
    }
    
    let foundConversation = getConversation(conversationId);
    
    // If no conversation found, check if conversationId is actually a user ID
    // and try to find an existing conversation with that user
    if (!foundConversation && currentUser) {
      const potentialUser = users.find(user => user.id === conversationId);
      if (potentialUser) {
        // Try to find existing conversation with this user
        const existingConv = conversations.find(conv => 
          conv.participants.includes(currentUser.id) && 
          conv.participants.includes(conversationId)
        );
        if (existingConv) {
          foundConversation = existingConv;
          logger.debug('ConversationScreen - Found existing conversation:', existingConv.id);
        }
      }
    }
    
    // Always update conversation state with a fresh copy to trigger re-render
    if (foundConversation) {
      setConversation({
        ...foundConversation,
        messages: [...(foundConversation.messages || [])]
      });
    } else {
      setConversation(null);
    }
    logger.debug('ConversationScreen - Updated conversation:', !!foundConversation, 'Messages:', foundConversation?.messages?.length || 0);
  }, [conversationId, conversations, currentUser, getConversation]);
  
  const messages = conversation?.messages ? [...conversation.messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  
  const lastCountRef = useRef<number>(0);
  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    lastCountRef.current = messages.length;
  }, [messages.length]);
  
  logger.debug('ConversationScreen - Conversation found:', !!conversation);
  logger.debug('ConversationScreen - Messages count:', messages.length);

  const otherUser = conversation ? users.find(user => 
    conversation.participants.includes(user.id) && user.id !== currentUser?.id
  ) : (conversationId ? users.find(user => user.id === conversationId) : null);
  

  
  // Mark as read when conversation is opened
  useEffect(() => {
    if (conversationId && typeof conversationId === 'string' && conversation && conversation.unreadCount > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, conversation?.unreadCount, markAsRead, conversation?.id]);
  
  // ✅ Proper cleanup for audio and recording
  useEffect(() => {
    return () => {
      // ✅ Cleanup audio playback
      if (sound) {
        sound.stopAsync()
          .then(() => sound.unloadAsync())
          .catch(err => logger.warn('Error cleaning up sound:', err));
      }
      
      // ✅ Cleanup recording if still active
      if (recording) {
        recording.stopAndUnloadAsync()
          .catch(err => logger.warn('Error cleaning up recording:', err));
      }
      
      // ✅ Clear recording timer
      if (recordingTimer) {
        clearTimeout(recordingTimer);
      }
      
      // ✅ Reset audio mode on unmount
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      }).catch(err => logger.warn('Error resetting audio mode on unmount:', err));
    };
  }, [sound, recording, recordingTimer]);
  
  // Early return after all hooks are called
  if (!conversationId || typeof conversationId !== 'string') {
    logger.debug('ConversationScreen - Invalid ID:', conversationId);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {language === 'az' ? 'Söhbət ID-si tapılmadı' : 'ID беседы не найден'}
        </Text>
      </View>
    );
  }

  const sendMessage = async (text: string, type: MessageType = 'text', attachments?: MessageAttachment[]) => {
    logger.debug('sendMessage called with:', { text: text || '[empty]', type, attachments: attachments?.length || 0 });
    
    // Strict validation - don't send empty messages
    const trimmedText = text?.trim() || '';
    if (!trimmedText && (!attachments || attachments.length === 0)) {
      logger.debug('Preventing empty message send - no text and no attachments');
      return;
    }
    
    if (!otherUser || !currentUser) {
      logger.debug('No other user or current user, returning');
      return;
    }

    try {
      // If no conversation exists, create one with a default listing
      let actualConversationId = conversationId;
      let currentConversation = conversation;
      
      if (!currentConversation) {
        logger.debug('Creating new conversation');
        // BUG FIX: Check if listings array is not empty before accessing first element
        if (!listings || listings.length === 0) {
          logger.error('No listings available to create conversation');
          Alert.alert(language === 'az' ? 'Xəta' : 'Ошибка', language === 'az' ? 'Elan tapılmadı' : 'Объявление не найдено');
          return;
        }
        const defaultListing = listings[0]; // Use first listing as default
        actualConversationId = getOrCreateConversation([currentUser.id, otherUser.id], defaultListing.id);
        currentConversation = getConversation(actualConversationId);
        logger.debug('Created conversation with ID:', actualConversationId);
      }
      
      if (!actualConversationId || !currentConversation) {
        logger.debug('Failed to get or create conversation');
        return;
      }

      const newMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // ✅ Use substring()
        senderId: currentUser.id,
        receiverId: otherUser.id,
        listingId: currentConversation.listingId,
        text: trimmedText,
        type,
        attachments,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDelivered: true,
      };

      logger.debug('Adding message:', { id: newMessage.id, text: newMessage.text || '[empty]', type: newMessage.type });
      addMessage(actualConversationId, newMessage);
      
      // Clear input immediately after adding message
      setInputText('');
      
      // Force immediate re-render by updating conversation state
      const updatedConversation = getConversation(actualConversationId);
      if (updatedConversation) {
        logger.debug('Updated conversation with new message, total messages:', updatedConversation.messages.length);
        setConversation({
          ...updatedConversation,
          messages: [...updatedConversation.messages]
        });
      }
      
      // Scroll to bottom with a slight delay to ensure message is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mesaj göndərilə bilmədi' : 'Не удалось отправить сообщение'
      );
    }
  };

  const handleSendMessage = () => {
    const textToSend = inputText.trim();
    logger.debug('handleSendMessage called with text:', textToSend || '[empty]');
    
    if (!textToSend) {
      logger.debug('No text to send, ignoring');
      return;
    }
    
    sendMessage(textToSend);
  };

  const handleTextInputSubmit = () => {
    const textToSend = inputText.trim();
    logger.debug('handleTextInputSubmit called with text:', textToSend || '[empty]');
    
    if (!textToSend) {
      logger.debug('No text to submit, ignoring');
      return;
    }
    
    sendMessage(textToSend);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'az' ? 'İcazə lazımdır' : 'Требуется разрешение',
          language === 'az' ? 'Şəkil seçmək üçün icazə verin' : 'Предоставьте разрешение для выбора изображений'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Send each image as a separate message
        for (const asset of result.assets) {
          const attachment: MessageAttachment = {
            id: Date.now().toString() + Math.random().toString(),
            type: 'image',
            uri: asset.uri,
            name: asset.fileName || 'image.jpg',
            size: asset.fileSize || 0,
            mimeType: 'image/jpeg',
          };
          
          await sendMessage('', 'image', [attachment]);
          // Small delay between messages to ensure proper ordering
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      logger.debug('Image picker error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Şəkil seçilə bilmədi' : 'Не удалось выбрать изображение'
      );
    }
    setShowAttachmentModal(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      // BUG FIX: Check if assets array exists and has elements
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: MessageAttachment = {
          id: Date.now().toString(),
          type: 'file',
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        };
        
        await sendMessage('', 'file', [attachment]);
      }
    } catch (error) {
      logger.debug('Document picker error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Fayl seçilə bilmədi' : 'Не удалось выбрать файл'
      );
    }
    setShowAttachmentModal(false);
  };

  const startRecording = async () => {
    try {
      // ✅ 1. Platform check
      if (Platform.OS === 'web') {
        Alert.alert(
          language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
          language === 'az' ? 'Səs yazma web versiyasında dəstəklənmir' : 'Запись аудио не поддерживается в веб-версии'
        );
        return;
      }
      
      // ✅ 2. Prevent concurrent recordings
      if (recording || isRecording) {
        logger.warn('Recording already in progress');
        return;
      }

      // ✅ 3. Request and verify permission
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          language === 'az' ? 'İcazə lazımdır' : 'Требуется разрешение',
          language === 'az' 
            ? canAskAgain 
              ? 'Səs yazmaq üçün icazə verin' 
              : 'Səs yazma icazəsi rədd edilib. Tənzimləmələrdən icazə verin.'
            : canAskAgain
              ? 'Предоставьте разрешение для записи аудио'
              : 'Разрешение на запись отклонено. Разрешите в настройках.'
        );
        return;
      }

      // ✅ 4. Set audio mode with error handling
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (audioModeError) {
        logger.error('Failed to set audio mode:', audioModeError);
        throw new Error('Audio mode configuration failed');
      }

      // ✅ 5. Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      
      // ✅ 6. Set max duration timer (5 minutes)
      const MAX_DURATION_MS = 5 * 60 * 1000;
      const timer = setTimeout(async () => {
        logger.warn('Max recording duration reached, auto-stopping');
        Alert.alert(
          language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
          language === 'az' 
            ? 'Maksimum qeyd müddəti (5 dəqiqə) bitdi. Səs avtomatik saxlanıldı.' 
            : 'Достигнута максимальная длительность записи (5 минут). Аудио сохранено автоматически.'
        );
        await stopRecording();
      }, MAX_DURATION_MS);
      
      setRecordingTimer(timer);
      
      logger.info('Recording started successfully');
    } catch (error) {
      logger.error('Failed to start recording:', error);
      
      // ✅ Cleanup on error
      setIsRecording(false);
      setRecording(null);
      
      // ✅ Reset audio mode on error
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (resetError) {
        logger.error('Failed to reset audio mode:', resetError);
      }
      
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Səs yazma başladıla bilmədi' : 'Не удалось начать запись'
      );
    }
  };

  const stopRecording = async () => {
    // ✅ Early return with proper validation
    if (!recording || Platform.OS === 'web') {
      // ✅ Clear timer even if recording is null
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      return;
    }

    try {
      setIsRecording(false);
      
      // ✅ Clear max duration timer
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      
      // ✅ Proper cleanup sequence
      await recording.stopAndUnloadAsync();
      
      // ✅ Reset audio mode after recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      const uri = recording.getURI();
      if (uri) {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // ✅ Validate URI
        if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
          logger.error('Invalid audio URI');
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Səs faylı yaratıla bilmədi' : 'Не удалось создать аудио файл'
          );
          return;
        }
        
        // ✅ Get recording status for duration and file size
        const status = await recording.getStatusAsync();
        const durationMs = status.durationMillis || 0;
        const durationSeconds = Math.floor(durationMs / 1000);
        
        // ✅ Validate recording duration
        if (durationSeconds < 1) {
          logger.warn('Recording too short:', durationSeconds);
          Alert.alert(
            language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
            language === 'az' ? 'Səs qeydi çox qısadır (minimum 1 saniyə)' : 'Аудио слишком короткое (минимум 1 секунда)'
          );
          return;
        }
        
        if (durationSeconds > 300) { // 5 minutes max
          logger.warn('Recording too long:', durationSeconds);
          Alert.alert(
            language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
            language === 'az' ? 'Səs qeydi çox uzundur (maksimum 5 dəqiqə)' : 'Аудио слишком длинное (максимум 5 минут)'
          );
          return;
        }
        
        const attachment: MessageAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // ✅ Use substring()
          type: 'audio',
          uri: uri.trim(),
          name: `recording_${Date.now()}.${fileType}`,
          size: 0, // ⚠️ TODO - Get actual file size
          mimeType: `audio/${fileType}`,
          duration: durationSeconds, // ✅ Store duration
        };
        
        await sendMessage('', 'audio', [attachment]);
      }
      
      // BUG FIX: Clear recording reference
      setRecording(null);
    } catch (error) {
      logger.error('Failed to stop recording:', error);
      
      // ✅ Ensure cleanup even on error
      setIsRecording(false);
      setRecording(null);
      
      // ✅ Clear timer on error
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      
      // ✅ Try to reset audio mode even if recording failed
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (audioModeError) {
        logger.error('Failed to reset audio mode:', audioModeError);
      }
      
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Səs yazma dayandırıla bilmədi' : 'Не удалось остановить запись'
      );
    }
  };

  const playAudio = async (uri: string, messageId: string) => {
    // ===== VALIDATION START =====
    
    // ✅ 1. Platform check
    if (Platform.OS === 'web') {
      Alert.alert(
        language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
        language === 'az' ? 'Səs oxutma web versiyasında dəstəklənmir' : 'Воспроизведение аудио не поддерживается в веб-версии'
      );
      return;
    }
    
    // ✅ 2. Validate URI
    if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
      logger.error('Invalid audio URI');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Səs faylı tapılmadı' : 'Аудио файл не найден'
      );
      return;
    }
    
    // ✅ 3. Validate messageId
    if (!messageId || typeof messageId !== 'string') {
      logger.error('Invalid messageId');
      return;
    }
    
    // ===== VALIDATION END =====

    try {
      // ✅ 4. Toggle playback if already playing
      if (playingAudio === messageId) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setPlayingAudio(null);
        setSound(null);
        return;
      }

      // ✅ 5. Stop and cleanup previous sound
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (cleanupError) {
          logger.warn('Error cleaning up previous sound:', cleanupError);
        }
        setSound(null);
      }

      // ✅ 6. Set proper audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // ✅ 7. Create and play sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: uri.trim() },
        { shouldPlay: true },
        (status) => {
          // ✅ Proper cleanup when audio finishes
          if ('didJustFinish' in status && status.didJustFinish) {
            setPlayingAudio(null);
            newSound.unloadAsync().catch(err => 
              logger.warn('Error unloading finished audio:', err)
            );
          }
        }
      );
      
      setSound(newSound);
      setPlayingAudio(messageId);
    } catch (error) {
      logger.error('Error playing audio:', error);
      
      // ✅ Cleanup on error
      setPlayingAudio(null);
      setSound(null);
      
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Səs oxudula bilmədi' : 'Не удалось воспроизвести аудио'
      );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = () => {
    if (selectedMessageId && conversationId) {
      deleteMessage(conversationId, selectedMessageId);
      
      // Update local conversation state
      const updatedConversation = getConversation(conversationId);
      if (updatedConversation) {
        setConversation({
          ...updatedConversation,
          messages: [...updatedConversation.messages]
        });
      }
    }
    setShowDeleteModal(false);
    setSelectedMessageId(null);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUser?.id;
    const sender = users.find(user => user.id === item.senderId);

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
        onLongPress={() => handleDeleteMessage(item.id)}
        activeOpacity={0.7}
      >
        {!isOwnMessage && (
          <Image source={{ uri: sender?.avatar }} style={styles.messageAvatar} />
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {item.attachments?.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentContainer}>
              {attachment.type === 'image' && (
                <TouchableOpacity onPress={() => setSelectedImage(attachment.uri)}>
                  <Image source={{ uri: attachment.uri }} style={styles.imageAttachment} />
                </TouchableOpacity>
              )}
              
              {attachment.type === 'audio' && (
                <TouchableOpacity 
                  style={styles.audioAttachment}
                  onPress={() => playAudio(attachment.uri, item.id)}
                >
                  {playingAudio === item.id ? (
                    <Pause size={20} color={Colors.primary} />
                  ) : (
                    <Play size={20} color={Colors.primary} />
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.audioText}>
                      {language === 'az' ? 'Səs mesajı' : 'Голосовое сообщение'}
                    </Text>
                    {attachment.duration && (
                      <Text style={[styles.audioText, { fontSize: 12, opacity: 0.7 }]}>
                        {Math.floor(attachment.duration / 60)}:{String(attachment.duration % 60).padStart(2, '0')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              
              {attachment.type === 'file' && (
                <TouchableOpacity style={styles.fileAttachment}>
                  <File size={20} color={Colors.primary} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {(attachment.size / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                  <Download size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {item.text ? (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
          ) : null}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            {isOwnMessage && (
              <Text style={styles.messageStatus}>
                {item.isRead ? '✓✓' : item.isDelivered ? '✓' : '○'}
              </Text>
            )}
          </View>
        </View>
        
        {isOwnMessage && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMessage(item.id)}
          >
            <Trash2 size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderContactInfo = () => {
    if (!otherUser) return null;
    
    const hidePhone = otherUser.privacySettings.hidePhoneNumber;
    const onlyAppMessaging = otherUser.privacySettings.onlyAppMessaging;
    
    return (
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>
          {language === 'az' ? 'Əlaqə məlumatları' : 'Контактная информация'}
        </Text>
        
        {hidePhone ? (
          <View>
            <View style={styles.privacyNotice}>
              <EyeOff size={16} color={Colors.textSecondary} />
              <Text style={styles.privacyText}>
                {language === 'az' 
                  ? 'Bu istifadəçi telefon nömrəsini gizlədib' 
                  : 'Этот пользователь скрыл номер телефона'
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.appCallButton}
              onPress={async () => {
                try {
                  const callId = await initiateCall(otherUser.id, conversation?.listingId || '', 'voice');
                  router.push(`/call/${callId}`);
                } catch (error) {
                  logger.error('Failed to initiate call:', error);
                }
              }}
            >
              <Phone size={16} color={Colors.primary} />
              <Text style={styles.appCallButtonText}>
                {language === 'az' ? 'Tətbiq üzərindən zəng et' : 'Позвонить через приложение'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.contactButton}>
            <Phone size={16} color={Colors.primary} />
            <Text style={styles.contactButtonText}>{otherUser.phone}</Text>
          </TouchableOpacity>
        )}
        
        {onlyAppMessaging && (
          <View style={styles.privacyNotice}>
            <MessageSquare size={16} color={Colors.textSecondary} />
            <Text style={styles.privacyText}>
              {language === 'az' 
                ? 'Yalnız tətbiq üzərindən əlaqə' 
                : 'Только связь через приложение'
              }
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!conversation && !otherUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {language === 'az' ? 'Söhbət tapılmadı' : 'Беседа не найдена'}
        </Text>
        <Text style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
          ID: {conversationId}
        </Text>
      </View>
    );
  }

  // If we have a user but no conversation, show a message that conversation will be created when first message is sent
  if (!conversation && otherUser) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: otherUser.name,
            headerStyle: { backgroundColor: Colors.card },
            headerTintColor: Colors.text,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowUserActionModal(true)}
                style={{ padding: 8, marginRight: 8 }}
              >
                <MoreVertical size={24} color={Colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {language === 'az' 
              ? 'İlk mesajınızı göndərərək söhbətə başlayın' 
              : 'Начните беседу, отправив первое сообщение'
            }
          </Text>
        </View>
        
        <ChatInput
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onAttach={() => setShowAttachmentModal(true)}
          onRecord={{
            onPressIn: Platform.OS !== 'web' ? startRecording : undefined,
            onPressOut: Platform.OS !== 'web' ? stopRecording : undefined,
            onPress: Platform.OS === 'web' ? () => {
              Alert.alert(
                language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
                language === 'az' ? 'Səs yazma web versiyasında dəstəklənmir' : 'Запись аудио не поддерживается в веб-версии'
              );
            } : undefined
          }}
          isRecording={isRecording}
          language={language}
        />
        
        {/* Attachment Modal */}
        <Modal
          visible={showAttachmentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAttachmentModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowAttachmentModal(false)}
          >
            <View style={styles.attachmentModal}>
              <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
                <ImageIcon size={24} color={Colors.primary} />
                <Text style={styles.attachmentOptionText}>
                  {language === 'az' ? 'Şəkil' : 'Изображение'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                <File size={24} color={Colors.primary} />
                <Text style={styles.attachmentOptionText}>
                  {language === 'az' ? 'Fayl' : 'Файл'}
                </Text>
              </TouchableOpacity>
              
              {Platform.OS !== 'web' && (
                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    setShowAttachmentModal(false);
                    startRecording();
                  }}
                >
                  <Mic size={24} color={Colors.primary} />
                  <Text style={styles.attachmentOptionText}>
                    {language === 'az' ? 'Səs yazma' : 'Запись голоса'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Modal>
        
        {/* User Action Modal */}
        <UserActionModal
          visible={showUserActionModal}
          onClose={() => setShowUserActionModal(false)}
          user={otherUser}
        />
      </View>
    );
  }

  if (!otherUser) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {language === 'az' ? 'İstifadəçi tapılmadı' : 'Пользователь не найден'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: otherUser.name,
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowUserActionModal(true)}
              style={{ padding: 8, marginRight: 8 }}
            >
              <MoreVertical size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        ListHeaderComponent={renderContactInfo}
        extraData={`${messages.length}-${conversation?.id || 'no-conv'}-${conversation?.messages?.length || 0}`}
        removeClippedSubviews={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ChatInput
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onAttach={() => setShowAttachmentModal(true)}
          onRecord={{
            onPressIn: Platform.OS !== 'web' ? startRecording : undefined,
            onPressOut: Platform.OS !== 'web' ? stopRecording : undefined,
            onPress: Platform.OS === 'web' ? () => {
              Alert.alert(
                language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
                language === 'az' ? 'Səs yazma web versiyasında dəstəklənmir' : 'Запись аудио не поддерживается в веб-версии'
              );
            } : undefined
          }}
          isRecording={isRecording}
          language={language}
        />
      </KeyboardAvoidingView>
      
      {/* Attachment Modal */}
      <Modal
        visible={showAttachmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAttachmentModal(false)}
        >
          <View style={styles.attachmentModal}>
            <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
              <ImageIcon size={24} color={Colors.primary} />
              <Text style={styles.attachmentOptionText}>
                {language === 'az' ? 'Şəkil' : 'Изображение'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
              <File size={24} color={Colors.primary} />
              <Text style={styles.attachmentOptionText}>
                {language === 'az' ? 'Fayl' : 'Файл'}
              </Text>
            </TouchableOpacity>
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.attachmentOption} 
                onPress={() => {
                  setShowAttachmentModal(false);
                  startRecording();
                }}
              >
                <Mic size={24} color={Colors.primary} />
                <Text style={styles.attachmentOptionText}>
                  {language === 'az' ? 'Səs yazma' : 'Запись голоса'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
      
      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable 
          style={styles.imageModalOverlay}
          onPress={() => setSelectedImage(null)}
        >
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          )}
        </Pressable>
      </Modal>
      
      {/* Delete Message Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>
              {language === 'az' ? 'Mesajı sil' : 'Удалить сообщение'}
            </Text>
            <Text style={styles.deleteModalText}>
              {language === 'az' 
                ? 'Bu mesajı silmək istədiyinizə əminsinizmi?' 
                : 'Вы уверены, что хотите удалить это сообщение?'
              }
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'az' ? 'Ləğv et' : 'Отмена'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton]}
                onPress={confirmDeleteMessage}
              >
                <Text style={styles.confirmButtonText}>
                  {language === 'az' ? 'Sil' : 'Удалить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      
      {/* User Action Modal */}
      <UserActionModal
        visible={showUserActionModal}
        onClose={() => setShowUserActionModal(false)}
        user={otherUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  contactInfo: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  appCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  appCallButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: Colors.textSecondary,
  },
  messageStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  imageAttachment: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  audioAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  audioText: {
    marginLeft: 8,
    color: Colors.primary,
    fontWeight: '500',
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  fileSize: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  attachmentModal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 12,
  },
  attachmentOptionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'contain',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  deleteModal: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: '#ff4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
