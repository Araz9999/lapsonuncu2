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
import { getColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

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
  const { themeMode, colorTheme } = useThemeStore();
  const colors = getColors(themeMode, colorTheme);
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [paymentHistory] = useState<PaymentRecord[]>(mockPaymentHistory);

  const filteredPayments = paymentHistory.filter(payment => {
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
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPaymentItem = (payment: PaymentRecord) => {
    return (
      <TouchableOpacity
        key={payment.id}
        style={styles.paymentItem}
        onPress={() => {
          // Navigate to payment details
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

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Ödəniş Tarixçəsi',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
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
                onPress={() => setSelectedFilter(option.id)}
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
          <TouchableOpacity style={styles.helpItem}>
            <AlertCircle size={20} color={colors.primary} />
            <Text style={styles.helpText}>Ödəniş problemləri</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpItem}>
            <RefreshCw size={20} color={colors.primary} />
            <Text style={styles.helpText}>Geri qaytarma tələbi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpItem}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.helpText}>Qəbz tələb et</Text>
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
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
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
    color: '#6B7280',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
  },
  activeFilterTab: {
    backgroundColor: '#0E7490',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  paymentList: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentType: {
    fontSize: 12,
    color: '#0E7490',
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
    color: '#6B7280',
    marginRight: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  storeName: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  monthlySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    color: '#0E7490',
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  helpText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
});