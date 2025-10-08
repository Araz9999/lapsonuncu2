import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Linking, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { Wallet, Gift, Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react-native';
import { paymentService } from '@/services/paymentService';

export default function WalletScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useLanguageStore();
  const { walletBalance, bonusBalance, addToWallet, addBonus, getTotalBalance, currentUser } = useUserStore();
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { 
      id: 'payriff', 
      name: language === 'az' ? 'Payriff ödəniş şəbəkəsi' : 'Платежный шлюз Payriff', 
      description: language === 'az' ? 'Bank kartı və digər ödəniş üsulları' : 'Банковские карты и другие способы оплаты',
      icon: CreditCard, 
      color: '#0E7490',
      enabled: paymentService.isPayriffConfigured()
    },
  ];

  useEffect(() => {
    if (params.payment === 'success' && params.orderId && params.amount) {
      const amount = parseFloat(params.amount as string);
      addToWallet(amount);
      
      const bonusAmount = amount * 0.05;
      addBonus(bonusAmount);

      Alert.alert(
        language === 'az' ? 'Ödəniş uğurlu!' : 'Оплата успешна!',
        language === 'az' 
          ? `${amount} AZN balansınıza əlavə edildi. ${bonusAmount.toFixed(2)} AZN bonus qazandınız!`
          : `${amount} AZN добавлено на ваш баланс. Вы получили ${bonusAmount.toFixed(2)} AZN бонуса!`
      );

      router.replace('/wallet');
    } else if (params.payment === 'failed' || params.payment === 'canceled') {
      Alert.alert(
        language === 'az' ? 'Ödəniş uğursuz' : 'Оплата не удалась',
        language === 'az' 
          ? 'Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
          : 'Произошла ошибка при оплате. Пожалуйста, попробуйте снова.'
      );
      router.replace('/wallet');
    }
  }, [params]);

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Düzgün məbləğ daxil edin' : 'Введите корректную сумму'
      );
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Ödəniş üsulunu seçin' : 'Выберите способ оплаты'
      );
      return;
    }

    const amount = parseFloat(topUpAmount);

    if (selectedPaymentMethod === 'payriff') {
      try {
        setIsProcessing(true);

        const result = await paymentService.createPayriffOrder(
          amount,
          'AZN',
          currentUser?.id || 'guest',
          language === 'az' ? 'Balans artırılması' : 'Пополнение баланса'
        );

        if (result.success && result.paymentUrl) {
          if (Platform.OS === 'web') {
            window.location.href = result.paymentUrl;
          } else {
            const supported = await Linking.canOpenURL(result.paymentUrl);
            if (supported) {
              await Linking.openURL(result.paymentUrl);
            } else {
              throw new Error('Cannot open payment URL');
            }
          }

          setShowTopUp(false);
          setTopUpAmount('');
          setSelectedPaymentMethod('');
        } else {
          throw new Error(result.error || 'Failed to create payment');
        }
      } catch (error) {
        console.error('Payment error:', error);
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' 
            ? 'Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
            : 'Произошла ошибка при оплате. Пожалуйста, попробуйте снова.'
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const transactions = [
    {
      id: 1,
      type: 'topup',
      amount: 50,
      date: '2024-01-15',
      description: language === 'az' ? 'Balans artırılması' : 'Пополнение баланса'
    },
    {
      id: 2,
      type: 'spend',
      amount: -15,
      date: '2024-01-14',
      description: language === 'az' ? 'VIP elan' : 'VIP объявление'
    },
    {
      id: 3,
      type: 'bonus',
      amount: 2.5,
      date: '2024-01-15',
      description: language === 'az' ? 'Bonus' : 'Бонус'
    },
  ];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: language === 'az' ? 'Pul kisəsi' : 'Кошелек',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView style={styles.container}>
        {/* Total Balance Card */}
        <View style={styles.balanceSection}>
          <View style={[styles.balanceCard, styles.totalBalanceCard]}>
            <View style={styles.balanceHeader}>
              <Wallet size={28} color={Colors.primary} />
              <Text style={styles.totalBalanceTitle}>
                {language === 'az' ? 'Ümumi balans' : 'Общий баланс'}
              </Text>
            </View>
            <Text style={styles.totalBalanceAmount}>{getTotalBalance().toFixed(2)} AZN</Text>
            <Text style={styles.totalBalanceSubtext}>
              {language === 'az' 
                ? 'Elan yerləşdirmək üçün istifadə edilə bilər' 
                : 'Можно использовать для размещения объявлений'}
            </Text>
          </View>

          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Wallet size={20} color={Colors.primary} />
                <Text style={styles.balanceTitle}>
                  {language === 'az' ? 'Əsas balans' : 'Основной баланс'}
                </Text>
              </View>
              <Text style={styles.balanceAmount}>{walletBalance.toFixed(2)} AZN</Text>
            </View>

            <View style={[styles.balanceCard, styles.bonusCard]}>
              <View style={styles.balanceHeader}>
                <Gift size={20} color={Colors.secondary} />
                <Text style={styles.balanceTitle}>
                  {language === 'az' ? 'Bonus balans' : 'Бонусный баланс'}
                </Text>
              </View>
              <Text style={[styles.balanceAmount, styles.bonusAmount]}>
                {bonusBalance.toFixed(2)} AZN
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowTopUp(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {language === 'az' ? 'Balans artır' : 'Пополнить'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top Up Modal */}
        {showTopUp && (
          <View style={styles.topUpSection}>
            <Text style={styles.sectionTitle}>
              {language === 'az' ? 'Balans artırılması' : 'Пополнение баланса'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {language === 'az' ? 'Məbləğ (AZN)' : 'Сумма (AZN)'}
              </Text>
              <TextInput
                style={styles.input}
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={Colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {language === 'az' ? 'Ödəniş üsulu' : 'Способ оплаты'}
              </Text>
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethod,
                        selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
                        !method.enabled && styles.disabledPaymentMethod
                      ]}
                      onPress={() => method.enabled && setSelectedPaymentMethod(method.id)}
                      disabled={!method.enabled}
                    >
                      <IconComponent size={20} color={method.enabled ? method.color : Colors.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.paymentMethodText, !method.enabled && styles.disabledText]}>
                          {method.name}
                        </Text>
                        {method.description && (
                          <Text style={styles.paymentMethodDescription}>
                            {method.description}
                          </Text>
                        )}
                        {!method.enabled && (
                          <Text style={styles.disabledHint}>
                            {language === 'az' ? 'Tezliklə' : 'Скоро'}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.topUpButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowTopUp(false);
                  setTopUpAmount('');
                  setSelectedPaymentMethod('');
                }}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'az' ? 'Ləğv et' : 'Отмена'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, isProcessing && styles.disabledButton]}
                onPress={handleTopUp}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {language === 'az' ? 'Ödə' : 'Оплатить'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bonus Info */}
        <View style={styles.bonusInfo}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Bonus sistemi' : 'Бонусная система'}
          </Text>
          <View style={styles.bonusInfoCard}>
            <Text style={styles.bonusInfoText}>
              {language === 'az' 
                ? '• Balans artırdıqda 5% bonus qazanın\n• Bonusları elan yerləşdirmək üçün istifadə edin\n• Hər ay yeni bonuslar qazanın'
                : '• Получайте 5% бонуса при пополнении\n• Используйте бонусы для размещения объявлений\n• Зарабатывайте новые бонусы каждый месяц'
              }
            </Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Əməliyyat tarixçəsi' : 'История операций'}
          </Text>
          
          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                {transaction.type === 'topup' && <ArrowDownLeft size={20} color={Colors.success} />}
                {transaction.type === 'spend' && <ArrowUpRight size={20} color={Colors.error} />}
                {transaction.type === 'bonus' && <Gift size={20} color={Colors.secondary} />}
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              
              <Text style={[
                styles.transactionAmount,
                transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount} AZN
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  balanceSection: {
    padding: 16,
    gap: 16,
  },
  totalBalanceCard: {
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    borderColor: Colors.primary,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 24,
  },
  totalBalanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  totalBalanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginVertical: 8,
  },
  totalBalanceSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bonusCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: Colors.secondary,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  balanceTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  bonusAmount: {
    color: Colors.secondary,
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topUpSection: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    gap: 12,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
  },
  paymentMethodText: {
    fontSize: 16,
    color: Colors.text,
  },
  topUpButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bonusInfo: {
    padding: 16,
  },
  bonusInfoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bonusInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  transactionSection: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.error,
  },
  disabledPaymentMethod: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  disabledHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});