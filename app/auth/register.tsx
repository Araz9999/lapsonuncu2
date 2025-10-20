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
  const { t } = useTranslation();
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired') || (language === 'az' ? 'İcazə lazımdır' : 'Требуется разрешение'),
          language === 'az' ? 'Şəkil seçmək üçün icazə lazımdır' : 'Требуется разрешение для выбора изображения'
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
        // ✅ Validate image file size (max 5MB)
        const uri = result.assets[0].uri;
        if (result.assets[0].fileSize && result.assets[0].fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Şəkil çox böyükdür (max 5MB)' : 'Изображение слишком большое (макс 5МБ)'
          );
          return;
        }
        setProfileImage(uri);
      }
    } catch (error) {
      logger.error('Image picker error:', error);
      Alert.alert(
        t('error') || (language === 'az' ? 'Xəta' : 'Ошибка'),
        language === 'az' ? 'Şəkil seçilə bilmədi' : 'Не удалось выбрать изображение'
      );
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
<<<<<<< HEAD
        t('error') || (language === 'az' ? 'Xəta' : 'Ошибка'),
        language === 'az' ? 'Foto çəkilə bilmədi' : 'Не удалось сделать фото'
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
  
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'vk') => {
    logger.info('[Register] Social login initiated:', { provider });
    setLoadingSocial(provider);
    
    try {
      // ✅ Check if provider is configured
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
=======

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'vk') => {
    try {
      setLoadingSocial(provider);
      
      const baseUrl = 'https://1r36dhx42va8pxqbqz5ja.rork.app';
>>>>>>> origin/main
      const statusResponse = await fetch(`${baseUrl}/api/auth/status`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (!statusData.configured[provider]) {
          setLoadingSocial(null);
<<<<<<< HEAD
          logger.warn('[Register] Provider not configured:', { provider });
=======
>>>>>>> origin/main
          showSocialLoginError(provider, `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet. Please contact support.`);
          return;
        }
      }
      
      await initiateSocialLogin(
        provider,
        (result) => {
          setLoadingSocial(null);
          if (result.success && result.user) {
<<<<<<< HEAD
            logger.info(`[Register] Social login successful (${provider}):`, { 
              userId: result.user.id,
              email: result.user.email
            });
            
            // ✅ Create complete user object
            const userObject = {
              id: result.user.id as string,
              name: result.user.name as string,
              email: result.user.email as string,
              phone: '',
              avatar: result.user.avatar as string || '',
              verified: true,
=======
            login({
              id: result.user.id as string,
              name: result.user.name as string,
              email: result.user.email as string,
              avatar: result.user.avatar as string,
              phone: '',
>>>>>>> origin/main
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
<<<<<<< HEAD
            };
            
            login(userObject);
=======
            });
>>>>>>> origin/main
            router.replace('/(tabs)');
          }
        },
        (error) => {
          setLoadingSocial(null);
<<<<<<< HEAD
          logger.error(`[Register] Social login error (${provider}):`, error);
=======
>>>>>>> origin/main
          showSocialLoginError(provider, error);
        }
      );
    } catch (error) {
      setLoadingSocial(null);
<<<<<<< HEAD
      logger.error(`[Register] Social login initiation error (${provider}):`, error);
      showSocialLoginError(provider, 'Failed to initiate login. Please try again.');
=======
      showSocialLoginError(provider, 'Failed to initiate registration. Please try again.');
    } finally {
      setIsLoading(false);
>>>>>>> origin/main
    }
  };

  return (
<<<<<<< HEAD
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{language === 'az' ? 'Qeydiyyat' : 'Регистрация'}</Text>
          <Text style={styles.subtitle}>
            {language === 'az' ? 'Hesab yaradın' : 'Создайте аккаунт'}
          </Text>
        </View>

        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <UserIcon size={40} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{language === 'az' ? 'Ad Soyad' : 'Имя Фамилия'}</Text>
          <View style={styles.inputWrapper}>
            <UserIcon size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={language === 'az' ? 'Ad və soyadınızı daxil edin' : 'Введите имя и фамилию'}
              placeholderTextColor={Colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={100}
            />
          </View>
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder={language === 'az' ? 'Email daxil edin' : 'Введите email'}
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{language === 'az' ? 'Telefon' : 'Телефон'}</Text>
          <View style={styles.inputWrapper}>
            <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+994 XX XXX XX XX"
              placeholderTextColor={Colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{language === 'az' ? 'Şifrə' : 'Пароль'}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={language === 'az' ? 'Şifrə daxil edin (min 8 simvol)' : 'Введите пароль (мин 8 символов)'}
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye size={20} color={Colors.textSecondary} />
              ) : (
                <EyeOff size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{language === 'az' ? 'Şifrəni təsdiqləyin' : 'Подтвердите пароль'}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={language === 'az' ? 'Şifrəni yenidən daxil edin' : 'Введите пароль еще раз'}
              placeholderTextColor={Colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye size={20} color={Colors.textSecondary} />
              ) : (
                <EyeOff size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAgreeToTerms(!agreeToTerms)}
        >
          <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
            {agreeToTerms && <Check size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxText}>
            {language === 'az' 
              ? 'İstifadə şərtləri və məxfilik siyasətini qəbul edirəm'
              : 'Я принимаю условия использования и политику конфиденциальности'}
          </Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity 
          style={[styles.registerButton, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>
              {language === 'az' ? 'Qeydiyyatdan keç' : 'Зарегистрироваться'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{language === 'az' ? 'və ya' : 'или'}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
            disabled={loadingSocial !== null}
          >
            {loadingSocial === 'google' ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Chrome size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('facebook')}
            disabled={loadingSocial !== null}
          >
            {loadingSocial === 'facebook' ? (
              <ActivityIndicator size="small" color="#1877F2" />
            ) : (
              <Facebook size={24} color="#1877F2" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('vk')}
            disabled={loadingSocial !== null}
          >
            {loadingSocial === 'vk' ? (
              <ActivityIndicator size="small" color="#0077FF" />
            ) : (
              <MessageCircle size={24} color="#0077FF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            {language === 'az' ? 'Artıq hesabınız var?' : 'Уже есть аккаунт?'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>
              {language === 'az' ? 'Daxil ol' : 'Войти'}
            </Text>
          </TouchableOpacity>
        </View>
=======
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
>>>>>>> origin/main
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
<<<<<<< HEAD

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 45,
    fontSize: 16,
    color: Colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
=======
>>>>>>> origin/main
