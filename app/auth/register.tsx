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
< cursor/fix-many-bugs-and-errors-4e56
    } catch (error: any) {
      authLogger.error('Registration failed', error);
   } catch (error: unknown) {
      logger.error('[Register] Error:', error);
> Araz
      Alert.alert(
        t('error') || 'Xəta',
        error instanceof Error ? error.message : 'Qeydiyyat zamanı xəta baş verdi'
      );
    } finally {
      setIsLoading(false);
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

  const handleSocialRegister = async (provider: 'google' | 'facebook' | 'vk') => {
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
              phone: '',
              avatar: (result.user.avatar as string) || '',
              rating: 0,
              totalRatings: 0,
              memberSince: new Date().toISOString(),
              location: { az: '', ru: '', en: '' },
              balance: 0,
              role: 'user',
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
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('galleryPermissionRequired')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
< cursor/fix-many-bugs-and-errors-4e56
      authLogger.error('Image picker failed', error);
=======
      logger.error('Image picker error:', error);
> Araz
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
< cursor/fix-many-bugs-and-errors-4e56
      authLogger.error('Camera failed', error);
    logger.error('Camera error:', error);
> Araz
      Alert.alert(
        t('error'),
        language === 'az' ? 'Şəkil çəkilə bilmədi' : 'Не удалось сделать фото'
      );
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      t('selectProfilePhoto'),
      t('howToAddPhoto'),
      [
        {
          text: t('gallery'),
          onPress: pickImage,
        },
        {
          text: t('camera'),
          onPress: takePhoto,
        },
        {
          text: t('cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=200' }} 
            style={styles.logo} 
          />
        </View>
        
        <Text style={styles.title}>
          {t('register')}
        </Text>
        
        <View style={styles.form}>
          <View style={styles.profileImageSection}>
            <Text style={styles.label}>
              {t('profilePhoto')}
            </Text>
            <TouchableOpacity style={styles.profileImageContainer} onPress={showImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <UserIcon size={40} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Camera size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageHint}>
              {t('tapToAddPhoto')}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('fullName')}
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('yourFullName')}
              placeholderTextColor={Colors.placeholder}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('email')}
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('emailAddress')}
              placeholderTextColor={Colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('phone')}
            </Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <Phone size={20} color={Colors.textSecondary} />
                <Text style={styles.countryCode}>+994</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone.replace('+994 ', '')}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9\s\-]/g, '');
                  setPhone('+994 ' + cleaned);
                }}
                placeholder="XX XXX XX XX"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('password')}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder={t('yourPassword')}
                placeholderTextColor={Colors.placeholder}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('confirmPassword')}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('repeatPassword')}
                placeholderTextColor={Colors.placeholder}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[
                styles.checkbox,
                agreeToTerms && styles.checkedCheckbox
              ]}>
                {agreeToTerms && <Check size={16} color="white" />}
              </View>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              {t('agreeToTermsAndPrivacy')}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.registerButton,
              (!isFormValid || isLoading) && styles.disabledButton
            ]} 
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>
                {t('register')}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {t('or')}
            </Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleSocialRegister('google')}
              disabled={loadingSocial !== null}
            >
              {loadingSocial === 'google' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Chrome size={24} color="white" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialRegister('facebook')}
              disabled={loadingSocial !== null}
            >
              {loadingSocial === 'facebook' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Facebook size={24} color="white" />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, styles.vkButton]}
              onPress={() => handleSocialRegister('vk')}
              disabled={loadingSocial !== null}
            >
              {loadingSocial === 'vk' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MessageCircle size={24} color="white" />
                  <Text style={styles.socialButtonText}>VK</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('haveAccount')}
          </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>
              {t('loginNow')}
            </Text>
          </TouchableOpacity>
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
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkboxContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  loginText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  profileImageHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
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
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 16,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  vkButton: {
    backgroundColor: '#0077FF',
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
});
