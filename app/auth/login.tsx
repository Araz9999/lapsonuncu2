import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/constants/translations';
import { useUserStore } from '@/store/userStore';
import { users } from '@/mocks/users';
import Colors from '@/constants/colors';
import { X, Eye, EyeOff, Facebook, Chrome, MessageCircle } from 'lucide-react-native';
import { initiateSocialLogin, checkSocialAuthStatus, showSocialLoginError, type SocialAuthConfig } from '@/utils/socialAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useUserStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialAuthConfig, setSocialAuthConfig] = useState<SocialAuthConfig>({ google: false, facebook: false, vk: false });
  const [loadingSocial, setLoadingSocial] = useState<string | null>(null);
  
  useEffect(() => {
    loadSocialAuthStatus();
  }, []);

  const loadSocialAuthStatus = async () => {
    const status = await checkSocialAuthStatus();
    setSocialAuthConfig(status);
    console.log('[Login] Social auth status:', status);
  };

  const handleLogin = () => {
    if (!email || !password) {
      return;
    }
    
    login(users[0]);
    router.back();
  };
  
  const handleClose = () => {
    router.back();
  };
  
  const handleRegister = () => {
    router.push('/auth/register');
  };
  
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'vk') => {
    setLoadingSocial(provider);
    
    await initiateSocialLogin(
      provider,
      (result) => {
        setLoadingSocial(null);
        if (result.success && result.user) {
          login({
            ...users[0],
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            avatar: result.user.avatar,
          });
          router.replace('/(tabs)');
        }
      },
      (error) => {
        setLoadingSocial(null);
        showSocialLoginError(provider, error);
      }
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
          {t('loginToAccount')}
        </Text>
        
        <View style={styles.form}>
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
          
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>
              {t('forgotPassword')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.loginButton,
              (!email || !password) && styles.disabledButton
            ]} 
            onPress={handleLogin}
            disabled={!email || !password}
          >
            <Text style={styles.loginButtonText}>
              {t('login')}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {t('or')}
            </Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.socialButtons}>
            {socialAuthConfig.google && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
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
            )}
            
            {socialAuthConfig.facebook && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialLogin('facebook')}
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
            )}
            
            {socialAuthConfig.vk && (
              <TouchableOpacity 
                style={[styles.socialButton, styles.vkButton]}
                onPress={() => handleSocialLogin('vk')}
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
            )}
            
            {!socialAuthConfig.google && !socialAuthConfig.facebook && !socialAuthConfig.vk && (
              <View style={styles.noSocialAuth}>
                <Text style={styles.noSocialAuthText}>
                  Social login not configured. See SOCIAL_LOGIN_SETUP.md for setup instructions.
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.termsNotice}>
            <Text style={styles.termsNoticeText}>
              {t('agreeToTerms')}
            </Text>
          </View>
          
          <View style={styles.registerSection}>
            <Text style={styles.footerText}>
              {t('noAccount')}
            </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>
                {t('registerNow')}
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
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
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
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 20,
  },
  termsNotice: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  termsNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  registerText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
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
  noSocialAuth: {
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noSocialAuthText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
