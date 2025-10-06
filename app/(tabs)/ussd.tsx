import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from '@/constants/translations';
import { useUSSDStore } from '@/store/ussdStore';
import { ussdService } from '@/services/ussdService';
import Colors from '@/constants/colors';
import { Phone, Send, X } from 'lucide-react-native';

export default function USSDScreen() {
  const { language } = useTranslation();
  const { currentSession, startSession, endSession, addMessage, updateMenuPath } = useUSSDStore();
  
  const [ussdCode, setUssdCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (currentSession && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentSession, currentSession?.history.length]);

  const handleStartSession = async () => {
    if (!ussdCode.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : language === 'ru' ? 'Ошибка' : 'Error',
        language === 'az' 
          ? 'USSD kodu daxil edin' 
          : language === 'ru'
          ? 'Введите USSD код'
          : 'Enter USSD code'
      );
      return;
    }

    setIsLoading(true);
    console.log('[USSD Screen] Starting session with code:', ussdCode);

    try {
      startSession(ussdCode);
      
      addMessage({
        type: 'request',
        text: ussdCode,
      });

      const response = await ussdService.processUSSDCode(ussdCode, language);
      console.log('[USSD Screen] Initial response:', response);

      addMessage({
        type: 'response',
        text: response.text,
        menuId: response.menuId,
      });

      if (response.isEnd) {
        setTimeout(() => {
          endSession();
          ussdService.reset();
        }, 3000);
      }

      setUssdCode('');
    } catch (error) {
      console.error('[USSD Screen] Error starting session:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : language === 'ru' ? 'Ошибка' : 'Error',
        language === 'az' 
          ? 'USSD sessiyası başladıla bilmədi' 
          : language === 'ru'
          ? 'Не удалось начать USSD сессию'
          : 'Failed to start USSD session'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInput = async () => {
    if (!userInput.trim() || !currentSession) return;

    setIsLoading(true);
    console.log('[USSD Screen] Sending input:', userInput, 'Current path:', currentSession.currentMenuPath);

    try {
      addMessage({
        type: 'request',
        text: userInput,
      });

      const response = await ussdService.processUSSDInput(
        userInput,
        currentSession.currentMenuPath,
        language
      );
      console.log('[USSD Screen] Response:', response);

      addMessage({
        type: 'response',
        text: response.text,
        menuId: response.menuId,
      });

      if (response.menuId) {
        const newPath = userInput === '0' 
          ? currentSession.currentMenuPath.slice(0, -1)
          : [...currentSession.currentMenuPath, response.menuId];
        updateMenuPath(newPath);
      }

      if (response.isEnd) {
        setTimeout(() => {
          endSession();
          ussdService.reset();
        }, 3000);
      }

      setUserInput('');
    } catch (error) {
      console.error('[USSD Screen] Error sending input:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : language === 'ru' ? 'Ошибка' : 'Error',
        language === 'az' 
          ? 'Cavab alına bilmədi' 
          : language === 'ru'
          ? 'Не удалось получить ответ'
          : 'Failed to get response'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      language === 'az' ? 'Sessiyanı bitir' : language === 'ru' ? 'Завершить сессию' : 'End Session',
      language === 'az' 
        ? 'USSD sessiyasını bitirmək istədiyinizə əminsiniz?' 
        : language === 'ru'
        ? 'Вы уверены, что хотите завершить USSD сессию?'
        : 'Are you sure you want to end the USSD session?',
      [
        {
          text: language === 'az' ? 'Ləğv et' : language === 'ru' ? 'Отмена' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'az' ? 'Bitir' : language === 'ru' ? 'Завершить' : 'End',
          style: 'destructive',
          onPress: () => {
            endSession();
            ussdService.reset();
          },
        },
      ]
    );
  };

  const handleQuickCode = (code: string) => {
    setUssdCode(code);
  };

  const quickCodes = [
    { code: '*100#', label: { az: 'Balans', ru: 'Баланс', en: 'Balance' } },
    { code: '*123#', label: { az: 'Xidmətlər', ru: 'Услуги', en: 'Services' } },
    { code: '*555#', label: { az: 'Menyu', ru: 'Меню', en: 'Menu' } },
  ];

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Phone size={48} color={Colors.primary} />
          <Text style={styles.headerTitle}>
            {language === 'az' ? 'USSD Simulyatoru' : language === 'ru' ? 'USSD Симулятор' : 'USSD Simulator'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'az' 
              ? 'USSD kodunu daxil edin və ya sürətli kodlardan birini seçin' 
              : language === 'ru'
              ? 'Введите USSD код или выберите один из быстрых кодов'
              : 'Enter USSD code or select a quick code'}
          </Text>
        </View>

        <View style={styles.quickCodesContainer}>
          <Text style={styles.quickCodesTitle}>
            {language === 'az' ? 'Sürətli kodlar' : language === 'ru' ? 'Быстрые коды' : 'Quick codes'}
          </Text>
          <View style={styles.quickCodesGrid}>
            {quickCodes.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.quickCodeButton}
                onPress={() => handleQuickCode(item.code)}
              >
                <Text style={styles.quickCodeText}>{item.code}</Text>
                <Text style={styles.quickCodeLabel}>{item.label[language]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            value={ussdCode}
            onChangeText={setUssdCode}
            placeholder={language === 'az' ? '*123#' : language === 'ru' ? '*123#' : '*123#'}
            placeholderTextColor={Colors.placeholder}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.dialButton, isLoading && styles.dialButtonDisabled]}
            onPress={handleStartSession}
            disabled={isLoading}
          >
            <Phone size={24} color="white" />
            <Text style={styles.dialButtonText}>
              {language === 'az' ? 'Zəng et' : language === 'ru' ? 'Позвонить' : 'Dial'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {language === 'az' 
              ? 'USSD kodları * və # simvolları ilə başlayır və bitir. Məsələn: *100#' 
              : language === 'ru'
              ? 'USSD коды начинаются и заканчиваются символами * и #. Например: *100#'
              : 'USSD codes start and end with * and # symbols. For example: *100#'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <View style={styles.sessionIndicator} />
          <Text style={styles.sessionHeaderText}>
            {language === 'az' ? 'Aktiv sessiya' : language === 'ru' ? 'Активная сессия' : 'Active session'}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <X size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {currentSession.history.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.type === 'request' ? styles.requestBubble : styles.responseBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.type === 'request' ? styles.requestText : styles.responseText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.messageTime,
                message.type === 'request' ? styles.requestTime : styles.responseTime,
              ]}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.messageInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={language === 'az' ? 'Cavab daxil edin...' : language === 'ru' ? 'Введите ответ...' : 'Enter response...'}
          placeholderTextColor={Colors.placeholder}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!userInput.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSendInput}
          disabled={!userInput.trim() || isLoading}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickCodesContainer: {
    padding: 16,
  },
  quickCodesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickCodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCodeButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  quickCodeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputContainer: {
    padding: 16,
    gap: 12,
  },
  codeInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  dialButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dialButtonDisabled: {
    opacity: 0.5,
  },
  dialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: 'rgba(14, 116, 144, 0.05)',
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sessionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  endButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  requestBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  responseBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  requestText: {
    color: 'white',
  },
  responseText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  requestTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  responseTime: {
    color: Colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
