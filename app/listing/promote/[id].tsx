import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useListingStore } from '@/store/listingStore';
import { useUserStore } from '@/store/userStore';
import { promotionPackages, PromotionPackage, viewPackages, ViewPackage } from '@/constants/adPackages';
import Colors from '@/constants/colors';
import {
  ArrowLeft,
  Star,
  Crown,
  Zap,
  Check,
  Wallet,
  Calendar,
  TrendingUp,
  Eye,
  Target,
  Sparkles
} from 'lucide-react-native';
import CreativeEffectsSection, { CreativeEffect } from '@/components/CreativeEffectsSection';


export default function PromoteListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguageStore();
  const { listings, promoteListing, purchaseViews, applyCreativeEffects } = useListingStore();
  const { currentUser, walletBalance, bonusBalance, spendFromWallet, spendFromBonus } = useUserStore();
  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(null);
  const [selectedViewPackage, setSelectedViewPackage] = useState<ViewPackage | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<CreativeEffect[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'promotion' | 'views' | 'effects'>('promotion');

  
  const listing = listings.find(l => l.id === id);
  
  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: Colors.error || '#EF4444' }]}>
          {language === 'az' ? 'Elan tapılmadı' : 'Объявление не найдено'}
        </Text>
      </View>
    );
  }
  
  const handlePromote = async () => {
    if (!selectedPackage || !currentUser) return;
    
    const totalBalance = walletBalance + bonusBalance;
    if (totalBalance < selectedPackage.price) {
      Alert.alert(
        language === 'az' ? 'Kifayət qədər balans yoxdur' : 'Недостаточно средств',
        language === 'az' 
          ? `Bu paket üçün ${selectedPackage.price} AZN lazımdır. Balansınız: ${totalBalance} AZN`
          : `Для этого пакета требуется ${selectedPackage.price} AZN. Ваш баланс: ${totalBalance} AZN`
      );
      return;
    }
    
    // Check if listing expires before package duration
    const currentDate = new Date();
    const listingExpiryDate = new Date(listing.expiresAt);
    const daysUntilExpiry = Math.ceil((listingExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let confirmMessage = language === 'az'
      ? `${selectedPackage.name.az} paketini ${selectedPackage.price} AZN-ə almaq istədiyinizə əminsiniz?`
      : `Вы уверены, что хотите купить пакет ${selectedPackage.name.ru} за ${selectedPackage.price} AZN?`;
    
    if (daysUntilExpiry < selectedPackage.duration) {
      confirmMessage += language === 'az'
        ? `\n\n⚠️ Diqqət: Elanınızın bitməsinə ${daysUntilExpiry} gün qalır, lakin paket ${selectedPackage.duration} günlükdür. Paket elanınızın bitməsindən sonra ${selectedPackage.duration - daysUntilExpiry} gün əlavə müddətə qədər aktiv olacaq.`
        : `\n\n⚠️ Внимание: До истечения вашего объявления осталось ${daysUntilExpiry} дней, но пакет рассчитан на ${selectedPackage.duration} дней. Пакет будет активен еще ${selectedPackage.duration - daysUntilExpiry} дней после истечения объявления.`;
    }
    
    Alert.alert(
      language === 'az' ? 'Təsdiq edin' : 'Подтвердите',
      confirmMessage,
      [
        {
          text: language === 'az' ? 'Ləğv et' : 'Отмена',
          style: 'cancel'
        },
        {
          text: language === 'az' ? 'Təsdiq et' : 'Подтвердить',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Deduct balance (try bonus first, then wallet)
              let remainingAmount = selectedPackage.price;
              if (bonusBalance > 0) {
                const bonusToSpend = Math.min(bonusBalance, remainingAmount);
                spendFromBonus(bonusToSpend);
                remainingAmount -= bonusToSpend;
              }
              if (remainingAmount > 0) {
                spendFromWallet(remainingAmount);
              }
              
              // Calculate effective promotion end date
              const promotionEndDate = new Date(Math.max(
                listingExpiryDate.getTime(),
                currentDate.getTime() + (selectedPackage.duration * 24 * 60 * 60 * 1000)
              ));
              
              // Promote listing with extended duration if needed
              await promoteListing(listing.id, selectedPackage.type, selectedPackage.duration);
              
              let successMessage = language === 'az'
                ? `Elanınız ${selectedPackage.name.az} paketi ilə təşviq edildi!`
                : `Ваше объявление продвинуто с пакетом ${selectedPackage.name.ru}!`;
              
              if (daysUntilExpiry < selectedPackage.duration) {
                successMessage += language === 'az'
                  ? `\n\nPaket ${promotionEndDate.toLocaleDateString('az-AZ')} tarixinə qədər aktiv olacaq.`
                  : `\n\nПакет будет активен до ${promotionEndDate.toLocaleDateString('ru-RU')}.`;
              }
              
              Alert.alert(
                language === 'az' ? 'Uğurlu!' : 'Успешно!',
                successMessage,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch {
              Alert.alert(
                language === 'az' ? 'Xəta' : 'Ошибка',
                language === 'az' ? 'Təşviq zamanı xəta baş verdi' : 'Произошла ошибка при продвижении'
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };
  
  const handleSelectEffect = (effect: CreativeEffect) => {
    setSelectedEffects(prev => {
      const isSelected = prev.some(selected => selected.id === effect.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== effect.id);
      } else {
        return [...prev, effect];
      }
    });
  };
  
  const handlePurchaseEffects = async () => {
    if (selectedEffects.length === 0 || !currentUser) return;
    
    const totalPrice = selectedEffects.reduce((sum, effect) => sum + effect.price, 0);
    const totalBalance = walletBalance + bonusBalance;
    
    if (totalBalance < totalPrice) {
      Alert.alert(
        language === 'az' ? 'Kifayət qədər balans yoxdur' : 'Недостаточно средств',
        language === 'az' 
          ? `Bu effektlər üçün ${totalPrice} AZN lazımdır. Balansınız: ${totalBalance} AZN`
          : `Для этих эффектов требуется ${totalPrice} AZN. Ваш баланс: ${totalBalance} AZN`
      );
      return;
    }
    
    // Check if any effect duration exceeds listing expiry
    const currentDate = new Date();
    const listingExpiryDate = new Date(listing.expiresAt);
    const daysUntilExpiry = Math.ceil((listingExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const longestEffect = selectedEffects.reduce((longest, effect) => 
      effect.duration > longest.duration ? effect : longest
    );
    
    let confirmMessage = language === 'az'
      ? `Seçilmiş kreativ effektləri ${totalPrice} AZN-ə almaq istədiyinizə əminsiniz?`
      : `Вы уверены, что хотите купить выбранные креативные эффекты за ${totalPrice} AZN?`;
    
    if (daysUntilExpiry < longestEffect.duration) {
      confirmMessage += language === 'az'
        ? `\n\n⚠️ Diqqət: Elanınızın bitməsinə ${daysUntilExpiry} gün qalır, lakin "${longestEffect.name.az}" effekti ${longestEffect.duration} günlükdür. Effekt elanınızın bitməsindən sonra ${longestEffect.duration - daysUntilExpiry} gün əlavə müddətə qədər aktiv olacaq və yeni elanlarınızda istifadə edilə bilər.`
        : `\n\n⚠️ Внимание: До истечения вашего объявления осталось ${daysUntilExpiry} дней, но эффект "${longestEffect.name.ru}" рассчитан на ${longestEffect.duration} дней. Эффект будет активен еще ${longestEffect.duration - daysUntilExpiry} дней после истечения объявления и может быть использован для новых объявлений.`;
    }
    
    Alert.alert(
      language === 'az' ? 'Təsdiq edin' : 'Подтвердите',
      confirmMessage,
      [
        {
          text: language === 'az' ? 'Ləğv et' : 'Отмена',
          style: 'cancel'
        },
        {
          text: language === 'az' ? 'Təsdiq et' : 'Подтвердить',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Deduct balance (try bonus first, then wallet)
              let remainingAmount = totalPrice;
              if (bonusBalance > 0) {
                const bonusToSpend = Math.min(bonusBalance, remainingAmount);
                spendFromBonus(bonusToSpend);
                remainingAmount -= bonusToSpend;
              }
              if (remainingAmount > 0) {
                spendFromWallet(remainingAmount);
              }
              
              // Calculate effect end dates
              const effectEndDates = selectedEffects.map(effect => {
                const effectEndDate = new Date(Math.max(
                  listingExpiryDate.getTime(),
                  currentDate.getTime() + (effect.duration * 24 * 60 * 60 * 1000)
                ));
                return { effect, endDate: effectEndDate };
              });
              
              // Apply creative effects to the listing
              await applyCreativeEffects(listing.id, selectedEffects, effectEndDates);
              
              let successMessage = language === 'az'
                ? `Kreativ effektlər elanınıza tətbiq edildi!`
                : `Креативные эффекты применены к вашему объявлению!`;
              
              if (daysUntilExpiry < longestEffect.duration) {
                const latestEndDate = effectEndDates.reduce((latest, item) => 
                  item.endDate > latest ? item.endDate : latest
                , effectEndDates[0].endDate);
                
                successMessage += language === 'az'
                  ? `\n\nEffektlər ${latestEndDate.toLocaleDateString('az-AZ')} tarixinə qədər aktiv olacaq.`
                  : `\n\nЭффекты будут активны до ${latestEndDate.toLocaleDateString('ru-RU')}.`;
              }
              
              Alert.alert(
                language === 'az' ? 'Uğurlu!' : 'Успешно!',
                successMessage,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch {
              Alert.alert(
                language === 'az' ? 'Xəta' : 'Ошибка',
                language === 'az' ? 'Effekt tətbiqi zamanı xəta baş verdi' : 'Произошла ошибка при применении эффектов'
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };
  
  const handlePurchaseViews = async () => {
    if (!selectedViewPackage || !currentUser) return;
    
    const totalBalance = walletBalance + bonusBalance;
    if (totalBalance < selectedViewPackage.price) {
      Alert.alert(
        language === 'az' ? 'Kifayət qədər balans yoxdur' : 'Недостаточно средств',
        language === 'az' 
          ? `Bu paket üçün ${selectedViewPackage.price} AZN lazımdır. Balansınız: ${totalBalance} AZN`
          : `Для этого пакета требуется ${selectedViewPackage.price} AZN. Ваш баланс: ${totalBalance} AZN`
      );
      return;
    }
    
    // Check if listing will expire before all views are consumed
    const currentDate = new Date();
    const listingExpiryDate = new Date(listing.expiresAt);
    const daysUntilExpiry = Math.ceil((listingExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const targetViews = listing.views + selectedViewPackage.views;
    
    // Estimate daily views (assume average 10-50 views per day based on listing activity)
    const estimatedDailyViews = Math.max(10, Math.min(50, listing.views / Math.max(1, Math.ceil((currentDate.getTime() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)))));
    const estimatedDaysToReachTarget = Math.ceil(selectedViewPackage.views / estimatedDailyViews);
    
    let confirmMessage = language === 'az'
      ? `${selectedViewPackage.name.az} paketini ${selectedViewPackage.price} AZN-ə almaq istədiyinizə əminsiniz?\n\n📊 Elanınız ${targetViews} baxışa çatana qədər ön sıralarda qalacaq.`
      : `Вы уверены, что хотите купить пакет ${selectedViewPackage.name.ru} за ${selectedViewPackage.price} AZN?\n\n📊 Ваше объявление останется в топе до достижения ${targetViews} просмотров.`;
    
    if (estimatedDaysToReachTarget > daysUntilExpiry) {
      const unusedViews = Math.ceil(selectedViewPackage.views * (1 - daysUntilExpiry / estimatedDaysToReachTarget));
      confirmMessage += language === 'az'
        ? `\n\n⚠️ DİQQƏT: Elanınızın müddəti ${daysUntilExpiry} gündə bitəcək, lakin təxminən ${estimatedDaysToReachTarget} gün lazımdır ki, bütün baxışlar toplanılsın.\n\n💡 Elan müddəti bitəndə təxminən ${unusedViews} baxış istifadə olunmayacaq, lakin siz yenidən elan yerləşdirəndə bu baxışlar avtomatik olaraq yeni elanınıza tətbiq olunacaq.\n\n🔄 Alternativ: Əvvəlcə elanın müddətini uzadın, sonra baxış alın.`
        : `\n\n⚠️ ВНИМАНИЕ: Ваше объявление истечет через ${daysUntilExpiry} дней, но потребуется примерно ${estimatedDaysToReachTarget} дней для набора всех просмотров.\n\n💡 Когда объявление истечет, примерно ${unusedViews} просмотров останутся неиспользованными, но они автоматически применятся к вашему новому объявлению при повторном размещении.\n\n🔄 Альтернатива: Сначала продлите объявление, затем покупайте просмотры.`;
    }
    
    Alert.alert(
      language === 'az' ? 'Təsdiq edin' : 'Подтвердите',
      confirmMessage,
      [
        {
          text: language === 'az' ? 'Ləğv et' : 'Отмена',
          style: 'cancel'
        },
        {
          text: language === 'az' ? 'Təsdiq et' : 'Подтвердить',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Deduct balance (try bonus first, then wallet)
              let remainingAmount = selectedViewPackage.price;
              if (bonusBalance > 0) {
                const bonusToSpend = Math.min(bonusBalance, remainingAmount);
                spendFromBonus(bonusToSpend);
                remainingAmount -= bonusToSpend;
              }
              if (remainingAmount > 0) {
                spendFromWallet(remainingAmount);
              }
              
              // Purchase views for the listing
              await purchaseViews(listing.id, selectedViewPackage.views);
              
              let successMessage = language === 'az'
                ? `Elanınız ${selectedViewPackage.views} əlavə baxış aldı və ön sıralara keçdi!\n\n🎯 Elanınız ${targetViews} baxışa çatana qədər ön sıralarda qalacaq.`
                : `Ваше объявление получило ${selectedViewPackage.views} дополнительных просмотров и попало в топ!\n\n🎯 Ваше объявление останется в топе до достижения ${targetViews} просмотров.`;
              
              if (estimatedDaysToReachTarget > daysUntilExpiry) {
                successMessage += language === 'az'
                  ? `\n\n💡 Elan müddəti bitəndə istifadə olunmayan baxışlar yeni elanlarınızda avtomatik tətbiq olunacaq.`
                  : `\n\n💡 Неиспользованные просмотры автоматически применятся к новым объявлениям после истечения текущего.`;
              }
              
              Alert.alert(
                language === 'az' ? 'Uğurlu!' : 'Успешно!',
                successMessage,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch {
              Alert.alert(
                language === 'az' ? 'Xəta' : 'Ошибка',
                language === 'az' ? 'Baxış alışı zamanı xəta baş verdi' : 'Произошла ошибка при покупке просмотров'
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };
  
  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'featured':
        return <Star size={24} color={Colors.warning} />;
      case 'premium':
        return <Zap size={24} color={Colors.primary || '#0E7490'} />;
      case 'vip':
        return <Crown size={24} color="#FFD700" />;
      default:
        return <TrendingUp size={24} color={Colors.primary || '#0E7490'} />;
    }
  };
  
  const getPackageColor = (type: string) => {
    switch (type) {
      case 'featured':
        return Colors.warning;
      case 'premium':
        return Colors.primary || '#0E7490';
      case 'vip':
        return '#FFD700';
      default:
        return Colors.primary || '#0E7490';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text || '#1F2937'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'az' ? 'Elanı Təşviq Et' : 'Продвинуть объявление'}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Listing Preview */}
        <View style={styles.listingPreview}>
          <Image 
            source={{ uri: listing.images[0] || 'https://via.placeholder.com/100' }}
            style={styles.listingImage}
          />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle}>
              {listing.title[language as keyof typeof listing.title]}
            </Text>
            <Text style={styles.listingPrice}>
              {listing.price} {listing.currency}
            </Text>
            <Text style={styles.listingLocation}>
              {listing.location[language as keyof typeof listing.location]}
            </Text>
            <View style={styles.expiryInfo}>
              <Calendar size={14} color={Colors.warning || '#F59E0B'} />
              <Text style={styles.expiryText}>
                {language === 'az' 
                  ? `Bitir: ${new Date(listing.expiresAt).toLocaleDateString('az-AZ')}`
                  : `Истекает: ${new Date(listing.expiresAt).toLocaleDateString('ru-RU')}`
                }
              </Text>
              <Text style={styles.daysLeft}>
                ({Math.ceil((new Date(listing.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} {language === 'az' ? 'gün qalır' : 'дней осталось'})
              </Text>
            </View>
          </View>
        </View>
        
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Wallet size={20} color={Colors.primary || '#0E7490'} />
            <Text style={styles.balanceTitle}>
              {language === 'az' ? 'Cari Balans' : 'Текущий баланс'}
            </Text>
          </View>
          <Text style={styles.balanceAmount}>
            {walletBalance + bonusBalance} AZN
          </Text>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'promotion' && styles.activeTab]}
            onPress={() => setActiveTab('promotion')}
          >
            <TrendingUp size={20} color={activeTab === 'promotion' ? Colors.primary || '#0E7490' : Colors.textSecondary || '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'promotion' && styles.activeTabText]}>
              {language === 'az' ? 'Təşviq' : 'Продвижение'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'views' && styles.activeTab]}
            onPress={() => setActiveTab('views')}
          >
            <Eye size={20} color={activeTab === 'views' ? Colors.primary || '#0E7490' : Colors.textSecondary || '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'views' && styles.activeTabText]}>
              {language === 'az' ? 'Baxış Al' : 'Купить просмотры'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'effects' && styles.activeTab]}
            onPress={() => setActiveTab('effects')}
          >
            <Sparkles size={20} color={activeTab === 'effects' ? Colors.primary || '#0E7490' : Colors.textSecondary || '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'effects' && styles.activeTabText]}>
              {language === 'az' ? 'Effektlər' : 'Эффекты'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'promotion' ? (
          /* Promotion Packages */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'az' ? 'Təşviq Paketləri' : 'Пакеты продвижения'}
            </Text>
            <Text style={styles.sectionDescription}>
              {language === 'az'
                ? 'Elanınızın görünürlüyünü artırmaq üçün uyğun paketi seçin'
                : 'Выберите подходящий пакет для увеличения видимости вашего объявления'
              }
            </Text>
            
            {promotionPackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              const packageColor = getPackageColor(pkg.type);
              
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    isSelected && { borderColor: packageColor, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <View style={styles.packageHeader}>
                    <View style={styles.packageIcon}>
                      {getPackageIcon(pkg.type)}
                    </View>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageName}>
                        {pkg.name[language as keyof typeof pkg.name]}
                      </Text>
                      <Text style={styles.packagePrice}>
                        {pkg.price} {pkg.currency}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: packageColor }]}>
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.packageDescription}>
                    {pkg.description[language as keyof typeof pkg.description]}
                  </Text>
                  
                  <View style={styles.packageFeatures}>
                    <View style={styles.feature}>
                      <Calendar size={16} color={Colors.textSecondary || '#6B7280'} />
                      <Text style={styles.featureText}>
                        {pkg.duration} {language === 'az' ? 'gün' : 'дней'}
                      </Text>
                    </View>
                    <View style={styles.feature}>
                      <TrendingUp size={16} color={Colors.textSecondary || '#6B7280'} />
                      <Text style={styles.featureText}>
                        {language === 'az' ? 'Artırılmış görünürlük' : 'Повышенная видимость'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : activeTab === 'views' ? (
          /* View Packages */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'az' ? 'Baxış Paketləri' : 'Пакеты просмотров'}
            </Text>
            <View style={styles.viewExplanationCard}>
              <Text style={styles.sectionDescription}>
                {language === 'az'
                  ? '👀 Elanınızı daha çox insana göstərin! Hər baxış yeni bir fürsətdir - alıcılar sizi tapacaq!'
                  : '👀 Покажите ваше объявление большему количеству людей! Каждый просмотр - новая возможность - покупатели найдут вас!'
                }
              </Text>
              
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>
                  {language === 'az' ? '🎯 Baxış alma necə işləyir?' : '🎯 Как работает покупка просмотров?'}
                </Text>
                <Text style={styles.explanationText}>
                  {language === 'az'
                    ? `• Hazırda elanınızın ${listing.views} baxışı var\n• Baxış aldıqdan sonra elanınız dərhal ön sıralara keçəcək\n• Elanınız ${listing.views} + alınan baxış sayına çatana qədər ön sıralarda qalacaq\n• Məsələn 100 baxış alsanız, ${listing.views + 100} baxışa çatana qədər ön sıralarda olacaq\n• Bu müddətdə elanınız daha çox görünəcək və daha çox müştəri cəlb edəcək`
                    : `• Сейчас у вашего объявления ${listing.views} просмотров\n• После покупки просмотров ваше объявление сразу попадет в топ\n• Ваше объявление останется в топе до достижения ${listing.views} + купленных просмотров\n• Например, если купите 100 просмотров, будет в топе до ${listing.views + 100} просмотров\n• В этот период ваше объявление будет более заметным и привлечет больше клиентов`
                  }
                </Text>
              </View>
            </View>
            
            {viewPackages.map((pkg) => {
              const isSelected = selectedViewPackage?.id === pkg.id;
              
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    isSelected && { borderColor: Colors.primary || '#0E7490', borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedViewPackage(pkg)}
                >
                  <View style={styles.packageHeader}>
                    <View style={[styles.packageIcon, { backgroundColor: 'rgba(14, 116, 144, 0.1)' }]}>
                      <Eye size={24} color={Colors.primary || '#0E7490'} />
                    </View>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageName}>
                        {pkg.name[language as keyof typeof pkg.name]}
                      </Text>
                      <Text style={styles.packagePrice}>
                        {pkg.price} {pkg.currency}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: Colors.primary || '#0E7490' }]}>
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.packageDescription}>
                    {pkg.description[language as keyof typeof pkg.description]}
                  </Text>
                  
                  <View style={styles.packageFeatures}>
                    <View style={styles.feature}>
                      <Target size={16} color={Colors.textSecondary || '#6B7280'} />
                      <Text style={styles.featureText}>
                        {pkg.views} {language === 'az' ? 'baxış' : 'просмотров'}
                      </Text>
                    </View>
                    <View style={styles.feature}>
                      <Eye size={16} color={Colors.textSecondary || '#6B7280'} />
                      <Text style={styles.featureText}>
                        {pkg.pricePerView.toFixed(3)} AZN / {language === 'az' ? 'baxış' : 'просмотр'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Creative Effects */
          <View style={styles.section}>
            <CreativeEffectsSection
              onSelectEffect={handleSelectEffect}
              selectedEffects={selectedEffects}
              title={language === 'az' ? 'Elan üçün Kreativ Effektlər' : 'Креативные Эффекты для Объявления'}
            />

          </View>
        )}
      </ScrollView>
      
      {/* Action Button */}
      {((activeTab === 'promotion' && !!selectedPackage) ||
        (activeTab === 'views' && !!selectedViewPackage) ||
        (activeTab === 'effects' && selectedEffects.length > 0)) && (
        <View style={styles.footer}>
          <TouchableOpacity
            testID="action-buy-button"
            style={[
              styles.promoteButton,
              (() => {
                const required = activeTab === 'promotion'
                  ? (selectedPackage?.price ?? 0)
                  : activeTab === 'views'
                    ? (selectedViewPackage?.price ?? 0)
                    : selectedEffects.length > 0
                      ? selectedEffects.reduce((sum, effect) => sum + effect.price, 0)
                      : 0;
                return (!currentUser || (walletBalance + bonusBalance) < required || isProcessing) && styles.disabledButton;
              })()
            ]}
            onPress={activeTab === 'promotion' ? handlePromote : activeTab === 'views' ? handlePurchaseViews : handlePurchaseEffects}
            disabled={(() => {
              const required = activeTab === 'promotion'
                ? (selectedPackage?.price ?? 0)
                : activeTab === 'views'
                  ? (selectedViewPackage?.price ?? 0)
                  : selectedEffects.length > 0
                    ? selectedEffects.reduce((sum, effect) => sum + effect.price, 0)
                    : 0;
              return !currentUser || (walletBalance + bonusBalance) < required || isProcessing;
            })()}
          >
            <Text style={styles.promoteButtonText}>
              {isProcessing
                ? (language === 'az' ? 'Emal edilir...' : 'Обработка...')
                : activeTab === 'promotion'
                  ? `${language === 'az' ? 'Təşviq Et' : 'Продвинуть'} - ${(selectedPackage?.price ?? 0)} AZN`
                  : activeTab === 'views'
                    ? `${language === 'az' ? 'Baxış Al' : 'Купить просмотры'} - ${(selectedViewPackage?.price ?? 0)} AZN`
                    : `${language === 'az' ? 'Effektlər Al' : 'Купить эффекты'} - ${selectedEffects.length > 0 ? selectedEffects.reduce((sum, effect) => sum + effect.price, 0) : 0} AZN`
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text || '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listingPreview: {
    flexDirection: 'row',
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text || '#1F2937',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: Colors.textSecondary || '#6B7280',
    marginBottom: 8,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.warning || '#F59E0B',
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: 12,
    color: Colors.textSecondary || '#6B7280',
  },
  balanceCard: {
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text || '#1F2937',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text || '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary || '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewExplanationCard: {
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  explanationBox: {
    backgroundColor: 'rgba(14, 116, 144, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary || '#0E7490',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.text || '#1F2937',
    lineHeight: 18,
  },
  packageCard: {
    backgroundColor: Colors.card || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border || '#E5E7EB',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text || '#1F2937',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary || '#0E7490',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageDescription: {
    fontSize: 14,
    color: Colors.textSecondary || '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  packageFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: Colors.textSecondary || '#6B7280',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.card || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#E5E7EB',
  },
  promoteButton: {
    backgroundColor: Colors.primary || '#0E7490',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.textSecondary || '#6B7280',
    opacity: 0.6,
  },
  promoteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    fontSize: 16,
    color: Colors.error || '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card || '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary || '#0E7490' + '20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary || '#6B7280',
  },
  activeTabText: {
    color: Colors.primary || '#0E7490',
    fontWeight: '600',
  },

});