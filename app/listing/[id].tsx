import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import UserActionModal from '@/components/UserActionModal';
import UserAnalytics from '@/components/UserAnalytics';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { useListingStore } from '@/store/listingStore';
import { useCallStore } from '@/store/callStore';
import { useDiscountStore } from '@/store/discountStore';
import { listings } from '@/mocks/listings';
import { users } from '@/mocks/users';
import { categories } from '@/constants/categories';
import Colors from '@/constants/colors';
import { Heart, Share, ChevronLeft, ChevronRight, MapPin, Calendar, Eye, Phone, MessageCircle, Clock, X, MoreVertical, Tag, Percent } from 'lucide-react-native';
import { SocialIcons } from '@/components/Icons';
import CountdownTimer from '@/components/CountdownTimer';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguageStore();
  const { favorites, toggleFavorite, isAuthenticated } = useUserStore();
  const { incrementViewCount } = useListingStore();
  const { initiateCall } = useCallStore();
  const { getActiveDiscounts } = useDiscountStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showUserActionModal, setShowUserActionModal] = useState(false);
  
  const listing = listings.find(item => item.id === id);
  
  // Get active discounts for this listing
  const activeDiscounts = listing?.storeId ? getActiveDiscounts(listing.storeId).filter(discount => 
    discount.applicableListings.includes(listing.id)
  ) : [];
  
  // Calculate discounted price - using same logic as ListingCard
  const calculateDiscountedPrice = () => {
    if (!listing) return null;
    
    let originalPrice = listing.originalPrice ?? listing.price;
    let discountedPrice = listing.price;
    let discountPercentage = 0;
    let discountType: 'percentage' | 'fixed_amount' = 'percentage';
    let discountValue = 0;

    console.log(`[ListingDetail] Calculating discount for listing ${listing.id}:`, {
      activeDiscounts: activeDiscounts.length,
      hasDiscount: listing.hasDiscount,
      originalPrice,
      currentPrice: listing.price,
      discountPercentage: listing.discountPercentage
    });

    // Check for active store/campaign discounts first
    if (activeDiscounts.length > 0) {
      const discount = activeDiscounts[0];
      discountType = discount.type === 'buy_x_get_y' ? 'percentage' : discount.type as 'percentage' | 'fixed_amount';
      discountValue = discount.value;

      console.log(`[ListingDetail] Applying store discount:`, {
        type: discount.type,
        value: discount.value,
        originalPrice
      });

      if (discount.type === 'percentage' || discount.type === 'buy_x_get_y') {
        discountPercentage = discount.value;
        discountedPrice = originalPrice * (1 - discount.value / 100);
      } else if (discount.type === 'fixed_amount') {
        discountedPrice = Math.max(0, originalPrice - discount.value);
        discountPercentage = originalPrice > 0 ? ((originalPrice - discountedPrice) / originalPrice) * 100 : 0;
        discountValue = Math.min(discount.value, originalPrice);
      }
    }
    // Listing-level discount handling
    else if (listing.hasDiscount) {
      // Check if we have a stored discount percentage that's reasonable (not a tiny decimal)
      if (typeof listing.discountPercentage === 'number' && listing.discountPercentage >= 1) {
        // This is a percentage discount
        discountPercentage = listing.discountPercentage;
        discountType = 'percentage';
        discountValue = listing.discountPercentage;
        if (listing.originalPrice) {
          originalPrice = listing.originalPrice;
          discountedPrice = originalPrice * (1 - listing.discountPercentage / 100);
        } else {
          originalPrice = listing.price / (1 - listing.discountPercentage / 100);
          discountedPrice = listing.price;
        }
      } else if (typeof listing.originalPrice === 'number' && listing.originalPrice > listing.price) {
        // This is a fixed amount discount - derive from price difference
        discountType = 'fixed_amount';
        discountValue = Math.max(0, Math.round(listing.originalPrice - listing.price));
        originalPrice = listing.originalPrice;
        discountedPrice = listing.price;
        discountPercentage = originalPrice > 0 ? ((originalPrice - discountedPrice) / originalPrice) * 100 : 0;
        console.log('[ListingDetail] Derived fixed-amount listing discount', { discountValue, originalPrice, discountedPrice });
      } else if (typeof listing.discountPercentage === 'number' && listing.discountPercentage < 1 && listing.discountPercentage > 0) {
        // This looks like a calculated percentage from a fixed amount discount
        // Try to derive the original fixed amount
        if (listing.originalPrice && listing.originalPrice > listing.price) {
          discountType = 'fixed_amount';
          discountValue = Math.round(listing.originalPrice - listing.price);
          originalPrice = listing.originalPrice;
          discountedPrice = listing.price;
          discountPercentage = listing.discountPercentage;
          console.log('[ListingDetail] Detected fixed-amount from small percentage', { discountValue, originalPrice, discountedPrice });
        } else {
          // Fallback to percentage
          discountPercentage = listing.discountPercentage;
          discountType = 'percentage';
          discountValue = listing.discountPercentage;
        }
      }
    }

    const absoluteSavings = Math.max(0, originalPrice - discountedPrice);

    if (absoluteSavings < 1) {
      return null; // No meaningful discount
    }

    const result = {
      discountedPrice: Math.round(discountedPrice),
      originalPrice: Math.round(originalPrice),
      discountPercentage,
      discountType,
      discountValue: Math.round(discountValue),
      absoluteSavings: Math.round(absoluteSavings),
      discount: { type: discountType, value: discountValue }
    } as const;

    console.log(`[ListingDetail] Final discount calculation:`, result);

    return result;
  };
  
  const priceInfo = listing ? calculateDiscountedPrice() : null;
  
  // Increment view count when listing is viewed
  useEffect(() => {
    if (listing && id) {
      incrementViewCount(id);
    }
  }, [id, incrementViewCount]);
  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>
          {language === 'az' ? 'Elan tapılmadı' : 'Объявление не найдено'}
        </Text>
      </View>
    );
  }
  
  const seller = users.find(user => user.id === listing.userId);
  const isFavorite = favorites.includes(listing.id);
  
  const category = categories.find(c => c.id === listing.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === listing.subcategoryId);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };
  
  const handleNextImage = () => {
    if (currentImageIndex < listing.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };
  
  const handleFavoriteToggle = () => {
    toggleFavorite(listing.id);
  };
  
  const handleShare = () => {
    setShareModalVisible(true);
  };

  const generateShareText = () => {
    const baseUrl = 'https://yourapp.com/listing';
    const shareUrl = `${baseUrl}/${listing.id}`;
    
    // Use discounted price if available, otherwise use regular price
    const displayPrice = priceInfo && priceInfo.absoluteSavings >= 1 
      ? `${priceInfo.discountedPrice} ${listing.currency} (${language === 'az' ? 'Endirimli qiymət' : 'Цена со скидкой'})`
      : `${listing.price} ${listing.currency}`;
    
    return language === 'az' 
      ? `${listing.title[language]}\n\n${displayPrice}\n${listing.location[language]}\n\n${shareUrl}`
      : `${listing.title[language]}\n\n${displayPrice}\n${listing.location[language]}\n\n${shareUrl}`;
  };

  const shareToSocialMedia = async (platform: string) => {
    const shareText = generateShareText();
    const encodedText = encodeURIComponent(shareText);
    const baseUrl = 'https://yourapp.com/listing';
    const shareUrl = `${baseUrl}/${listing.id}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let url = '';
    
    switch (platform) {
      case 'whatsapp':
        url = `whatsapp://send?text=${encodedText}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        if (Platform.OS === 'web') {
          navigator.clipboard.writeText(shareText);
          Alert.alert(
            language === 'az' ? 'Kopyalandı' : 'Скопировано',
            language === 'az' ? 'Mətn panoya kopyalandı. Instagram-da paylaşa bilərsiniz.' : 'Текст скопирован в буфер. Можете поделиться в Instagram.'
          );
        } else {
          Alert.alert(
            'Instagram',
            language === 'az' ? 'Instagram tətbiqini açın və məzmunu paylaşın' : 'Откройте приложение Instagram и поделитесь контентом'
          );
        }
        setShareModalVisible(false);
        return;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'vk':
        url = `https://vk.com/share.php?url=${encodedUrl}&title=${encodeURIComponent(listing.title[language])}&description=${encodeURIComponent(listing.description[language])}`;
        break;
      case 'ok':
        url = `https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodeURIComponent(listing.title[language])}&description=${encodeURIComponent(listing.description[language])}`;
        break;
      case 'tiktok':
        // TikTok doesn't support direct URL sharing
        Alert.alert(
          'TikTok',
          language === 'az' ? 'TikTok tətbiqini açın və məzmunu paylaşın' : 'Откройте приложение TikTok и поделитесь контентом'
        );
        setShareModalVisible(false);
        return;
      case 'native':
        // Use native sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(shareUrl, {
            dialogTitle: language === 'az' ? 'Elanı paylaş' : 'Поделиться объявлением',
          });
        } else {
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Paylaşma funksiyası mövcud deyil' : 'Функция обмена недоступна'
          );
        }
        setShareModalVisible(false);
        return;
      case 'copy':
        if (Platform.OS === 'web') {
          navigator.clipboard.writeText(shareText);
        }
        Alert.alert(
          language === 'az' ? 'Kopyalandı' : 'Скопировано',
          language === 'az' ? 'Link panoya kopyalandı' : 'Ссылка скопирована в буфер'
        );
        setShareModalVisible(false);
        return;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Paylaşma zamanı xəta baş verdi' : 'Произошла ошибка при попытке поделиться'
      );
    }
    
    setShareModalVisible(false);
  };

  const ShareModal = () => {
    const socialPlatforms = [
      { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', iconComponent: SocialIcons.WhatsApp },
      { id: 'facebook', name: 'Facebook', color: '#1877F2', iconComponent: SocialIcons.Facebook },
      { id: 'instagram', name: 'Instagram', color: '#E4405F', iconComponent: SocialIcons.Instagram },
      { id: 'telegram', name: 'Telegram', color: '#0088CC', iconComponent: SocialIcons.Telegram },
      { id: 'twitter', name: 'Twitter', color: '#1DA1F2', iconComponent: SocialIcons.Twitter },
      { id: 'vk', name: 'VKontakte', color: '#4C75A3', iconComponent: SocialIcons.VKontakte },
      { id: 'ok', name: 'Odnoklassniki', color: '#EE8208', iconComponent: SocialIcons.Odnoklassniki },
      { id: 'tiktok', name: 'TikTok', color: '#000000', iconComponent: SocialIcons.TikTok },
      { id: 'native', name: language === 'az' ? 'Digər' : 'Другие', color: Colors.primary, iconComponent: SocialIcons.Share },
      { id: 'copy', name: language === 'az' ? 'Linki kopyala' : 'Копировать ссылку', color: Colors.textSecondary, iconComponent: SocialIcons.Copy },
    ];

    return (
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModal}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareTitle}>
                {language === 'az' ? 'Paylaş' : 'Поделиться'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShareModalVisible(false)}
              >
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.shareOptions}>
              <View style={styles.shareGrid}>
                {socialPlatforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    style={styles.shareOption}
                    onPress={() => shareToSocialMedia(platform.id)}
                  >
                    <View style={[styles.shareIconContainer, { backgroundColor: platform.color }]}>
                      <platform.iconComponent size={24} color="white" />
                    </View>
                    <Text style={styles.sharePlatformName}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  const handleContact = () => {
    if (!isAuthenticated) {
      Alert.alert(
        language === 'az' ? 'Giriş tələb olunur' : 'Требуется вход',
        language === 'az' 
          ? 'Satıcı ilə əlaqə saxlamaq üçün hesabınıza daxil olmalısınız' 
          : 'Для связи с продавцом необходимо войти в аккаунт',
        [
          {
            text: language === 'az' ? 'Ləğv et' : 'Отмена',
            style: 'cancel',
          },
          {
            text: language === 'az' ? 'Daxil ol' : 'Войти',
            onPress: () => router.push('/auth/login'),
          },
        ]
      );
      return;
    }
    
    // Check if seller has hidden phone number
    if (seller?.privacySettings.hidePhoneNumber) {
      Alert.alert(
        language === 'az' ? 'Telefon nömrəsi gizlədilmiş' : 'Номер телефона скрыт',
        language === 'az' 
          ? 'Bu istifadəçi telefon nömrəsini gizlədib. Tətbiq üzərindən əlaqə saxlaya bilərsiniz.'
          : 'Этот пользователь скрыл номер телефона. Вы можете связаться через приложение.',
        [
          {
            text: language === 'az' ? 'Səsli zəng' : 'Голосовой звонок',
            onPress: async () => {
              try {
                const callId = await initiateCall(seller.id, listing.id, 'voice');
                router.push(`/call/${callId}`);
              } catch (error) {
                console.error('Failed to initiate call:', error);
              }
            },
          },
          {
            text: language === 'az' ? 'Video zəng' : 'Видеозвонок',
            onPress: async () => {
              try {
                const callId = await initiateCall(seller.id, listing.id, 'video');
                router.push(`/call/${callId}`);
              } catch (error) {
                console.error('Failed to initiate video call:', error);
              }
            },
          },
          {
            text: language === 'az' ? 'Ləğv et' : 'Отмена',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    
    Alert.alert(
      language === 'az' ? 'Əlaqə' : 'Контакт',
      seller?.phone || '',
      [
        {
          text: language === 'az' ? 'Zəng et' : 'Позвонить',
          onPress: () => {
            if (seller?.phone) {
              Linking.openURL(`tel:${seller.phone}`);
            }
          },
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            if (seller?.phone) {
              const phoneNumber = seller.phone.replace(/[^0-9]/g, '');
              const message = encodeURIComponent(
                language === 'az' 
                  ? `Salam! "${listing.title[language]}" elanınızla maraqlanıram.`
                  : `Здравствуйте! Меня интересует ваше объявление "${listing.title[language]}".`
              );
              Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${message}`);
            }
          },
        },
        {
          text: language === 'az' ? 'Ləğv et' : 'Отмена',
          style: 'cancel',
        },
      ]
    );
  };
  
  const handleMessage = () => {
    if (!isAuthenticated) {
      Alert.alert(
        language === 'az' ? 'Giriş tələb olunur' : 'Требуется вход',
        language === 'az' 
          ? 'Mesaj göndərmək üçün hesabınıza daxil olmalısınız' 
          : 'Для отправки сообщения необходимо войти в аккаунт',
        [
          {
            text: language === 'az' ? 'Ləğv et' : 'Отмена',
            style: 'cancel',
          },
          {
            text: language === 'az' ? 'Daxil ol' : 'Войти',
            onPress: () => router.push('/auth/login'),
          },
        ]
      );
      return;
    }
    
    if (!seller) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Satıcı məlumatları tapılmadı' : 'Информация о продавце не найдена'
      );
      return;
    }
    
    // Navigate to conversation with the seller
    router.push(`/conversation/${seller.id}?listingId=${listing.id}&listingTitle=${encodeURIComponent(listing.title[language])}`);
  };

  // Calculate days remaining until expiration
  const calculateDaysRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(listing.expiresAt);
    const diffTime = Math.abs(expiresAt.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.images[currentImageIndex] }}
          style={styles.image}
          contentFit="cover"
        />
        
        {listing.images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <TouchableOpacity style={[styles.imageNav, styles.prevButton]} onPress={handlePrevImage}>
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
            )}
            
            {currentImageIndex < listing.images.length - 1 && (
              <TouchableOpacity style={[styles.imageNav, styles.nextButton]} onPress={handleNextImage}>
                <ChevronRight size={24} color="white" />
              </TouchableOpacity>
            )}
            
            <View style={styles.pagination}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </>
        )}
        
        <View style={styles.imageActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleFavoriteToggle}>
            <Heart 
              size={20} 
              color="white" 
              fill={isFavorite ? 'white' : 'transparent'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share size={20} color="white" />
          </TouchableOpacity>
          
          {seller && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowUserActionModal(true)}
            >
              <MoreVertical size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {listing.isFeatured && (
          <View style={styles.adTypeBadge}>
            <Text style={styles.adTypeText}>VIP</Text>
          </View>
        )}
        
        {listing.isPremium && !listing.isFeatured && (
          <View style={[styles.adTypeBadge, styles.premiumBadge]}>
            <Text style={styles.adTypeText}>
              {language === 'az' ? 'Premium' : 'Премиум'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.priceRow}>
          {priceInfo && priceInfo.absoluteSavings >= 1 ? (
            <View style={styles.discountedPriceContainer}>
              <View style={styles.priceWithDiscount}>
                <Text style={styles.discountedPrice}>
                  {priceInfo.discountedPrice} {listing.currency}
                </Text>
                <Text style={styles.originalPrice}>
                  {priceInfo.originalPrice} {listing.currency}
                </Text>
              </View>
              <View style={styles.discountBadge}>
                {priceInfo.discountType === 'fixed_amount' ? (
                  <Text style={styles.discountBadgeText}>
                    -{priceInfo.absoluteSavings} {listing.currency}
                  </Text>
                ) : (
                  <>
                    <Percent size={12} color="white" />
                    <Text style={styles.discountBadgeText}>
                      {Math.round(priceInfo.discountPercentage)}%
                    </Text>
                  </>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.price}>
              {listing.price} {listing.currency}
            </Text>
          )}
          
          {daysRemaining <= 3 && (
            <View style={styles.expirationContainer}>
              <Clock size={16} color={Colors.error} />
              <Text style={styles.expirationText}>
                {language === 'az' 
                  ? `${daysRemaining} gün qalıb` 
                  : `Осталось ${daysRemaining} дн.`}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.title}>{listing.title[language]}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MapPin size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{listing.location[language]}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(listing.createdAt)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Eye size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{listing.views}</Text>
          </View>
        </View>
        
        {(category && subcategory) && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>
              {language === 'az' ? 'Kateqoriya:' : 'Категория:'}
            </Text>
            <Text style={styles.categoryText}>
              {category.name[language]} / {subcategory.name[language]}
            </Text>
          </View>
        )}
        
        {/* Active Discounts */}
        {activeDiscounts.length > 0 && (
          <View style={styles.discountsSection}>
            <Text style={styles.sectionTitle}>
              {language === 'az' ? 'Aktiv Endirimlər' : 'Активные скидки'}
            </Text>
            {activeDiscounts.map((discount) => (
              <View key={discount.id} style={styles.discountCard}>
                <View style={styles.discountHeader}>
                  <Tag size={16} color={Colors.secondary} />
                  <Text style={styles.discountTitle}>{discount.title}</Text>
                </View>
                <Text style={styles.discountDescription}>{discount.description}</Text>
                <View style={styles.discountDetails}>
                  <Text style={styles.discountValue}>
                    {discount.type === 'percentage' 
                      ? `${discount.value}% ${language === 'az' ? 'endirim' : 'скидка'}`
                      : `${discount.value} ${listing.currency} ${language === 'az' ? 'endirim' : 'скидка'}`
                    }
                  </Text>
                  <CountdownTimer 
                    endDate={discount.endDate} 
                    compact={true}
                    style={styles.discountTimer}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Təsvir' : 'Описание'}
          </Text>
          <Text style={styles.description}>{listing.description[language]}</Text>
        </View>
        
        {seller && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {language === 'az' ? 'Satıcı' : 'Продавец'}
            </Text>
            
            <TouchableOpacity 
              style={styles.sellerContainer}
              onPress={() => router.push(`/profile/${seller.id}`)}
            >
              <Image source={{ uri: seller.avatar }} style={styles.sellerAvatar} />
              
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{seller.name}</Text>
                <Text style={styles.sellerLocation}>{seller.location[language]}</Text>
                <UserAnalytics user={seller} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        {(listing.contactPreference === 'phone' || listing.contactPreference === 'both') && (
          <TouchableOpacity 
            style={[styles.footerButton, styles.callButton]} 
            onPress={handleContact}
          >
            <Phone size={20} color="white" />
            <Text style={styles.footerButtonText}>
              {language === 'az' ? 'Zəng et' : 'Позвонить'}
            </Text>
          </TouchableOpacity>
        )}
        
        {(listing.contactPreference === 'message' || listing.contactPreference === 'both') && (
          <TouchableOpacity 
            style={[
              styles.footerButton, 
              styles.messageButton,
              listing.contactPreference === 'message' && styles.fullWidthButton
            ]} 
            onPress={handleMessage}
          >
            <MessageCircle size={20} color="white" />
            <Text style={styles.footerButtonText}>
              {language === 'az' ? 'Mesaj yaz' : 'Написать'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ShareModal />
      
      {/* User Action Modal */}
      {seller && (
        <UserActionModal
          visible={showUserActionModal}
          onClose={() => setShowUserActionModal(false)}
          user={seller}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: width * 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageNav: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  imageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adTypeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
  },
  adTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expirationText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.primary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  sellerLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  callButton: {
    backgroundColor: Colors.success,
  },
  messageButton: {
    backgroundColor: Colors.primary,
  },
  fullWidthButton: {
    flex: 1,
  },
  footerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  shareOptions: {
    padding: 20,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shareOption: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  sharePlatformName: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  discountedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceWithDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  discountBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountsSection: {
    marginTop: 24,
  },
  discountCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  discountDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  discountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  discountExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  discountTimer: {
    marginTop: 0,
    marginVertical: 0,
  },
});