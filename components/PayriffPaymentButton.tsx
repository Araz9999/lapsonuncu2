import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

import { logger } from '@/utils/logger';
interface PayriffPaymentButtonProps {
  amount: number;
  orderId: string;
  description: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export default function PayriffPaymentButton({
  amount,
  orderId,
  description,
  onSuccess,
  onError,
  buttonText = 'Ödə',
  disabled = false,
}: PayriffPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const createPaymentMutation = trpc.payriff.createPayment.useMutation({
    onSuccess: async (data) => {
      logger.debug('Payment created:', data);
      
      if (data.paymentUrl) {
        const canOpen = await Linking.canOpenURL(data.paymentUrl);
        
        if (canOpen) {
          if (Platform.OS === 'web') {
            window.location.href = data.paymentUrl;
          } else {
            await Linking.openURL(data.paymentUrl);
          }
        } else {
          Alert.alert('Xəta', 'Ödəniş səhifəsi açıla bilmədi');
          onError?.('Cannot open payment URL');
          setLoading(false);
        }
      }
    },
    onError: (error) => {
      logger.error('Payment creation error:', error);
      Alert.alert('Xəta', error.message || 'Ödəniş yaradıla bilmədi');
      onError?.(error.message);
      setLoading(false);
    },
  });

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);

    try {
      await createPaymentMutation.mutateAsync({
        amount,
        orderId,
        description,
        language: 'az',
      });
    } catch (error) {
      logger.error('Payment error:', error);
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      onPress={handlePayment}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <CreditCard size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>
              {buttonText} ({amount.toFixed(2)} AZN)
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
