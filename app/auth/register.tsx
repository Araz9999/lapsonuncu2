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
  const { t, language } = useTranslation();
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

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
