import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { Wallet, Gift, Plus, ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCw } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import type { PayriffWalletHistory } from '@/services/payriffService';

export default function WalletScreen() {
  const { language } = useLanguageStore();
  const { walletBalance, bonusBalance, addToWallet, addBonus } = useUserStore();
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const walletQuery = trpc.payriff.getWallet.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await walletQuery.refetch();
    setRefreshing(false);
  };

  const paymentMethods = [
    { id: 'card', name: 'Bank kartı', icon: CreditCard, color: '#4CAF50' },
  ];

  const handleTopUp = () => {
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
    addToWallet(amount);
    
    // Add bonus for top-up (5% bonus)
    const bonusAmount = amount * 0.05;
    addBonus(bonusAmount);

    Alert.alert(
      language === 'az' ? 'Uğurlu' : 'Успешно',
      language === 'az' 
        ? `${amount} AZN balansınıza əlavə edildi. ${bonusAmount.toFixed(2)} AZN bonus qazandınız!`
        : `${amount} AZN добавлено на ваш баланс. Вы получили ${bonusAmount.toFixed(2)} AZN бонуса!`
    );

    setShowTopUp(false);
    setTopUpAmount('');
    setSelectedPaymentMethod('');
  };

  const getOperationLabel = (operation: string) => {
    const operationMap: Record<string, { az: string; ru: string }> = {
      'TOPUP': { az: 'Balans artırılması', ru: 'Пополнение баланса' },
      'SPEND': { az: 'Xərc', ru: 'Расход' },
      'TRANSFER_IN': { az: 'Transfer (daxil olma)', ru: 'Перевод (входящий)' },
      'TRANSFER_OUT': { az: 'Transfer (çıxış)', ru: 'Перевод (исходящий)' },
      'PAYMENT': { az: 'Ödəniş', ru: 'Оплата' },
      'REFUND': { az: 'Geri qaytarma', ru: 'Возврат' },
      'BONUS': { az: 'Bonus', ru: 'Бонус' },
    };

    const mapped = operationMap[operation.toUpperCase()];
    if (mapped) {
      return language === 'az' ? mapped.az : mapped.ru;
    }
    return operation;
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
                style={styles.confirmButton}
                onPress={handleTopUp}
              >
                <Text style={styles.confirmButtonText}>
                  {language === 'az' ? 'Ödə' : 'Оплатить'}
                </Text>
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
                      {language === 'az' ? 'Balans' : 'Баланс'}: {transaction.balance.toFixed(2)} AZN
                    </Text>
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
});