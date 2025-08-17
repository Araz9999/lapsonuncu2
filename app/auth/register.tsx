import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { users } from '@/mocks/users';
import Colors from '@/constants/colors';
import { X, Eye, EyeOff, Check, Mail, Phone, Camera, User, Facebook, Chrome, MessageCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
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
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  const isFormValid = name && email && phone && password && confirmPassword && password === confirmPassword && agreeToTerms;
  
  const handleRegister = () => {
    if (!isFormValid) {
      return;
    }
    
    // Generate OTP and send to both email and mobile
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // In a real app, you would send OTP to email and SMS
    Alert.alert(
      language === 'az' ? 'OTP Göndərildi' : 'OTP отправлен',
      language === 'az' 
        ? `Təsdiq kodu həm e-poçtunuza, həm də mobil nömrənizə göndərildi: ${otp}` 
        : `Код подтверждения отправлен на вашу почту и мобильный номер: ${otp}`
    );
    
    setShowOtpStep(true);
  };
  
  const handleVerifyOtp = () => {
    if (emailOtp === generatedOtp && mobileOtp === generatedOtp) {
      // Mock registration - in a real app, this would be an API call
      login(users[0]);
      router.push('/');
    } else {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Təsdiq kodları yanlışdır' 
          : 'Коды подтверждения неверны'
      );
    }
  };
  
  const handleClose = () => {
    router.back();
  };
  
  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSocialRegister = (provider: string) => {
    // Mock social registration - in a real app, this would integrate with OAuth providers
    console.log(`Registering with ${provider}`);
    login(users[0]);
    router.push('/');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        language === 'az' ? 'İcazə tələb olunur' : 'Требуется разрешение',
        language === 'az' 
          ? 'Şəkil seçmək üçün qalereya icazəsi lazımdır' 
          : 'Для выбора изображения требуется доступ к галерее'
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
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        language === 'az' ? 'İcazə tələb olunur' : 'Требуется разрешение',
        language === 'az' 
          ? 'Şəkil çəkmək üçün kamera icazəsi lazımdır' 
          : 'Для съемки требуется доступ к камере'
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
  };

  const showImagePicker = () => {
    Alert.alert(
      language === 'az' ? 'Profil şəkli seçin' : 'Выберите фото профиля',
      language === 'az' ? 'Şəkil necə əlavə etmək istəyirsiniz?' : 'Как вы хотите добавить фото?',
      [
        {
          text: language === 'az' ? 'Qalereya' : 'Галерея',
          onPress: pickImage,
        },
        {
          text: language === 'az' ? 'Kamera' : 'Камера',
          onPress: takePhoto,
        },
        {
          text: language === 'az' ? 'Ləğv et' : 'Отмена',
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
          {showOtpStep 
            ? (language === 'az' ? 'Təsdiq kodunu daxil edin' : 'Введите код подтверждения')
            : (language === 'az' ? 'Qeydiyyatdan keçin' : 'Зарегистрироваться')}
        </Text>
        
        <View style={styles.form}>
          {showOtpStep ? (
            <>
              <View style={styles.otpContainer}>
                <Text style={styles.otpDescription}>
                  {language === 'az' 
                    ? 'Həm e-poçtunuza, həm də mobil nömrənizə göndərilən təsdiq kodunu daxil edin' 
                    : 'Введите код подтверждения, отправленный на вашу почту и мобильный номер'}
                </Text>
                
                <View style={styles.otpInputGroup}>
                  <View style={styles.otpInputContainer}>
                    <Mail size={20} color={Colors.primary} />
                    <Text style={styles.otpLabel}>
                      {language === 'az' ? 'E-poçt kodu' : 'Код с почты'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.otpInput}
                    value={emailOtp}
                    onChangeText={setEmailOtp}
                    placeholder="000000"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                
                <View style={styles.otpInputGroup}>
                  <View style={styles.otpInputContainer}>
                    <Phone size={20} color={Colors.primary} />
                    <Text style={styles.otpLabel}>
                      {language === 'az' ? 'Mobil kodu' : 'Код с телефона'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.otpInput}
                    value={mobileOtp}
                    onChangeText={setMobileOtp}
                    placeholder="000000"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.registerButton,
                    (!emailOtp || !mobileOtp || emailOtp.length !== 6 || mobileOtp.length !== 6) && styles.disabledButton
                  ]} 
                  onPress={handleVerifyOtp}
                  disabled={!emailOtp || !mobileOtp || emailOtp.length !== 6 || mobileOtp.length !== 6}
                >
                  <Text style={styles.registerButtonText}>
                    {language === 'az' ? 'Təsdiq et' : 'Подтвердить'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.backToFormButton}
                  onPress={() => setShowOtpStep(false)}
                >
                  <Text style={styles.backToFormText}>
                    {language === 'az' ? 'Geri qayıt' : 'Вернуться назад'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.profileImageSection}>
                <Text style={styles.label}>
                  {language === 'az' ? 'Profil şəkli' : 'Фото профиля'}
                </Text>
                <TouchableOpacity style={styles.profileImageContainer} onPress={showImagePicker}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <User size={40} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.cameraIconContainer}>
                    <Camera size={16} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.profileImageHint}>
                  {language === 'az' ? 'Şəkil əlavə etmək üçün toxunun' : 'Нажмите, чтобы добавить фото'}
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {language === 'az' ? 'Ad Soyad' : 'Имя Фамилия'}
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={language === 'az' ? 'Adınız və soyadınız' : 'Ваше имя и фамилия'}
              placeholderTextColor={Colors.placeholder}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {language === 'az' ? 'E-poçt' : 'Эл. почта'}
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={language === 'az' ? 'E-poçt ünvanınız' : 'Ваш адрес эл. почты'}
              placeholderTextColor={Colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {language === 'az' ? 'Telefon' : 'Телефон'}
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
                  // Remove any non-digit characters except spaces and dashes
                  const cleaned = text.replace(/[^0-9\s\-]/g, '');
                  setPhone('+994 ' + cleaned);
                }}
                placeholder={language === 'az' ? 'XX XXX XX XX' : 'XX XXX XX XX'}
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {language === 'az' ? 'Şifrə' : 'Пароль'}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder={language === 'az' ? 'Şifrəniz' : 'Ваш пароль'}
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
              {language === 'az' ? 'Şifrəni təsdiqləyin' : 'Подтвердите пароль'}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={language === 'az' ? 'Şifrəni təkrar daxil edin' : 'Введите пароль повторно'}
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
              {language === 'az' ? 'Mən ' : 'Я согласен с '}
              <TouchableOpacity onPress={() => router.push('/terms')}>
                <Text style={styles.termsLink}>
                  {language === 'az' ? 'istifadə şərtləri və məxfilik siyasəti' : 'условиями использования и политикой конфиденциальности'}
                </Text>
              </TouchableOpacity>
              {language === 'az' ? ' ilə razıyam' : ''}
            </Text>
          </View>
          
            <TouchableOpacity 
              style={[
                styles.registerButton,
                !isFormValid && styles.disabledButton
              ]} 
              onPress={handleRegister}
              disabled={!isFormValid}
            >
              <Text style={styles.registerButtonText}>
                {language === 'az' ? 'Qeydiyyatdan keç' : 'Зарегистрироваться'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {language === 'az' ? 'və ya' : 'или'}
              </Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialRegister('facebook')}
              >
                <Facebook size={24} color="white" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialRegister('google')}
              >
                <Chrome size={24} color="white" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.vkButton]}
                onPress={() => handleSocialRegister('vk')}
              >
                <MessageCircle size={24} color="white" />
                <Text style={styles.socialButtonText}>VK</Text>
              </TouchableOpacity>
            </View>
            </>
          )}
        </View>
        
        {!showOtpStep && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {language === 'az' ? 'Artıq hesabınız var?' : 'Уже есть аккаунт?'}
            </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginText}>
                {language === 'az' ? 'Daxil olun' : 'Войти'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
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
  otpContainer: {
    alignItems: 'center',
  },
  otpDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpInputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 8,
  },
  otpInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  backToFormButton: {
    marginTop: 16,
    padding: 12,
  },
  backToFormText: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
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