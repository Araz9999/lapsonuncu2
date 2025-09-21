import config from '@/constants/config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  verified: boolean;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

class AuthService {
  private googleClientId: string;
  private facebookAppId: string;
  private currentUser: AuthUser | null = null;
  private tokens: AuthTokens | null = null;

  constructor() {
    this.googleClientId = config.GOOGLE_CLIENT_ID as string;
    this.facebookAppId = config.FACEBOOK_APP_ID as string;
  }

  async initialize(): Promise<void> {
    try {
      const storedTokens = await AsyncStorage.getItem('auth_tokens');
      const storedUser = await AsyncStorage.getItem('auth_user');

      if (storedTokens && storedUser) {
        this.tokens = JSON.parse(storedTokens);
        this.currentUser = JSON.parse(storedUser);

        if (this.tokens && new Date() > new Date(this.tokens.expiresAt)) {
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await fetch(`${config.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      await this.setAuthData(data.user, data.tokens);
      
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthUser> {
    try {
      const response = await fetch(`${config.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      await this.setAuthData(data.user, data.tokens);
      
      return data.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<AuthUser> {
    if (Platform.OS === 'web') {
      return this.loginWithGoogleWeb();
    } else {
      return this.loginWithGoogleMobile();
    }
  }

  private async loginWithGoogleWeb(): Promise<AuthUser> {
    try {
      const w = globalThis as any;
      if (!w.google) {
        await this.loadGoogleSignInScript();
      }

      const response = await new Promise<any>((resolve, reject) => {
        const gw = (globalThis as any).google;
        gw?.accounts?.id?.initialize?.({
          client_id: this.googleClientId,
          callback: resolve,
          error_callback: reject,
        });

        gw?.accounts?.id?.prompt?.();
      });

      const authResponse = await fetch(`${config.BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      if (!authResponse.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await authResponse.json();
      await this.setAuthData(data.user, data.tokens);
      
      return data.user;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  private async loginWithGoogleMobile(): Promise<AuthUser> {
    console.log('Google mobile login would require expo-auth-session or similar');
    throw new Error('Google mobile login not implemented - requires expo-auth-session');
  }

  private async loadGoogleSignInScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const d = (globalThis as any).document;
      if (!d) {
        reject(new Error('Document not available'));
        return;
      }
      const script = d.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
      d.head.appendChild(script);
    });
  }

  async logout(): Promise<void> {
    try {
      if (this.tokens) {
        await fetch(`${config.BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${config.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.tokens = data.tokens;
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${config.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${config.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  private async setAuthData(user: AuthUser, tokens: AuthTokens): Promise<void> {
    this.currentUser = user;
    this.tokens = tokens;
    
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private async clearAuthData(): Promise<void> {
    this.currentUser = null;
    this.tokens = null;
    
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('auth_tokens');
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.tokens !== null;
  }

  isConfigured(): boolean {
    return !this.googleClientId.includes('your-') || !this.facebookAppId.includes('your-');
  }
}

export const authService = new AuthService();