import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { X, Eye, EyeOff, Check, Phone, Camera, User as UserIcon, Facebook, Chrome, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';
import { initiateSocialLogin, showSocialLoginError } from '@/utils/socialAuth';
import { logger } from '@/utils/logger';
import { validateEmail, validateAzerbaijanPhone, sanitizeTextInput } from '@/utils/inputValidation';

export default function RegisterScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { login } = useUserStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+994 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState<string | null>(null);
  
  const registerMutation = trpc.auth.register.useMutation();
  
  // ✅ Enhanced form validation
  const validateForm = (): { isValid: boolean; error?: string } => {
    if (!name || !name.trim()) {
      return { isValid: false, error: language === 'az' ? 'Ad daxil edin' : 'Введите имя' };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: language === 'az' ? 'Ad ən az 2 simvol olmalıdır' : 'Имя должно содержать минимум 2 символа' };
    }
    
    if (!email || !email.trim()) {
      return { isValid: false, error: language === 'az' ? 'Email daxil edin' : 'Введите email' };
    }
    
    if (!validateEmail(email)) {
      return { isValid: false, error: language === 'az' ? 'Düzgün email daxil edin' : 'Введите корректный email' };
    }
    
    if (!phone || phone.trim() === '+994' || phone.trim() === '+994 ') {
      return { isValid: false, error: language === 'az' ? 'Telefon nömrəsi daxil edin' : 'Введите номер телефона' };
    }
    
    if (!validateAzerbaijanPhone(phone)) {
      return { isValid: false, error: language === 'az' ? 'Düzgün telefon nömrəsi daxil edin' : 'Введите корректный номер телефона' };
    }
    
    if (!password) {
      return { isValid: false, error: language === 'az' ? 'Şifrə daxil edin' : 'Введите пароль' };
    }
    
    // ✅ Match backend password requirements (8 chars, uppercase, lowercase, number)
    if (password.length < 8) {
      return { isValid: false, error: language === 'az' ? 'Şifrə ən az 8 simvol olmalıdır' : 'Пароль должен содержать минимум 8 символов' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: language === 'az' ? 'Şifrə ən azı 1 böyük hərf olmalıdır' : 'Пароль должен содержать минимум 1 заглавную букву' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: language === 'az' ? 'Şifrə ən azı 1 kiçik hərf olmalıdır' : 'Пароль должен содержать минимум 1 строчную букву' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: language === 'az' ? 'Şifrə ən azı 1 rəqəm olmalıdır' : 'Пароль должен содержать минимум 1 цифру' };
    }
    
    if (!confirmPassword) {
      return { isValid: false, error: language === 'az' ? 'Şifrəni təsdiqləyin' : 'Подтвердите пароль' };
    }
    
    if (password !== confirmPassword) {
      return { isValid: false, error: language === 'az' ? 'Şifrələr uyğun gəlmir' : 'Пароли не совпадают' };
    }
    
    if (!agreeToTerms) {
      return { isValid: false, error: language === 'az' ? 'İstifadə şərtlərini qəbul edin' : 'Примите условия использования' };
    }
    
    return { isValid: true };
  };
  
  const handleRegister = async () => {
    if (isLoading) {
      return;
    }
    
    // ✅ Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        validation.error || 'Form düzgün doldurulmayıb'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await registerMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
        name: sanitizeTextInput(name.trim(), 100),
        phone: phone.trim(),
      });
      
      // ✅ Create complete user object
      const mockUser = {
        ...result.user,
        phone: result.user.phone || '',
        avatar: profileImage || result.user.avatar || '',
        rating: 0,
        totalRatings: 0,
        memberSince: new Date().toISOString(),
        location: { az: '', ru: '', en: '' },
        privacySettings: {
          hidePhoneNumber: false,
          allowDirectContact: true,
          onlyAppMessaging: false,
        },
        analytics: {
          lastOnline: new Date().toISOString(),
          messageResponseRate: 0,
          averageResponseTime: 0,
          totalMessages: 0,
          totalResponses: 0,
          isOnline: true,
        },
      };
      
      if (result.emailSent) {
        Alert.alert(
          t('success') || 'Uğurlu',
          language === 'az' 
            ? 'Qeydiyyat uğurla tamamlandı! Email ünvanınıza təsdiq linki göndərildi. Zəhmət olmasa email-inizi yoxlayın.'
            : 'Регистрация успешно завершена! Ссылка для подтверждения отправлена на ваш email. Пожалуйста, проверьте почту.',
          [
            {
              text: 'OK',
              onPress: () => {
                login(mockUser);
                router.replace('/');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          language === 'az' ? 'Xəbərdarlıq' : 'Предупреждение',
          language === 'az'
            ? 'Qeydiyyat uğurlu oldu, lakin email göndərilmədi. Daha sonra email təsdiqini tamamlaya bilərsiniz.'
            : 'Регистрация прошла успешно, но письмо не было отправлено. Вы сможете завершить подтверждение email позже.',
          [
            {
              text: 'OK',
              onPress: () => {
                login(mockUser);
                router.replace('/');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      logger.error('Registration error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        error?.message || (language === 'az' ? 'Qeydiyyat zamanı xəta baş verdi' : 'Ошибка при регистрации')
      );
    } finally {
      setIsLoading(false);
    }
  };


  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          t('error') || (language === 'az' ? 'Xəta' : 'Ошибка'),
          language === 'az' ? 'Kamera veb versiyada dəstəklənmir' : 'Камера не поддерживается в веб-версии'
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired') || (language === 'az' ? 'İcazə lazımdır' : 'Требуется разрешение'),
          t('cameraPermissionRequired') || (language === 'az' ? 'Kamera icazəsi lazımdır' : 'Требуется разрешение камеры')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Camera error:', error);
      Alert.alert(
        t('error'),
        language === 'az' ? 'Kamera açıla bilmədi' : 'Не удалось открыть камеру'
      );
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          language === 'az' ? 'Qalereya icazəsi tələb olunur' : 'Требуется разрешение галереи'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Image picker error:', error);
      Alert.alert(
        t('error'),
        language === 'az' ? 'Şəkil seçilə bilmədi' : 'Не удалось выбрать изображение'
      );
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'vk') => {
    try {
      setLoadingSocial(provider);
      
      const baseUrl = 'https://1r36dhx42va8pxqbqz5ja.rork.app';
      const statusResponse = await fetch(`${baseUrl}/api/auth/status`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (!statusData.configured[provider]) {
          setLoadingSocial(null);
          showSocialLoginError(provider, `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet. Please contact support.`);
          return;
        }
      }
      
      await initiateSocialLogin(
        provider,
        (result) => {
          setLoadingSocial(null);
          if (result.success && result.user) {
            login({
              id: result.user.id as string,
              name: result.user.name as string,
              email: result.user.email as string,
              avatar: result.user.avatar as string,
              phone: '',
              rating: 0,
              totalRatings: 0,
              memberSince: new Date().toISOString(),
              location: { az: '', ru: '', en: '' },
              privacySettings: {
                hidePhoneNumber: false,
                allowDirectContact: true,
                onlyAppMessaging: false,
              },
              analytics: {
                lastOnline: new Date().toISOString(),
                messageResponseRate: 0,
                averageResponseTime: 0,
                totalMessages: 0,
                totalResponses: 0,
                isOnline: true,
              },
              balance: 0,
              role: 'user'
            });
            router.replace('/(tabs)');
          }
        },
        (error) => {
          setLoadingSocial(null);
          showSocialLoginError(provider, error);
        }
      );
    } catch (error) {
      setLoadingSocial(null);
      showSocialLoginError(provider, 'Failed to initiate registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text>Register Screen - TODO: Complete UI</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: (Colors && (Colors.background || Colors.white)) || '#ffffff',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors && Colors.primary ? Colors.primary : '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
