import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { useUserStore } from '@/store/userStore';
import { useLanguageStore } from '@/store/languageStore';
import Colors from '@/constants/colors';
import { X, Eye, EyeOff, Check, Phone, Camera, User as UserIcon, Facebook, Chrome, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';
import { initiateSocialLogin, showSocialLoginError } from '@/utils/socialAuth';
import { logger } from '@/utils/logger';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useUserStore();
  const { language } = useLanguageStore();
  
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
  
  const isFormValid = name && email && phone && password && confirmPassword && password === confirmPassword && agreeToTerms;
  
  const handleRegister = async () => {
    if (!isFormValid || isLoading) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await registerMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        phone: phone.trim(),
      });
      
      const mockUser = {
        ...result.user,
        phone: result.user.phone || '',
        avatar: result.user.avatar || '',
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
          'Qeydiyyat uğurla tamamlandı! Email ünvanınıza təsdiq linki göndərildi. Zəhmət olmasa email-inizi yoxlayın.',
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
          'Xəbərdarlıq',
          'Qeydiyyat uğurlu oldu, lakin email göndərilmədi. Daha sonra email təsdiqini tamamlaya bilərsiniz.',
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
      logger.error('Image picker error:', error);
      Alert.alert(
        t('error'),
        language === 'az' ? 'Şəkil seçilə bilmədi' : 'Не удалось выбрать изображение'
      );
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          t('error'),
          language === 'az' ? 'Kamera veb versiyada dəstəklənmir' : 'Камера не поддерживается в веб-версии'
        );
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('cameraPermissionRequired')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // BUG FIX: Check if assets array exists and has elements
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
