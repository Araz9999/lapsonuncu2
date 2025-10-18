import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, RefreshControl, Linking, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { Wallet, Gift, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCw } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import type { PayriffWalletHistory } from '@/services/payriffService';

import { logger } from '@/utils/logger';
import { sanitizeNumericInput } from '@/utils/inputValidation';

export default function WalletScreen() {
  const { language } = useLanguageStore();
  const { currentUser, walletBalance, bonusBalance, addToWallet, addBonus } = useUserStore();
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const walletQuery = trpc.payriff.getWallet.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const createOrderMutation = trpc.payriff.createOrder.useMutation();

  const [refreshing, setRefreshing] = useState(false);

  // ✅ Sync local balance with Payriff balance
  useEffect(() => {
    if (walletQuery.data?.payload?.totalBalance !== undefined) {
      const payriffBalance = walletQuery.data.payload.totalBalance;
      const currentTotalBalance = walletBalance + bonusBalance;
      
      // Only sync if there's a significant difference (more than 0.01 AZN)
      if (Math.abs(payriffBalance - currentTotalBalance) > 0.01) {
        logger.info('[Wallet] Syncing local balance with Payriff:', { 
          payriff: payriffBalance, 
          local: currentTotalBalance 
        });
        
        // Update wallet balance to match Payriff (keep bonus separate)
        const newWalletBalance = Math.max(0, payriffBalance - bonusBalance);
        addToWallet(newWalletBalance - walletBalance);
      }
    }
  }, [walletQuery.data]);

  const onRefresh = async () => {
    setRefreshing(true);
    logger.info('[Wallet] Refreshing wallet data...');
    
    try {
      await walletQuery.refetch();
      logger.info('[Wallet] Refresh completed successfully');
    } catch (error) {
      logger.error('[Wallet] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const paymentMethods = [
    { id: 'card', name: 'Bank kartı', icon: CreditCard, color: '#4CAF50' },
  ];

  const handleTopUp = async () => {
    // ✅ Validate current user
    if (!currentUser) {
      logger.error('[Wallet] No current user for top-up');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatları tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }
    
    // ✅ Validate amount
    if (!topUpAmount || topUpAmount.trim() === '') {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Məbləğ daxil edin' : 'Введите сумму'
      );
      return;
    }
    
    const amount = parseFloat(topUpAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Düzgün məbləğ daxil edin' : 'Введите корректную сумму'
      );
      return;
    }
    
    // ✅ Add minimum amount check
    if (amount < 1) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Minimum məbləğ 1 AZN olmalıdır' : 'Минимальная сумма должна быть 1 AZN'
      );
      return;
    }
    
    // ✅ Add maximum amount check
    if (amount > 10000) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Maksimum məbləğ 10,000 AZN olmalıdır' : 'Максимальная сумма должна быть 10,000 AZN'
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
    
    logger.info('[Wallet] Initiating top-up:', { amount, userId: currentUser.id });
    
    try {
      setIsProcessing(true);
      
      const result = await createOrderMutation.mutateAsync({
        amount,
        language: language === 'az' ? 'AZ' : 'RU',
        currency: 'AZN',
        description: language === 'az' 
          ? `Balans artırılması - ${amount.toFixed(2)} AZN`
          : `Пополнение баланса - ${amount.toFixed(2)} AZN`,
        operation: 'PURCHASE',
        metadata: {
          type: 'wallet_topup',
          userId: currentUser.id,
          amount: amount.toFixed(2),
        },
      });

      logger.info('[Wallet] Order created successfully:', { orderId: result.payload?.orderId });

      if (result.payload?.paymentUrl) {
        const paymentUrl = result.payload.paymentUrl;
        
        if (Platform.OS === 'web') {
          window.location.href = paymentUrl;
        } else {
          const supported = await Linking.canOpenURL(paymentUrl);
          if (supported) {
            await Linking.openURL(paymentUrl);
          } else {
            Alert.alert(
              language === 'az' ? 'Xəta' : 'Ошибка',
              language === 'az' 
                ? 'Ödəniş səhifəsi açıla bilmədi'
                : 'Не удалось открыть страницу оплаты'
            );
          }
        }
        
        setShowTopUp(false);
        setTopUpAmount('');
        setSelectedPaymentMethod('');
        
        logger.info('[Wallet] Payment page opened successfully');
      } else {
        logger.error('[Wallet] No payment URL in response');
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' 
            ? 'Ödəniş linki alına bilmədi'
            : 'Не удалось получить ссылку на оплату'
        );
      }
    } catch (error) {
      logger.error('[Wallet] Top-up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error details:', errorMessage);
      
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? `Ödəniş zamanı xəta baş verdi: ${errorMessage}`
          : `Произошла ошибка при оплате: ${errorMessage}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getOperationLabel = (operation: string) => {
    const operationMap: Record<string, { az: string; ru: string }> = {
      'TOPUP': { az: 'Balans artırılması', ru: 'Пополнение баланса' },
      'PURCHASE': { az: 'Balans artırılması', ru: 'Пополнение баланса' },
      'SPEND': { az: 'Xərc', ru: 'Расход' },
      'TRANSFER_IN': { az: 'Transfer (daxil olma)', ru: 'Перевод (входящий)' },
      'TRANSFER_OUT': { az: 'Transfer (çıxış)', ru: 'Перевод (исходящий)' },
      'PAYMENT': { az: 'Ödəniş', ru: 'Оплата' },
      'REFUND': { az: 'Geri qaytarma', ru: 'Возврат' },
      'BONUS': { az: 'Bonus', ru: 'Бонус' },
    };

    const mapped = operationMap[operation?.toUpperCase()];
    if (mapped) {
      return language === 'az' ? mapped.az : mapped.ru;
    }
    return operation || (language === 'az' ? 'Naməlum əməliyyat' : 'Неизвестная операция');
  };
  
  // ✅ Format date helper
  const formatTransactionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return language === 'az' ? 'Bu gün' : 'Сегодня';
      } else if (diffDays === 1) {
        return language === 'az' ? 'Dünən' : 'Вчера';
      } else if (diffDays < 7) {
        return language === 'az' ? `${diffDays} gün əvvəl` : `${diffDays} дней назад`;
      } else {
        return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (error) {
      logger.error('[Wallet] Date format error:', error);
      return dateString;
    }
  };

  const transactions = walletQuery.data?.payload?.historyResponse || [];
  const totalBalance = walletQuery.data?.payload?.totalBalance || 0;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: language === 'az' ? 'Pul kisəsi' : 'Кошелек',
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
        }} 
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total Balance Card */}
        <View style={styles.balanceSection}>
          {walletQuery.isLoading ? (
            <View style={[styles.balanceCard, styles.totalBalanceCard]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {language === 'az' ? 'Yüklənir...' : 'Загрузка...'}
              </Text>
            </View>
          ) : walletQuery.error ? (
            <View style={[styles.balanceCard, styles.totalBalanceCard]}>
              <Text style={styles.errorText}>
                {language === 'az' ? 'Xəta baş verdi' : 'Произошла ошибка'}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => walletQuery.refetch()}
              >
                <RefreshCw size={16} color={Colors.primary} />
                <Text style={styles.retryButtonText}>
                  {language === 'az' ? 'Yenidən cəhd et' : 'Попробовать снова'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.balanceCard, styles.totalBalanceCard]}>
              <View style={styles.balanceHeader}>
                <Wallet size={28} color={Colors.primary} />
                <Text style={styles.totalBalanceTitle}>
                  {language === 'az' ? 'Payriff balans' : 'Баланс Payriff'}
                </Text>
              </View>
              <Text style={styles.totalBalanceAmount}>{totalBalance.toFixed(2)} AZN</Text>
              <Text style={styles.totalBalanceSubtext}>
                {language === 'az' 
                  ? 'Payriff hesabınızdakı balans' 
                  : 'Баланс на вашем счете Payriff'}
              </Text>
            </View>
          )}

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
                onChangeText={(text) => setTopUpAmount(sanitizeNumericInput(text))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                maxLength={10}
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
                        selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                    >
                      <IconComponent size={20} color={method.color} />
                      <Text style={styles.paymentMethodText}>{method.name}</Text>
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
                  <ActivityIndicator size="small" color="white" />
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
                ? '• Balans artırdıqda avtomatik bonus qazanın\n• Bonuslar əvvəlcə xərclənir, sonra əsas balans\n• Bonusların müddəti yoxdur\n• Minimum yükləmə: 1 AZN\n• Maksimum yükləmə: 10,000 AZN'
                : '• Получайте автоматический бонус при пополнении\n• Бонусы тратятся первыми, затем основной баланс\n• Бонусы не имеют срока действия\n• Минимальное пополнение: 1 AZN\n• Максимальное пополнение: 10,000 AZN'
              }
            </Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Əməliyyat tarixçəsi' : 'История операций'}
          </Text>
          
          {walletQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'az' ? 'Əməliyyat tarixçəsi yoxdur' : 'История операций пуста'}
              </Text>
            </View>
          ) : (
            transactions.map((transaction: PayriffWalletHistory) => {
              const isPositive = transaction.amount > 0;
              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    {isPositive ? (
                      <ArrowDownLeft size={20} color={Colors.success} />
                    ) : (
                      <ArrowUpRight size={20} color={Colors.error} />
                    )}
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {getOperationLabel(transaction.operation)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {transaction.createdAt ? formatTransactionDate(transaction.createdAt) : ''}
                    </Text>
                    {transaction.description && (
                      <Text style={styles.transactionMeta}>
                        {transaction.description}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.transactionAmount,
                    isPositive ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {isPositive ? '+' : ''}{transaction.amount.toFixed(2)} AZN
                  </Text>
                </View>
              );
            })
          )}
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
  transactionMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    fontStyle: 'italic',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});