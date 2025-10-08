import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transactionId = params.transactionId as string;
  const orderId = params.orderId as string;

  const verifyPaymentQuery = trpc.payriff.verifyPayment.useQuery(
    {
      orderId: orderId || '',
      transactionId: transactionId || '',
    },
    {
      enabled: Boolean(orderId && transactionId),
      retry: 3,
      retryDelay: 1000,
    }
  );

  useEffect(() => {
    if (verifyPaymentQuery.data) {
      setVerifying(false);
      setVerified(verifyPaymentQuery.data.verified);
      
      if (!verifyPaymentQuery.data.verified) {
        setError(verifyPaymentQuery.data.message || 'Ödəniş təsdiqlənmədi');
      }
    }

    if (verifyPaymentQuery.error) {
      setVerifying(false);
      setError(verifyPaymentQuery.error.message);
    }
  }, [verifyPaymentQuery.data, verifyPaymentQuery.error]);

  const handleGoHome = () => {
    router.replace('/');
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.verifyingText}>Ödəniş yoxlanılır...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {verified ? (
          <>
            <CheckCircle size={80} color="#34C759" />
            <Text style={styles.title}>Ödəniş Uğurlu!</Text>
            <Text style={styles.message}>
              Ödənişiniz uğurla tamamlandı.
            </Text>
            {verifyPaymentQuery.data && (
              <View style={styles.details}>
                <Text style={styles.detailText}>
                  Məbləğ: {verifyPaymentQuery.data.amount} {verifyPaymentQuery.data.currency}
                </Text>
                <Text style={styles.detailText}>
                  Sifariş ID: {verifyPaymentQuery.data.orderId}
                </Text>
                <Text style={styles.detailText}>
                  Tranzaksiya ID: {verifyPaymentQuery.data.transactionId}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <XCircle size={80} color="#FF3B30" />
            <Text style={styles.title}>Ödəniş Uğursuz</Text>
            <Text style={styles.message}>
              {error || 'Ödəniş zamanı xəta baş verdi.'}
            </Text>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, verified ? styles.successButton : styles.errorButton]}
          onPress={handleGoHome}
        >
          <Text style={styles.buttonText}>Ana Səhifəyə Qayıt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  verifyingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  details: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  errorButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
