import { Platform, Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { logger } from '@/utils/logger';
export interface SocialAuthResult {
  success: boolean;
  token?: string;
  user?: Record<string, unknown>;
  error?: string;
}

export interface SocialAuthConfig {
  google: boolean;
  facebook: boolean;
  vk: boolean;
}

export async function checkSocialAuthStatus(): Promise<SocialAuthConfig> {
  try {
    const baseUrl = Platform.select({
      web: typeof window !== 'undefined' && window.location ? window.location.origin : 'https://1r36dhx42va8pxqbqz5ja.rork.app',
      default: 'https://1r36dhx42va8pxqbqz5ja.rork.app'
    });
    logger.debug('[SocialAuth] Checking status at:', `${baseUrl}/api/auth/status`);
    const response = await fetch(`${baseUrl}/api/auth/status`);
    
    if (!response.ok) {
      logger.warn('[SocialAuth] Failed to check auth status');
      return { google: false, facebook: false, vk: false };
    }
    
    const data = await response.json();
    return data.configured || { google: false, facebook: false, vk: false };
  } catch (error) {
    logger.error('[SocialAuth] Error checking auth status:', error);
    return { google: false, facebook: false, vk: false };
  }
}

export async function initiateSocialLogin(
  provider: 'google' | 'facebook' | 'vk',
  onSuccess: (result: SocialAuthResult) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    logger.debug(`[SocialAuth] Initiating ${provider} login`);
    
    const baseUrl = Platform.select({
      web: typeof window !== 'undefined' && window.location ? window.location.origin : 'https://1r36dhx42va8pxqbqz5ja.rork.app',
      default: 'https://1r36dhx42va8pxqbqz5ja.rork.app'
    });
    const authUrl = `${baseUrl}/api/auth/${provider}/login`;
    
    logger.debug(`[SocialAuth] Opening auth URL: ${authUrl}`);

    if (Platform.OS === 'web') {
      window.location.href = authUrl;
    } else {
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        `${baseUrl}/auth/success`
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const userData = url.searchParams.get('user');

        if (token && userData) {
          let user;
          try {
            user = JSON.parse(userData);
          } catch {
            onError?.('Invalid user data received');
            return;
          }
          onSuccess({
            success: true,
            token,
            user,
          });
        } else {
          onError('Failed to retrieve authentication data');
        }
      } else if (result.type === 'cancel') {
        logger.debug('[SocialAuth] User cancelled OAuth flow');
        onError('Login cancelled');
      } else {
        onError('Login failed');
      }
    }
  } catch (error) {
    logger.error(`[SocialAuth] ${provider} login error:`, error);
    onError(`Failed to login with ${provider}. Please try again.`);
  }
}

export function showSocialLoginError(provider: string, error: string): void {
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  
  Alert.alert(
    `${providerName} Login Failed`,
    error || `Failed to login with ${providerName}. Please try again or use a different method.`,
    [{ text: 'OK' }]
  );
}

export function getSocialLoginButtonConfig(provider: 'google' | 'facebook' | 'vk') {
  const configs = {
    google: {
      name: 'Google',
      color: '#DB4437',
      icon: 'Chrome',
    },
    facebook: {
      name: 'Facebook',
      color: '#1877F2',
      icon: 'Facebook',
    },
    vk: {
      name: 'VK',
      color: '#0077FF',
      icon: 'MessageCircle',
    },
  };

  return configs[provider];
}

export async function openSocialAuthSetupGuide(): Promise<void> {
  const guideUrl = 'https://github.com/yourusername/yourrepo/blob/main/SOCIAL_LOGIN_SETUP.md';
  
  try {
    const canOpen = await Linking.canOpenURL(guideUrl);
    if (canOpen) {
      await Linking.openURL(guideUrl);
    } else {
      Alert.alert(
        'Setup Guide',
        'Please check SOCIAL_LOGIN_SETUP.md in the project root for detailed setup instructions.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    logger.error('[SocialAuth] Error opening setup guide:', error);
  }
}
