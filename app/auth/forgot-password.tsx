import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import Colors from '@/constants/colors';
import { X, ArrowLeft, Mail, CheckCircle, Phone, User } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { logger } from '@/utils/logger';
import { validateEmail } from '@/utils/inputValidation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  
  const [contactInfo, setContactInfo] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  
  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();
  
  const detectContactType = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,}$/;
    
    if (emailRegex.test(input)) {
      return 'email';
    } else if (phoneRegex.test(input.replace(/\s/g, ''))) {
      return 'phone';
    }
    
    // Default detection based on presence of @ symbol
    return input.includes('@') ? 'email' : 'phone';
  };
  
  const handleContactInfoChange = (text: string) => {
    setContactInfo(text);
  };
  
  const handlePhoneChange = (text: string) => {
    // Remove any non-digit characters except spaces and dashes
    const cleaned = text.replace(/[^0-9\s\-]/g, '');
    setPhoneNumber(cleaned);
    setContactInfo('+994 ' + cleaned);
    setContactType('phone');
  };
  
  const handleSendResetCode = async () => {
    // ===== VALIDATION START =====
    
    // 1. Contact info required
    if (!contactInfo || typeof contactInfo !== 'string' || contactInfo.trim().length === 0) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        contactType === 'email' 
          ? (language === 'az' ? 'E-poçt ünvanını daxil edin' : 'Введите адрес электронной почты')
          : (language === 'az' ? 'Mobil nömrəni daxil edin' : 'Введите номер телефона')
      );
      return;
    }
    
    // 2. Auto-detect contact type
    const detectedType = detectContactType(contactInfo.trim());
    setContactType(detectedType);
    
    // 3. Validate based on detected type
    if (detectedType === 'email') {
<<<<<<< HEAD
      // ✅ Use centralized validation
      if (!validateEmail(contactInfo)) {
=======
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const trimmedEmail = contactInfo.trim();
      
      if (!emailRegex.test(trimmedEmail)) {
>>>>>>> origin/main
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Düzgün e-poçt ünvanı daxil edin' : 'Введите правильный адрес электронной почты'
        );
        return;
      }
<<<<<<< HEAD
    } else {
      // ✅ Phone reset not implemented yet - show message
      Alert.alert(
        language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
        language === 'az' 
          ? 'Telefon vasitəsilə şifrə bərpası hələ aktiv deyil. Zəhmət olmasa e-poçt istifadə edin.'
          : 'Восстановление пароля через телефон пока не активно. Пожалуйста, используйте email.'
      );
      return;
=======
      
      if (trimmedEmail.length > 255) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Email çox uzundur' : 'Email слишком длинный'
        );
        return;
      }
    } else {
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      const cleanedPhone = contactInfo.replace(/[\s\-\(\)]/g, '');
      
      if (!phoneRegex.test(cleanedPhone)) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Düzgün mobil nömrə daxil edin (10-15 rəqəm)' : 'Введите правильный номер телефона (10-15 цифр)'
        );
        return;
      }
      
      if (cleanedPhone.length < 10) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Telefon nömrəsi çox qısadır' : 'Номер телефона слишком короткий'
        );
        return;
      }
>>>>>>> origin/main
    }
    
    // ===== VALIDATION END =====
    
    setIsLoading(true);
    
    try {
<<<<<<< HEAD
      // ✅ Use real backend API
      await forgotPasswordMutation.mutateAsync({
        email: contactInfo.trim().toLowerCase(),
      });
      
      logger.info('Password reset email sent to:', contactInfo);
      setIsCodeSent(true);
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        error?.message || (language === 'az' 
          ? 'Şifrə sıfırlama linki göndərilə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
          : 'Не удалось отправить ссылку для сброса пароля. Пожалуйста, попробуйте снова.')
      );
    } finally {
      setIsLoading(false);
=======
      // TODO: Real API call
      // await authService.sendPasswordResetCode(contactInfo.trim(), detectedType);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsLoading(false);
      setIsCodeSent(true);
    } catch (error) {
      logger.error('Password reset error:', error);
      setIsLoading(false);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Kod göndərilərkən xəta baş verdi. Yenidən cəhd edin.'
          : 'Ошибка при отправке кода. Попробуйте снова.'
      );
>>>>>>> origin/main
    }
  };
  
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  
  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  
  const handleResendCode = async () => {
    setIsCodeSent(false);
    await handleSendResetCode();
  };
  
  if (isCodeSent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.successIconContainer}>
            <CheckCircle size={80} color={Colors.success} />
          </View>
          
          <Text style={styles.successTitle}>
            {contactType === 'email'
              ? (language === 'az' ? 'E-poçt göndərildi!' : 'Письмо отправлено!')
              : (language === 'az' ? 'SMS göndərildi!' : 'SMS отправлено!')
            }
          </Text>
          
          <Text style={styles.successMessage}>
            {contactType === 'email'
              ? (language === 'az' 
                  ? `Şifrəni bərpa etmək üçün təlimatları ${contactInfo} ünvanına göndərdik.`
                  : `Мы отправили инструкции по восстановлению пароля на ${contactInfo}.`)
              : (language === 'az'
                  ? `Şifrəni bərpa etmək üçün kod ${contactInfo} nömrəsinə göndərildi.`
                  : `Код для восстановления пароля отправлен на ${contactInfo}.`)
            }
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToLogin}>
            <Text style={styles.primaryButtonText}>
              {language === 'az' ? 'Girişə qayıt' : 'Вернуться к входу'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleResendCode}>
            <Text style={styles.secondaryButtonText}>
              {language === 'az' ? 'Yenidən göndər' : 'Отправить снова'}
            </Text>
          </TouchableOpacity>
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleClose}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <User size={60} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>
            {language === 'az' ? 'Şifrəni unutmusunuz?' : 'Забыли пароль?'}
          </Text>
          
          <Text style={styles.subtitle}>
            {language === 'az' 
              ? 'Şifrəniz qeydiyyat zamanı yazdığınız e-poçt və ya nömrənizə göndəriləcək'
              : 'Ваш пароль будет отправлен на email или номер, указанный при регистрации'
            }
          </Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, contactType === 'email' && styles.activeTab]}
                  onPress={() => {
                    setContactType('email');
                    setContactInfo('');
                    setPhoneNumber('');
                  }}
                >
                  <Mail size={16} color={contactType === 'email' ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.tabText, contactType === 'email' && styles.activeTabText]}>
                    {language === 'az' ? 'E-poçt' : 'Email'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tab, contactType === 'phone' && styles.activeTab]}
                  onPress={() => {
                    setContactType('phone');
                    setContactInfo('+994 ');
                    setPhoneNumber('');
                  }}
                >
                  <Phone size={16} color={contactType === 'phone' ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.tabText, contactType === 'phone' && styles.activeTabText]}>
                    {language === 'az' ? 'Telefon' : 'Телефон'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                {contactType === 'email' ? (
                  <View style={styles.inputWithIcon}>
                    <View style={styles.iconWrapper}>
                      <Mail size={20} color={Colors.textSecondary} />
                    </View>
                    <TextInput
                      style={styles.inputField}
                      value={contactInfo}
                      onChangeText={handleContactInfoChange}
                      placeholder={language === 'az' ? 'E-poçt ünvanınız' : 'Ваш email адрес'}
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                ) : (
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCodeContainer}>
                      <Phone size={20} color={Colors.textSecondary} />
                      <Text style={styles.countryCode}>+994</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInputField}
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      placeholder={language === 'az' ? 'XX XXX XX XX' : 'XX XXX XX XX'}
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="phone-pad"
                      maxLength={12}
                      editable={!isLoading}
                    />
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.primaryButton,
                (!contactInfo || isLoading) && styles.disabledButton
              ]} 
              onPress={handleSendResetCode}
              disabled={!contactInfo || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {language === 'az' ? 'Şifrə sıfırlama linki göndər' : 'Отправить ссылку для сброса'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
              <Text style={styles.secondaryButtonText}>
                {language === 'az' ? 'Girişə qayıt' : 'Вернуться к входу'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  successIconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  iconWrapper: {
    marginRight: 12,
    padding: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  phoneInputField: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});