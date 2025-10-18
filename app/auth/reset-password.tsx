import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useLanguageStore } from '@/store/languageStore';
import { logger } from '@/utils/logger';
import Colors from '@/constants/colors';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { language } = useLanguageStore();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const resetMutation = trpc.auth.resetPassword.useMutation();

  const handleResetPassword = async () => {
    // ✅ Validate token exists
    if (!token) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Şifrə sıfırlama linki etibarsızdır. Zəhmət olmasa yenidən cəhd edin.'
          : 'Ссылка для сброса пароля недействительна. Пожалуйста, попробуйте снова.'
      );
      router.replace('/auth/forgot-password');
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Bütün xanaları doldurun' : 'Заполните все поля'
      );
      return;
    }

    // ✅ Match registration requirements (8+ chars, uppercase, lowercase, number)
    if (password.length < 8) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Şifrə ən az 8 simvol olmalıdır'
          : 'Пароль должен содержать минимум 8 символов'
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Şifrə ən azı 1 böyük hərf olmalıdır'
          : 'Пароль должен содержать минимум 1 заглавную букву'
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Şifrə ən azı 1 kiçik hərf olmalıdır'
          : 'Пароль должен содержать минимум 1 строчную букву'
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Şifrə ən azı 1 rəqəm olmalıdır'
          : 'Пароль должен содержать минимум 1 цифру'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Şifrələr uyğun gəlmir' : 'Пароли не совпадают'
      );
      return;
    }

    try {
      await resetMutation.mutateAsync({
        token: token as string,
        password,
      });

      logger.info('Password reset successful');

      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' 
          ? 'Şifrəniz uğurla dəyişdirildi'
          : 'Ваш пароль успешно изменен',
        [
          {
            text: language === 'az' ? 'Giriş et' : 'Войти',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      logger.error('Password reset error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        error.message || (language === 'az' 
          ? 'Şifrə dəyişdirilə bilmədi. Zəhmət olmasa yenidən cəhd edin.'
          : 'Не удалось изменить пароль. Пожалуйста, попробуйте снова.')
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: language === 'az' ? 'Şifrə Sıfırlama' : 'Сброс пароля', 
        headerShown: true 
      }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={48} color="#007AFF" />
            </View>
            <Text style={styles.title}>
              {language === 'az' ? 'Yeni Şifrə' : 'Новый пароль'}
            </Text>
            <Text style={styles.description}>
              {language === 'az' 
                ? 'Yeni şifrənizi daxil edin (min 8 simvol, böyük/kiçik hərf, rəqəm)'
                : 'Введите новый пароль (мин 8 символов, загл/строчн, цифра)'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={language === 'az' ? 'Yeni şifrə' : 'Новый пароль'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#8E8E93" />
                ) : (
                  <Eye size={20} color="#8E8E93" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={language === 'az' ? 'Şifrəni təsdiqlə' : 'Подтвердите пароль'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#8E8E93" />
                ) : (
                  <Eye size={20} color="#8E8E93" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, resetMutation.isPending && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {language === 'az' ? 'Şifrəni Dəyişdir' : 'Изменить пароль'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {language === 'az' 
                ? 'Köməyə ehtiyacınız varsa, bizim dəstək komandası ilə əlaqə saxlayın'
                : 'Если вам нужна помощь, свяжитесь с нашей службой поддержки'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
