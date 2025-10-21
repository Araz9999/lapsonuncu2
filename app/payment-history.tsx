import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  CreditCard,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  RefreshCw,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useLanguageStore } from '@/store/languageStore';
import { getColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { Alert } from 'react-native';
import { logger } from '@/utils/logger';

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: 'card' | 'bank' | 'wallet' | 'bonus';
  transactionId: string;
  storeId?: string;
  storeName?: string;
  type: 'store_renewal' | 'listing_promotion' | 'view_purchase' | 'premium_feature';
}

const mockPaymentHistory: PaymentRecord[] = [
  {
    id: '1',
    date: '2024-02-01T10:30:00Z',
    amount: 150,
    description: 'Mağaza yeniləməsi - Premium paket',
    status: 'completed',
    method: 'card',
    transactionId: 'TXN-2024-001',
    storeId: '1',
    storeName: 'TechMart Bakı',
    type: 'store_renewal'
  },
  {
    id: '2',
    date: '2024-01-28T14:15:00Z',
    amount: 25,
    description: 'Elan tanıtımı - 7 gün',
    status: 'completed',
    method: 'wallet',
    transactionId: 'TXN-2024-002',
    type: 'listing_promotion'
  },
  {
    id: '3',
    date: '2024-01-25T09:45:00Z',
    amount: 50,
    description: 'Baxış alma - 1000 baxış',
    status: 'completed',
    method: 'card',
    transactionId: 'TXN-2024-003',
    type: 'view_purchase'
  },
  {
    id: '4',
    date: '2024-01-20T16:20:00Z',
    amount: 200,
    description: 'Mağaza yeniləməsi - Business paket',
    status: 'failed',
    method: 'card',
    transactionId: 'TXN-2024-004',
    storeId: '2',
    storeName: 'Fashion House',
    type: 'store_renewal'
  },
  {
    id: '5',
    date: '2024-01-18T11:30:00Z',
    amount: 15,
    description: 'Premium xüsusiyyət - Analitika',
    status: 'completed',
    method: 'bonus',
    transactionId: 'TXN-2024-005',
    type: 'premium_feature'
  },
  {
    id: '6',
    date: '2024-01-15T13:10:00Z',
    amount: 100,
    description: 'Mağaza yeniləməsi - Əsas paket',
    status: 'refunded',
    method: 'bank',
    transactionId: 'TXN-2024-006',
    storeId: '1',
    storeName: 'TechMart Bakı',
    type: 'store_renewal'
  }
];

const filterOptions = [
  { id: 'all', label: 'Hamısı' },
  { id: 'completed', label: 'Tamamlanmış' },
  { id: 'pending', label: 'Gözləyən' },
  { id: 'failed', label: 'Uğursuz' },
  { id: 'refunded', label: 'Geri qaytarılmış' }
];

const typeLabels = {
  store_renewal: 'Mağaza Yeniləməsi',
  listing_promotion: 'Elan Tanıtımı',
  view_purchase: 'Baxış Alma',
  premium_feature: 'Premium Xüsusiyyət'
};

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { language } = useLanguageStore();
  const { themeMode, colorTheme } = useThemeStore();
  const colors = getColors(themeMode, colorTheme);
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [paymentHistory] = useState<PaymentRecord[]>(mockPaymentHistory);
  
  logger.info('[PaymentHistory] Screen opened:', { 
    userId: currentUser?.id, 
    totalPayments: mockPaymentHistory.length,
    filter: selectedFilter
  });

  const filteredPayments = paymentHistory.filter(payment => {
    if (!payment || !payment.status) {
      logger.warn('[PaymentHistory] Invalid payment record:', payment);
      return false;
    }
    
    if (selectedFilter === 'all') return true;
    return payment.status === selectedFilter;
  });

  const totalSpent = paymentHistory
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color={colors.success} />;
      case 'pending':
        return <Clock size={20} color={colors.warning} />;
      case 'failed':
        return <XCircle size={20} color={colors.error} />;
      case 'refunded':
        return <RefreshCw size={20} color={colors.primary} />;
      default:
        return <AlertCircle size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusText = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Gözləyir';
      case 'failed':
        return 'Uğursuz';
      case 'refunded':
        return 'Geri qaytarıldı';
      default:
        return 'Naməlum';
    }
  };

  const getStatusColor = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'refunded':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getMethodIcon = (method: PaymentRecord['method']) => {
    switch (method) {
      case 'card':
        return <CreditCard size={16} color={colors.textSecondary} />;
      case 'bank':
        return <Receipt size={16} color={colors.textSecondary} />;
      case 'wallet':
        return <DollarSign size={16} color={colors.textSecondary} />;
      case 'bonus':
        return <FileText size={16} color={colors.textSecondary} />;
      default:
        return <CreditCard size={16} color={colors.textSecondary} />;
    }
  };

  const getMethodText = (method: PaymentRecord['method']) => {
    switch (method) {
      case 'card':
        return 'Kart';
      case 'bank':
        return 'Bank';
      case 'wallet':
        return 'Balans';
      case 'bonus':
        return 'Bonus';
      default:
        return 'Naməlum';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        logger.warn('[PaymentHistory] Empty date string provided');
        return language === 'az' ? 'Tarix məlum deyil' : 'Дата неизвестна';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        logger.warn('[PaymentHistory] Invalid date string:', dateString);
        return language === 'az' ? 'Tarix səhv' : 'Неверная дата';
      }
      
      return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      logger.error('[PaymentHistory] Date formatting error:', error);
      return language === 'az' ? 'Tarix xətası' : 'Ошибка даты';
    }
  };

  const renderPaymentItem = (payment: PaymentRecord) => {
    if (!payment) {
      logger.error('[PaymentHistory] Null payment record in renderPaymentItem');
      return null;
    }
    
    if (!payment.id || !payment.status || !payment.amount) {
      logger.warn('[PaymentHistory] Incomplete payment record:', { id: payment.id, status: payment.status });
      return null;
    }
    
    return (
      <TouchableOpacity
        key={payment.id}
        style={styles.paymentItem}
        onPress={() => {
          logger.info('[PaymentHistory] Payment item clicked:', { 
            paymentId: payment.id, 
            transactionId: payment.transactionId 
          });
          
          Alert.alert(
            language === 'az' ? 'Ödəniş Detalları' : 'Детали платежа',
            `${language === 'az' ? 'Transaksiya ID' : 'ID транзакции'}: ${payment.transactionId}\n` +
            `${language === 'az' ? 'Məbləğ' : 'Сумма'}: ${payment.amount} AZN\n` +
            `${language === 'az' ? 'Status' : 'Статус'}: ${getStatusText(payment.status)}\n` +
            `${language === 'az' ? 'Tarix' : 'Дата'}: ${formatDate(payment.date)}`
          );
        }}
      >
        <View style={styles.paymentLeft}>
          <View style={styles.statusIconContainer}>
            {getStatusIcon(payment.status)}
          </View>
          <View style={styles.paymentContent}>
            <Text style={styles.paymentDescription} numberOfLines={2}>
              {payment.description}
            </Text>
            <Text style={styles.paymentType}>
              {typeLabels[payment.type]}
            </Text>
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentDate}>
                {formatDate(payment.date)}
              </Text>
              <View style={styles.paymentMethod}>
                {getMethodIcon(payment.method)}
                <Text style={styles.methodText}>
                  {getMethodText(payment.method)}
                </Text>
              </View>
            </View>
            {payment.storeName && (
              <Text style={styles.storeName}>
                Mağaza: {payment.storeName}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.paymentRight}>
          <Text style={[
            styles.paymentAmount,
            { color: payment.status === 'refunded' ? colors.primary : colors.text }
          ]}>
            {payment.status === 'refunded' ? '+' : '-'}{payment.amount} AZN
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(payment.status)}20` }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(payment.status) }
            ]}>
              {getStatusText(payment.status)}
            </Text>
          </View>
          <Text style={styles.transactionId}>
            {payment.transactionId}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Ödəniş Tarixçəsi',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  logger.info('[PaymentHistory] Export payment history requested');
                  Alert.alert(
                    language === 'az' ? 'Tarixçəni Yüklə' : 'Загрузить историю',
                    language === 'az' 
                      ? 'Ödəniş tarixçəsi PDF formatında yükləniləcək.' 
                      : 'История платежей будет загружена в формате PDF.'
                  );
                }}
              >
                <Download size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Ümumi Xərc</Text>
            <DollarSign size={24} color={colors.primary} />
          </View>
          <Text style={styles.summaryAmount}>{totalSpent} AZN</Text>
          <Text style={styles.summarySubtitle}>
            {filteredPayments.filter(p => p.status === 'completed').length} uğurlu ödəniş
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterTab,
                  selectedFilter === option.id && styles.activeFilterTab
                ]}
                onPress={() => {
                  logger.info('[PaymentHistory] Filter changed:', { from: selectedFilter, to: option.id });
                  setSelectedFilter(option.id);
                }}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === option.id && styles.activeFilterTabText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payment List */}
        <View style={styles.paymentList}>
          {filteredPayments.length > 0 ? (
            filteredPayments.map(renderPaymentItem)
          ) : (
            <View style={styles.emptyState}>
              <Receipt size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Ödəniş tapılmadı</Text>
              <Text style={styles.emptyStateText}>
                Seçilmiş filtrə uyğun ödəniş yoxdur
              </Text>
            </View>
          )}
        </View>

        {/* Monthly Summary */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Aylıq Xülasə</Text>
          <View style={styles.monthlyGrid}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>3</Text>
              <Text style={styles.monthlyLabel}>Bu ay</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>225 AZN</Text>
              <Text style={styles.monthlyLabel}>Ümumi məbləğ</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>75 AZN</Text>
              <Text style={styles.monthlyLabel}>Orta ödəniş</Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyValue}>100%</Text>
              <Text style={styles.monthlyLabel}>Uğur nisbəti</Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Kömək və Dəstək</Text>
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              logger.info('[PaymentHistory] Payment issues help requested');
              Alert.alert(
                language === 'az' ? 'Ödəniş Problemləri' : 'Проблемы с оплатой',
                language === 'az' 
                  ? 'Ödəniş ilə bağlı problemləriniz varsa, dəstək komandamızla əlaqə saxlayın.' 
                  : 'Если у вас есть проблемы с оплатой, свяжитесь с нашей службой поддержки.'
              );
            }}
          >
            <AlertCircle size={20} color={colors.primary} />
            <Text style={styles.helpText}>
              {language === 'az' ? 'Ödəniş problemləri' : 'Проблемы с оплатой'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              logger.info('[PaymentHistory] Refund request initiated');
              Alert.alert(
                language === 'az' ? 'Geri Qaytarma' : 'Возврат',
                language === 'az' 
                  ? 'Geri qaytarma tələbləri 24 saat ərzində işlənir. Dəstək komandası sizinlə əlaqə saxlayacaq.' 
                  : 'Запросы на возврат обрабатываются в течение 24 часов. Служба поддержки свяжется с вами.'
              );
            }}
          >
            <RefreshCw size={20} color={colors.primary} />
            <Text style={styles.helpText}>
              {language === 'az' ? 'Geri qaytarma tələbi' : 'Запрос на возврат'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpItem}
            onPress={() => {
              logger.info('[PaymentHistory] Receipt request initiated');
              Alert.alert(
                language === 'az' ? 'Qəbz Tələb Et' : 'Запросить чек',
                language === 'az' 
                  ? 'Qəbz email ünvanınıza göndəriləcək. Zəhmət olmasa bir neçə dəqiqə gözləyin.' 
                  : 'Чек будет отправлен на ваш email. Пожалуйста, подождите несколько минут.'
              );
            }}
          >
            <FileText size={20} color={colors.primary} />
            <Text style={styles.helpText}>
              {language === 'az' ? 'Qəbz tələb et' : 'Запросить чек'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow || '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterContainer: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  paymentList: {
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  statusIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  paymentContent: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  storeName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  monthlySection: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthlyItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  monthlyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  monthlyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  helpSection: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  helpText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
});