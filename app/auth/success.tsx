import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthSuccessScreen() {
  const router = useRouter();
  const { token, user } = useLocalSearchParams();
  const { login } = useUserStore();

  useEffect(() => {
    handleAuthSuccess();
  }, []);

  const handleAuthSuccess = async () => {
    try {
      if (!token || !user) {
        console.error('[AuthSuccess] Missing token or user data');
        router.replace('/auth/login');
        return;
      }

      const userData = JSON.parse(user as string);
      
      await AsyncStorage.setItem('auth_token', token as string);
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));

      console.log('[AuthSuccess] Login successful, user:', userData.email);

      login({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        avatar: userData.avatar || '',
        rating: 0,
        totalRatings: 0,
        memberSince: new Date().toISOString(),
        location: { en: '', ru: '', az: '' },
        balance: 0,
        role: userData.role || 'user',
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
