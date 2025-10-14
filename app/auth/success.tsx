import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import config from '@/constants/config';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthSuccessScreen() {
  const router = useRouter();
  const { code, token, user } = useLocalSearchParams();
  const { login } = useUserStore();

  useEffect(() => {
    handleAuthSuccess();
  }, []);

  const handleAuthSuccess = async () => {
    try {
      let exchangedUser: any = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let expiresAt: string | null = null;

      if (code) {
        const res = await fetch(`${config.BASE_URL}/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) throw new Error('Exchange failed');
        const data = await res.json();
        exchangedUser = data.user;
        accessToken = data.tokens?.accessToken ?? null;
        refreshToken = data.tokens?.refreshToken ?? null;
        expiresAt = data.tokens?.expiresAt ?? null;
      } else if (token && user) {
        // Fallback for legacy flow (will be deprecated)
        exchangedUser = JSON.parse(user as string);
        accessToken = token as string;
        refreshToken = token as string;
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        console.error('[AuthSuccess] Missing auth data');
        router.replace('/auth/login');
        return;
      }

      await AsyncStorage.setItem('auth_tokens', JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt,
      }));
      await AsyncStorage.setItem('auth_user', JSON.stringify(exchangedUser));

      console.log('[AuthSuccess] Login successful, user:', exchangedUser.email);

      login({
        id: exchangedUser.id,
        name: exchangedUser.name,
        email: exchangedUser.email,
        phone: exchangedUser.phone || '',
        avatar: exchangedUser.avatar || '',
        rating: 0,
        totalRatings: 0,
        memberSince: new Date().toISOString(),
        location: { en: '', ru: '', az: '' },
        balance: 0,
        role: exchangedUser.role || 'user',
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

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      console.error('[AuthSuccess] Error processing auth success:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Completing login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.text,
  },
});
