import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useUserStore } from '@/store/userStore';
import { useDiscountStore } from '@/store/discountStore';
import { useListingStore } from '@/store/listingStore';
import Colors from '@/constants/colors';
import { ArrowLeft, Tag, Percent, Info, Save, Trash2, Plus, HelpCircle, Timer } from 'lucide-react-native';
import CountdownTimer from '@/components/CountdownTimer';

export default function ListingDiscountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguageStore();
  const { isAuthenticated } = useUserStore();
  const { addDiscount, deleteDiscount, getStoreDiscounts, generateDiscountCode } = useDiscountStore();
  const { updateListing, listings: storeListings } = useListingStore();
  
  const [discountTitle, setDiscountTitle] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [usageLimit, setUsageLimit] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Timer Bar Settings
  const [showTimerBar, setShowTimerBar] = useState(false);
  const [timerTitle, setTimerTitle] = useState('');
  const [timerEndDate, setTimerEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [timerBarColor, setTimerBarColor] = useState('#FF6B6B');
  const [enableTimerBar, setEnableTimerBar] = useState(false);
  
  // Custom time inputs
  const [customDays, setCustomDays] = useState('0');
  const [customHours, setCustomHours] = useState('6');
  const [customMinutes, setCustomMinutes] = useState('0');
  
  const listing = storeListings.find(item => item.id === id);
  const existingDiscounts = listing?.storeId ? getStoreDiscounts(listing.storeId).filter(discount => 
    discount.applicableListings.includes(listing.id)
  ) : [];
  
  // Check if listing has individual discount
  const hasIndividualDiscount = listing?.hasDiscount || false;
  const individualDiscountPercentage = listing?.discountPercentage || 0;
  
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        language === 'az' ? 'Giriş tələb olunur' : 'Требуется вход',
        language === 'az' ? 'Bu funksiyadan istifadə etmək üçün hesabınıza daxil olun' : 'Войдите в аккаунт для использования этой функции',
        [
          { text: language === 'az' ? 'Ləğv et' : 'Отмена', style: 'cancel' },
          { text: language === 'az' ? 'Daxil ol' : 'Войти', onPress: () => router.push('/auth/login') },
        ]
      );
      return;
    }
  }, [isAuthenticated, language, router]);
  
  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>
          {language === 'az' ? 'Elan tapılmadı' : 'Объявление не найдено'}
        </Text>
      </View>
    );
  }
  
  const handleCreateDiscount = () => {
    // Only require title for store discounts
    if (listing.storeId && !discountTitle.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Endirim başlığını daxil edin' : 'Введите название скидки'
      );
      return;
    }
    
    if (!discountValue.trim() || isNaN(Number(discountValue))) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Düzgün endirim dəyəri daxil edin' : 'Введите корректное значение скидки'
      );
      return;
    }
    
    // Handle both store and individual listing discounts
    if (listing.storeId) {
      // Store listing - create store discount
      handleCreateStoreDiscount();
    } else {
      // Individual listing - apply direct discount
      handleCreateIndividualDiscount();
    }
  };
  
  const handleCreateStoreDiscount = () => {
    
    try {
      addDiscount({
        storeId: listing.storeId!,
        title: discountTitle,
        description: discountDescription,
        type: discountType,
        value: Number(discountValue),
        minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : undefined,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        applicableListings: [listing.id],
        startDate,
        endDate,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        usedCount: 0,
        isActive,
      });
      
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' ? 'Mağaza endirimi yaradıldı' : 'Скидка магазина создана',
        [
          {
            text: language === 'az' ? 'Tamam' : 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating store discount:', error);
      Alert.alert(
        language === 'az' ? 'Xəta!' : 'Ошибка!',
        language === 'az' ? 'Mağaza endirimi yaradılarkən xəta baş verdi' : 'Произошла ошибка при создании скидки магазина'
      );
    }
  };
  
  const handleCreateIndividualDiscount = () => {
    try {
      const value = Number(discountValue);
      let discountPercentage = 0;
      let originalPrice = listing.originalPrice || listing.price;
      let finalPrice = listing.price;
      
      console.log('[CreateIndividualDiscount] Discount type:', discountType, 'Value:', value);
      
      if (discountType === 'percentage') {
        discountPercentage = value;
        finalPrice = originalPrice * (1 - value / 100);
      } else if (discountType === 'fixed_amount') {
        // For fixed amount discounts, store the actual amount and calculate percentage
        finalPrice = Math.max(0, originalPrice - value);
        discountPercentage = originalPrice > 0 ? ((originalPrice - finalPrice) / originalPrice) * 100 : 0;
        console.log('[CreateIndividualDiscount] Fixed amount discount:', {
          originalPrice,
          discountAmount: value,
          finalPrice,
          calculatedPercentage: discountPercentage
        });
      }
      
      // Use the timer end date if timer is enabled, otherwise use default end date
      const chosenEndDate = enableTimerBar && showTimerBar ? timerEndDate : endDate;
      
      console.log('[CreateIndividualDiscount] Timer enabled:', enableTimerBar, 'Timer shown:', showTimerBar);
      console.log('[CreateIndividualDiscount] Chosen end date:', chosenEndDate.toISOString());
      console.log('[CreateIndividualDiscount] Timer end date:', timerEndDate.toISOString());
      
      // Store the discount information properly
      const updateData: any = {
        hasDiscount: true,
        originalPrice,
        price: Math.round(finalPrice), // Update the actual price
        promotionEndDate: chosenEndDate.toISOString(),
        discountEndDate: chosenEndDate.toISOString(),
      };
      
      // For percentage discounts, store the percentage
      // For fixed amount discounts, store the calculated percentage but keep original price info
      if (discountType === 'percentage') {
        updateData.discountPercentage = value;
      } else {
        // Store the calculated percentage for fixed amount discounts
        // The ListingCard will detect this is a fixed amount by comparing originalPrice vs price
        updateData.discountPercentage = discountPercentage;
      }
      
      updateListing(listing.id, updateData);
      
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' ? 'Elan endirimi tətbiq edildi' : 'Скидка на объявление применена',
        [
          {
            text: language === 'az' ? 'Tamam' : 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating individual discount:', error);
      Alert.alert(
        language === 'az' ? 'Xəta!' : 'Ошибка!',
        language === 'az' ? 'Elan endirimi tətbiq edilərkən xəta baş verdi' : 'Произошла ошибка при применении скидки на объявление'
      );
    }
  };
  
  const handleDeleteDiscount = (discountId: string) => {
    Alert.alert(
      language === 'az' ? 'Endirimi sil' : 'Удалить скидку',
      language === 'az' ? 'Bu endirimi silmək istəyirsiniz?' : 'Хотите удалить эту скидку?',
      [
        { text: language === 'az' ? 'Ləğv et' : 'Отмена', style: 'cancel' },
        {
          text: language === 'az' ? 'Sil' : 'Удалить',
          style: 'destructive',
          onPress: () => {
            deleteDiscount(discountId);
            Alert.alert(
              language === 'az' ? 'Silindi' : 'Удалено',
              language === 'az' ? 'Endirim silindi' : 'Скидка удалена'
            );
          },
        },
      ]
    );
  };
  
  const handleRemoveIndividualDiscount = () => {
    Alert.alert(
      language === 'az' ? 'Endirimi sil' : 'Удалить скидку',
      language === 'az' ? 'Bu endirimi silmək istəyirsiniz?' : 'Хотите удалить эту скидку?',
      [
        { text: language === 'az' ? 'Ləğv et' : 'Отмена', style: 'cancel' },
        {
          text: language === 'az' ? 'Sil' : 'Удалить',
          style: 'destructive',
          onPress: () => {
            updateListing(listing.id, {
              hasDiscount: false,
              discountPercentage: undefined,
              originalPrice: undefined,
              promotionEndDate: undefined,
            });
            Alert.alert(
              language === 'az' ? 'Silindi' : 'Удалено',
              language === 'az' ? 'Endirim silindi' : 'Скидка удалена'
            );
          },
        },
      ]
    );
  };
  
  const handleGenerateCode = (discountId: string) => {
    generateDiscountCode(discountId);
    Alert.alert(
      language === 'az' ? 'Kod yaradıldı' : 'Код создан',
      language === 'az' ? 'Endirim kodu yaradıldı' : 'Промокод создан'
    );
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU');
  };
  
  const getDiscountPreview = () => {
    if (!discountValue || isNaN(Number(discountValue))) return null;
    
    const value = Number(discountValue);
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (listing.price * value) / 100;
      if (maxDiscountAmount && Number(maxDiscountAmount)) {
        discountAmount = Math.min(discountAmount, Number(maxDiscountAmount));
      }
    } else {
      discountAmount = value;
    }
    
    const finalPrice = Math.max(0, listing.price - discountAmount);
    
    return {
      originalPrice: listing.price,
      discountAmount,
      finalPrice,
      savings: discountAmount
    };
  };
  
  const preview = getDiscountPreview();
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'az' ? 'Məhsula Endirim' : 'Скидка на товар'}
        </Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => router.push('/discount-help')}
        >
          <HelpCircle size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Listing Info */}
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle}>{listing.title[language]}</Text>
        <Text style={styles.listingPrice}>{listing.price} {listing.currency}</Text>
      </View>
      
      {/* Individual Listing Discount */}
      {!listing.storeId && hasIndividualDiscount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Mövcud Endirim' : 'Текущая скидка'}
          </Text>
          <View style={styles.discountCard}>
            <View style={styles.discountHeader}>
              <View style={styles.discountInfo}>
                <Tag size={16} color={Colors.secondary} />
                <Text style={styles.discountName}>
                  {language === 'az' ? 'Elan Endirimi' : 'Скидка на объявление'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleRemoveIndividualDiscount()}
              >
                <Trash2 size={14} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.discountValue}>
              {individualDiscountPercentage}% {language === 'az' ? 'endirim' : 'скидка'}
            </Text>
            <Text style={styles.discountDates}>
              {language === 'az' ? 'Aktiv' : 'Активна'}
              {listing.promotionEndDate && ` - ${formatDate(new Date(listing.promotionEndDate))}`}
            </Text>
          </View>
        </View>
      )}
      
      {/* Store Discounts */}
      {listing.storeId && existingDiscounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Mövcud Mağaza Endirimi' : 'Существующие скидки магазина'}
          </Text>
          {existingDiscounts.map((discount) => (
            <View key={discount.id} style={styles.discountCard}>
              <View style={styles.discountHeader}>
                <View style={styles.discountInfo}>
                  <Tag size={16} color={Colors.secondary} />
                  <Text style={styles.discountName}>{discount.title}</Text>
                </View>
                <View style={styles.discountActions}>
                  <TouchableOpacity 
                    style={styles.codeButton}
                    onPress={() => handleGenerateCode(discount.id)}
                  >
                    <Plus size={14} color={Colors.primary} />
                    <Text style={styles.codeButtonText}>
                      {language === 'az' ? 'Kod' : 'Код'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDiscount(discount.id)}
                  >
                    <Trash2 size={14} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.discountValue}>
                {discount.type === 'percentage' 
                  ? `${discount.value}% ${language === 'az' ? 'endirim' : 'скидка'}`
                  : `${discount.value} ${listing.currency} ${language === 'az' ? 'endirim' : 'скидка'}`
                }
              </Text>
              <Text style={styles.discountDates}>
                {formatDate(new Date(discount.startDate))} - {formatDate(new Date(discount.endDate))}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Create New Discount */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {listing.storeId 
            ? (language === 'az' ? 'Yeni Mağaza Endirimi' : 'Новая скидка магазина')
            : (language === 'az' ? 'Elan Endirimi Tətbiq Et' : 'Применить скидку на объявление')
          }
        </Text>
        
        {!listing.storeId && (
          <View style={styles.infoBox}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {language === 'az' 
                ? 'Bu elan mağazaya aid olmadığı üçün birbaşa endirim tətbiq ediləcək. Endirim dərhal aktiv olacaq.'
                : 'Поскольку это объявление не принадлежит магазину, скидка будет применена напрямую. Скидка станет активной немедленно.'
              }
            </Text>
          </View>
        )}
        
        {/* Store discounts need title and description */}
        {listing.storeId && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Endirim Adı' : 'Название скидки'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={discountTitle}
                onChangeText={setDiscountTitle}
                placeholder={language === 'az' ? 'Məs: Yay endirimi' : 'Напр: Летняя скидка'}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Təsvir' : 'Описание'}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={discountDescription}
                onChangeText={setDiscountDescription}
                placeholder={language === 'az' ? 'Endirim haqqında məlumat' : 'Информация о скидке'}
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        )}
        
        {/* Discount Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'az' ? 'Endirim Növü' : 'Тип скидки'}
          </Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, discountType === 'percentage' && styles.typeButtonActive]}
              onPress={() => setDiscountType('percentage')}
            >
              <Percent size={16} color={discountType === 'percentage' ? 'white' : Colors.primary} />
              <Text style={[styles.typeButtonText, discountType === 'percentage' && styles.typeButtonTextActive]}>
                {language === 'az' ? 'Faiz' : 'Процент'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, discountType === 'fixed_amount' && styles.typeButtonActive]}
              onPress={() => setDiscountType('fixed_amount')}
            >
              <Text style={[styles.typeButtonText, discountType === 'fixed_amount' && styles.typeButtonTextActive]}>
                {listing.currency}
              </Text>
              <Text style={[styles.typeButtonText, discountType === 'fixed_amount' && styles.typeButtonTextActive]}>
                {language === 'az' ? 'Məbləğ' : 'Сумма'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Discount Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {language === 'az' ? 'Endirim Dəyəri' : 'Значение скидки'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={discountValue}
            onChangeText={setDiscountValue}
            placeholder={discountType === 'percentage' ? '10' : '50'}
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
        
        {/* Preview */}
        {preview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {language === 'az' ? 'Önizləmə' : 'Предварительный просмотр'}
            </Text>
            <View style={styles.previewPrices}>
              <Text style={styles.originalPrice}>
                {preview.originalPrice} {listing.currency}
              </Text>
              <Text style={styles.discountedPrice}>
                {preview.finalPrice} {listing.currency}
              </Text>
            </View>
            <Text style={styles.savingsText}>
              {language === 'az' ? 'Qənaət:' : 'Экономия:'} {preview.savings} {listing.currency}
            </Text>
          </View>
        )}
        
        {/* Advanced Settings Toggle - Only for store discounts */}
        {listing.storeId && (
          <TouchableOpacity 
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <View style={styles.toggleContent}>
              <Info size={20} color={Colors.primary} />
              <Text style={styles.advancedToggleText}>
                {language === 'az' ? 'Əlavə Tənzimləmələr' : 'Дополнительные настройки'}
              </Text>
            </View>
            <Switch
              value={showAdvanced}
              onValueChange={setShowAdvanced}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={showAdvanced ? 'white' : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {/* Timer Bar Settings */}
        <TouchableOpacity 
          style={styles.advancedToggle}
          onPress={() => setShowTimerBar(!showTimerBar)}
        >
          <View style={styles.toggleContent}>
            <Timer size={20} color={Colors.primary} />
            <Text style={styles.advancedToggleText}>
              {language === 'az' ? 'Vaxt Sayğacı Bar' : 'Таймер Бар'}
            </Text>
          </View>
          <Switch
            value={showTimerBar}
            onValueChange={setShowTimerBar}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={showTimerBar ? 'white' : Colors.textSecondary}
          />
        </TouchableOpacity>
        
        {/* Timer Bar Configuration */}
        {showTimerBar && (
          <View style={styles.timerBarSettings}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Sayğac Başlığı' : 'Заголовок таймера'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={timerTitle}
                onChangeText={setTimerTitle}
                placeholder={language === 'az' ? 'Məs: Məhdud vaxt təklifi!' : 'Напр: Ограниченное по времени предложение!'}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Sayğac Rəngi' : 'Цвет таймера'}
              </Text>
              <View style={styles.colorSelector}>
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      timerBarColor === color && styles.selectedColor
                    ]}
                    onPress={() => setTimerBarColor(color)}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Vaxt təyin edin' : 'Установите время'}
              </Text>
              <View style={styles.compactTimeContainer}>
                <View style={styles.compactTimeInputs}>
                  <View style={styles.compactTimeInputGroup}>
                    <Text style={styles.compactTimeInputLabel}>
                      {language === 'az' ? 'Gün' : 'Дни'}
                    </Text>
                    <TextInput
                      style={styles.compactTimeInput}
                      value={customDays}
                      onChangeText={setCustomDays}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.compactTimeInputGroup}>
                    <Text style={styles.compactTimeInputLabel}>
                      {language === 'az' ? 'Saat' : 'Часы'}
                    </Text>
                    <TextInput
                      style={styles.compactTimeInput}
                      value={customHours}
                      onChangeText={setCustomHours}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.compactTimeInputGroup}>
                    <Text style={styles.compactTimeInputLabel}>
                      {language === 'az' ? 'Dəqiqə' : 'Минуты'}
                    </Text>
                    <TextInput
                      style={styles.compactTimeInput}
                      value={customMinutes}
                      onChangeText={setCustomMinutes}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.compactApplyButton}
                  onPress={() => {
                    const days = parseInt(customDays) || 0;
                    const hours = parseInt(customHours) || 0;
                    const minutes = parseInt(customMinutes) || 0;
                    
                    if (days === 0 && hours === 0 && minutes === 0) {
                      Alert.alert(
                        language === 'az' ? 'Xəta' : 'Ошибка',
                        language === 'az' ? 'Ən azı bir vaxt dəyəri daxil edin' : 'Введите хотя бы одно значение времени'
                      );
                      return;
                    }
                    
                    const totalMilliseconds = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
                    const newEndDate = new Date(Date.now() + totalMilliseconds);
                    setTimerEndDate(newEndDate);
                    Alert.alert(
                      language === 'az' ? 'Uğurlu' : 'Успешно',
                      language === 'az' ? 'Vaxt təyin edildi' : 'Время установлено'
                    );
                  }}
                >
                  <Text style={styles.compactApplyText}>
                    {language === 'az' ? 'Tətbiq et' : 'Применить'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.currentTimeDisplay}>
                {language === 'az' ? 'Cari vaxt: ' : 'Текущее время: '}
                {timerEndDate.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU')} {timerEndDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
            
            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Sayğacı Aktiv Et' : 'Активировать таймер'}
              </Text>
              <Switch
                value={enableTimerBar}
                onValueChange={setEnableTimerBar}
                trackColor={{ false: Colors.border, true: timerBarColor }}
                thumbColor={enableTimerBar ? 'white' : Colors.textSecondary}
              />
            </View>
            
            {/* Timer Preview */}
            {enableTimerBar && timerTitle && (
              <View style={styles.timerPreview}>
                <Text style={styles.previewTitle}>
                  {language === 'az' ? 'Sayğac Önizləməsi' : 'Предварительный просмотр таймера'}
                </Text>
                <View style={[styles.customTimerBar, { borderColor: timerBarColor }]}>
                  <View style={styles.timerHeader}>
                    <Timer size={16} color={timerBarColor} />
                    <Text style={[styles.timerTitle, { color: timerBarColor }]}>
                      {timerTitle}
                    </Text>
                  </View>
                  <CountdownTimer
                    endDate={timerEndDate}
                    style={[styles.timerContent, { backgroundColor: `${timerBarColor}15` }]}
                    compact={false}
                  />
                </View>
              </View>
            )}
            
            <View style={styles.infoBox}>
              <Info size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                {language === 'az' 
                  ? 'Vaxt sayğacı bar endirimlə birlikdə göstəriləcək və müştərilərdə təcililik hissi yaradacaq. Sayğac bitdikdə endirim avtomatik olaraq deaktiv olacaq.'
                  : 'Таймер бар будет отображаться вместе со скидкой и создаст у покупателей чувство срочности. Когда таймер закончится, скидка автоматически деактивируется.'
                }
              </Text>
            </View>
          </View>
        )}
        
        {/* Advanced Settings - Only for store discounts */}
        {listing.storeId && showAdvanced && (
          <View style={styles.advancedSettings}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Minimum Alış Məbləği' : 'Минимальная сумма покупки'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={minPurchaseAmount}
                onChangeText={setMinPurchaseAmount}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            {discountType === 'percentage' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {language === 'az' ? 'Maksimum Endirim Məbləği' : 'Максимальная сумма скидки'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={maxDiscountAmount}
                  onChangeText={setMaxDiscountAmount}
                  placeholder="100"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'İstifadə Limiti' : 'Лимит использования'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={usageLimit}
                onChangeText={setUsageLimit}
                placeholder={language === 'az' ? 'Limitsiz' : 'Без ограничений'}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>
                {language === 'az' ? 'Aktiv' : 'Активна'}
              </Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor={isActive ? 'white' : Colors.textSecondary}
              />
            </View>
          </View>
        )}
        
        {/* Info Box - Different for store vs individual */}
        {listing.storeId && (
          <View style={styles.infoBox}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {language === 'az' 
                ? 'Mağaza endirimi yaradıldıqdan sonra müştərilər bu məhsulu endirimlə ala biləcəklər. Endirim kodları da yarada bilərsiniz.'
                : 'После создания скидки магазина покупатели смогут приобрести этот товар со скидкой. Вы также можете создать промокоды.'
              }
            </Text>
          </View>
        )}
        
        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateDiscount}>
          <Save size={20} color="white" />
          <Text style={styles.createButtonText}>
            {listing.storeId 
              ? (language === 'az' ? 'Mağaza Endirimi Yarat' : 'Создать скидку магазина')
              : (language === 'az' ? 'Endirim Tətbiq Et' : 'Применить скидку')
            }
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  helpButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
  },
  listingInfo: {
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  discountCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  discountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    gap: 4,
  },
  codeButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: 4,
  },
  discountDates: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  previewCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  previewPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  savingsText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  timerBarSettings: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: Colors.text,
    borderWidth: 3,
  },
  dateSelector: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.card,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  timerPreview: {
    backgroundColor: 'rgba(14, 116, 144, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.2)',
  },
  customTimerBar: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContent: {
    borderRadius: 8,
    padding: 8,
  },
  advancedSettings: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customTimeToggle: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    alignItems: 'center',
  },
  customTimeToggleText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  customTimeContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(14, 116, 144, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.2)',
  },
  customTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  customTimeInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
    textAlign: 'center',
    minWidth: 50,
  },
  applyCustomTimeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  applyCustomTimeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  compactTimeContainer: {
    marginTop: 8,
  },
  compactTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  compactTimeInputGroup: {
    alignItems: 'center',
  },
  compactTimeInputLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  compactTimeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
    textAlign: 'center',
    minWidth: 50,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  compactApplyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  compactApplyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  currentTimeDisplay: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});