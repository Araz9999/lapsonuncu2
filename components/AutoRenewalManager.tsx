import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { Listing } from '@/types/listing';
import { adPackages } from '@/constants/adPackages';
import { Bell, Clock, CreditCard, RefreshCw } from 'lucide-react-native';

interface AutoRenewalManagerProps {
  listing: Listing;
  onUpdate: (updatedListing: Listing) => void;
}

export default function AutoRenewalManager({ listing, onUpdate }: AutoRenewalManagerProps) {
  const { language } = useLanguageStore();
  const { canAfford, spendFromBalance, addToWallet } = useUserStore();
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(listing.autoRenewalEnabled || false);
  const selectedPackage = listing.autoRenewalPackageId || listing.adType;
  const [isLoading, setIsLoading] = useState(false);

  const currentPackage = adPackages.find(pkg => pkg.id === listing.adType);
  
  // For auto-renewal, we need to determine the correct package based on the listing's duration
  // If it's a 30-day listing but showing as free, we should use the appropriate 30-day package
  const getDaysUntilExpiration = () => {
    const now = new Date();
    const expiration = new Date(listing.expiresAt);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const getOriginalDuration = () => {
    const created = new Date(listing.createdAt);
    const expires = new Date(listing.expiresAt);
    const diffTime = expires.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Determine the correct renewal package based on original duration
  const getRenewalPackage = () => {
    const originalDuration = getOriginalDuration();
    
    // If original duration was around 30 days, use standard-30 package
    if (originalDuration >= 25 && originalDuration <= 35) {
      return adPackages.find(pkg => pkg.id === 'standard-30') || currentPackage;
    }
    // If original duration was around 14 days, use standard package
    else if (originalDuration >= 10 && originalDuration <= 20) {
      return adPackages.find(pkg => pkg.id === 'standard') || currentPackage;
    }
    // For other durations, use the current package
    return currentPackage;
  };
  
  const renewalPackage = getRenewalPackage();
  const renewalPrice = renewalPackage?.price || 0;

  const handleToggleAutoRenewal = async () => {
    if (!autoRenewalEnabled) {
      // Check if user can afford the auto-renewal
      if (!canAfford(renewalPrice)) {
        Alert.alert(
          language === 'az' ? 'Balans Kifayət Etmir' : 'Недостаточно Средств',
          language === 'az'
            ? `Avtomatik yeniləmə üçün balansınızda ${renewalPrice} ${renewalPackage?.currency} olmalıdır. Balansınızı artırın.`
            : `Для автообновления на балансе должно быть ${renewalPrice} ${renewalPackage?.currency}. Пополните баланс.`
        );
        return;
      }

      // Enabling auto-renewal
      Alert.alert(
        language === 'az' ? 'Avtomatik Yeniləmə' : 'Автообновление',
        language === 'az' 
          ? `Elanınız ${renewalPackage?.name?.[language as keyof typeof renewalPackage.name] || renewalPackage?.name?.az || 'N/A'} tarifində avtomatik olaraq yeniləməyə davam edəcək. İndi ${renewalPrice} ${renewalPackage?.currency} balansınızdan çıxılacaq və 3 günlük güzəşt müddəti var. İstəsəniz avtomatik yeniləməni dayandıraraq pulu geri ala bilərsiniz.`
          : `Ваше объявление будет автоматически продлеваться по тарифу ${renewalPackage?.name?.[language as keyof typeof renewalPackage.name] || renewalPackage?.name?.ru || 'N/A'}. Сейчас с баланса будет списано ${renewalPrice} ${renewalPackage?.currency} и есть льготный период 3 дня. При желании можете отключить автообновление и вернуть деньги.`,
        [
          {
            text: language === 'az' ? 'Ləğv et' : 'Отмена',
            style: 'cancel',
          },
          {
            text: language === 'az' ? 'Aktivləşdir' : 'Активировать',
            onPress: () => enableAutoRenewal(),
          },
        ]
      );
    } else {
      // Disabling auto-renewal - check if we should refund based on grace period
      const now = new Date();
      const gracePeriodEnd = listing.gracePeriodEnd ? new Date(listing.gracePeriodEnd) : null;
      const shouldRefund = listing.autoRenewalPaid && !listing.autoRenewalUsed && gracePeriodEnd && now <= gracePeriodEnd;
      
      Alert.alert(
        language === 'az' ? 'Avtomatik Yeniləməni Dayandır' : 'Отключить Автообновление',
        language === 'az'
          ? `Avtomatik yeniləmə dayandırılacaq. ${shouldRefund ? `${renewalPrice} ${renewalPackage?.currency} balansınıza geri qaytarılacaq.` : 'Elanınız müddəti bitdikdə avtomatik olaraq yenilənməyəcək.'}`
          : `Автообновление будет отключено. ${shouldRefund ? `${renewalPrice} ${renewalPackage?.currency} будет возвращено на ваш баланс.` : 'Ваше объявление не будет автоматически продлеваться после истечения срока.'}`,
        [
          {
            text: language === 'az' ? 'Ləğv et' : 'Отмена',
            style: 'cancel',
          },
          {
            text: language === 'az' ? 'Dayandır' : 'Отключить',
            onPress: () => disableAutoRenewal(),
          },
        ]
      );
    }
  };

  const enableAutoRenewal = async () => {
    setIsLoading(true);
    try {
      // Deduct payment from balance
      const paymentSuccess = spendFromBalance(renewalPrice);
      if (!paymentSuccess) {
        Alert.alert(
          language === 'az' ? 'Ödəniş Xətası' : 'Ошибка Оплаты',
          language === 'az'
            ? 'Balansınızda kifayət qədər məbləğ yoxdur.'
            : 'На вашем балансе недостаточно средств.'
        );
        return;
      }

      // Calculate next renewal date with 3-day grace period
      const expirationDate = new Date(listing.expiresAt);
      const gracePeriodEnd = new Date(expirationDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days grace period
      const nextRenewalDate = new Date(gracePeriodEnd.getTime() + (renewalPackage?.duration || 0) * 24 * 60 * 60 * 1000);

      const updatedListing: Listing = {
        ...listing,
        autoRenewalEnabled: true,
        autoRenewalPackageId: selectedPackage,
        autoRenewalPrice: renewalPrice,
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        nextRenewalDate: nextRenewalDate.toISOString(),
        autoRenewalPaid: true,
        autoRenewalUsed: false,
        autoRenewalPaymentDate: new Date().toISOString(),
      };

      onUpdate(updatedListing);
      setAutoRenewalEnabled(true);

      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az'
          ? `Avtomatik yeniləmə aktivləşdirildi və ${renewalPrice} ${renewalPackage?.currency} balansınızdan çıxıldı. Elanınız müddəti bitdikdən sonra 3 günlük güzəşt müddəti olacaq, sonra avtomatik yeniləməyə davam edəcək.`
          : `Автообновление активировано и ${renewalPrice} ${renewalPackage?.currency} списано с баланса. После истечения срока у вашего объявления будет льготный период 3 дня, затем оно будет автоматически продлеваться.`
      );
    } catch {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az'
          ? 'Avtomatik yeniləmə aktivləşdirilərkən xəta baş verdi.'
          : 'Произошла ошибка при активации автообновления.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const disableAutoRenewal = async () => {
    setIsLoading(true);
    try {
      // Check if we should refund the payment based on grace period
      const now = new Date();
      const gracePeriodEnd = listing.gracePeriodEnd ? new Date(listing.gracePeriodEnd) : null;
      const shouldRefund = listing.autoRenewalPaid && !listing.autoRenewalUsed && gracePeriodEnd && now <= gracePeriodEnd;
      let refundMessage = '';
      
      if (shouldRefund && listing.autoRenewalPrice) {
        // Refund the payment
        addToWallet(listing.autoRenewalPrice);
        refundMessage = language === 'az'
          ? ` ${listing.autoRenewalPrice} ${renewalPackage?.currency} balansınıza geri qaytarıldı.`
          : ` ${listing.autoRenewalPrice} ${renewalPackage?.currency} возвращено на ваш баланс.`;
      }

      const updatedListing: Listing = {
        ...listing,
        autoRenewalEnabled: false,
        autoRenewalPackageId: undefined,
        autoRenewalPrice: undefined,
        nextRenewalDate: undefined,
        gracePeriodEnd: undefined,
        autoRenewalPaid: false,
        autoRenewalUsed: false,
        autoRenewalPaymentDate: undefined,
      };

      onUpdate(updatedListing);
      setAutoRenewalEnabled(false);

      Alert.alert(
        language === 'az' ? 'Dayandırıldı' : 'Отключено',
        language === 'az'
          ? `Avtomatik yeniləmə dayandırıldı.${refundMessage}`
          : `Автообновление отключено.${refundMessage}`
      );
    } catch {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az'
          ? 'Avtomatik yeniləmə dayandırılarkən xəta baş verdi.'
          : 'Произошла ошибка при отключении автообновления.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const daysLeft = getDaysUntilExpiration();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <RefreshCw size={24} color="#007AFF" />
        <Text style={styles.title}>
          {language === 'az' ? 'Avtomatik Yeniləmə' : 'Автообновление'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {language === 'az' ? 'Cari Status' : 'Текущий Статус'}
            </Text>
            <Text style={[styles.statusValue, { color: autoRenewalEnabled ? '#34C759' : '#FF3B30' }]}>
              {autoRenewalEnabled 
                ? (language === 'az' ? 'Aktiv' : 'Активно')
                : (language === 'az' ? 'Deaktiv' : 'Неактивно')
              }
            </Text>
          </View>
          <Switch
            value={autoRenewalEnabled}
            onValueChange={handleToggleAutoRenewal}
            disabled={isLoading}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor={autoRenewalEnabled ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        {autoRenewalEnabled && (
          <View style={styles.renewalInfo}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#8E8E93" />
              <Text style={styles.infoText}>
                {language === 'az' ? 'Növbəti yeniləmə: ' : 'Следующее продление: '}
                {listing.nextRenewalDate ? formatDate(listing.nextRenewalDate) : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <CreditCard size={16} color="#8E8E93" />
              <Text style={styles.infoText}>
                {language === 'az' ? 'Yeniləmə qiyməti: ' : 'Стоимость продления: '}
                {listing.autoRenewalPrice} {renewalPackage?.currency}
              </Text>
            </View>
            {listing.autoRenewalPaid && (
              <View style={styles.infoRow}>
                <CreditCard size={16} color="#34C759" />
                <Text style={[styles.infoText, { color: '#34C759' }]}>
                  {language === 'az' ? 'Ödəniş edilib' : 'Оплачено'}
                  {listing.autoRenewalPaymentDate && ` (${formatDate(listing.autoRenewalPaymentDate)})`}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.currentPackageCard}>
        <Text style={styles.cardTitle}>
          {language === 'az' ? 'Cari Tarif' : 'Текущий Тариф'}
        </Text>
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>
            {renewalPackage?.name?.[language as keyof typeof renewalPackage.name] || renewalPackage?.name?.az || 'N/A'}
          </Text>
          <Text style={styles.packagePrice}>
            {renewalPrice} {renewalPackage?.currency}
          </Text>
        </View>
        <View style={styles.expirationInfo}>
          <Text style={styles.expirationText}>
            {language === 'az' ? 'Bitmə tarixi: ' : 'Дата истечения: '}
            {formatDate(listing.expiresAt)}
          </Text>
          <Text style={[styles.daysLeft, { color: daysLeft <= 3 ? '#FF3B30' : '#8E8E93' }]}>
            {daysLeft > 0 
              ? `${daysLeft} ${language === 'az' ? 'gün qalıb' : 'дней осталось'}`
              : (language === 'az' ? 'Müddəti bitib' : 'Срок истек')
            }
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Bell size={20} color="#007AFF" />
          <Text style={styles.infoTitle}>
            {language === 'az' ? 'Avtomatik Yeniləmə Haqqında' : 'Об Автообновлении'}
          </Text>
        </View>
        <Text style={styles.infoDescription}>
          {language === 'az'
            ? 'Avtomatik yeniləmə aktivləşdirildikdə, dərhal ödəniş balansınızdan çıxılır və elanınız müddəti bitdikdən sonra 3 günlük güzəşt müddəti olacaq. Bu müddət ərzində elan aktiv qalacaq və sonra avtomatik olaraq eyni tariflə yeniləməyə davam edəcək. Avtomatik yeniləməni güzəşt müddəti ərzində dayandıraraq istifadə edilməmiş ödənişi geri ala bilərsiniz.'
            : 'При активации автообновления оплата сразу списывается с баланса, и после истечения срока у вашего объявления будет льготный период 3 дня. В течение этого периода объявление останется активным, а затем будет автоматически продлеваться по тому же тарифу. Вы можете отключить автообновление в течение льготного периода и вернуть неиспользованную оплату.'
          }
        </Text>
        <View style={styles.benefitsList}>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? '3 günlük güzəşt müddəti' : '3-дневный льготный период'}
          </Text>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? 'Elanınız heç vaxt müddəti bitməyəcək' : 'Ваше объявление никогда не истечет'}
          </Text>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? 'Manual yeniləmə ehtiyacı yoxdur' : 'Нет необходимости в ручном продлении'}
          </Text>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? 'Eyni qiymət və xüsusiyyətlər' : 'Та же цена и функции'}
          </Text>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? 'İstənilən vaxt dayandıra bilərsiniz' : 'Можно отключить в любое время'}
          </Text>
          <Text style={styles.benefitItem}>
            • {language === 'az' ? 'İstifadə edilməmiş ödəniş geri qaytarılır' : 'Неиспользованная оплата возвращается'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  renewalInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  currentPackageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  packageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  expirationInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  expirationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    paddingLeft: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 4,
  },
});