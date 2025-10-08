import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const orderId = params.orderId as string;
  const amount = params.amount as string;

  useEffect(() => {
    console.log('Payment success:', { orderId, amount });
  }, [orderId, amount]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Ödəniş Uğurlu',
          headerStyle: { backgroundColor: Colors.success },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color={Colors.success} />
        </View>

        <Text style={styles.title}>Ödəniş Uğurla Tamamlandı!</Text>
        <Text style={styles.subtitle}>
          Ödənişiniz uğurla həyata keçirildi
        </Text>

        {orderId && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailLabel}>Sifariş ID:</Text>
            <Text style={styles.detailValue}>{orderId}</Text>
          </View>
        )}

        {amount && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailLabel}>Məbləğ:</Text>
            <Text style={styles.detailValue}>{amount} AZN</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)')}
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
