import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Eye, Plus, Minus } from 'lucide-react-native';
import { useLanguageStore } from '@/store/languageStore';
import { useThemeStore } from '@/store/themeStore';
import { useListingStore } from '@/store/listingStore';
import { getColors } from '@/constants/colors';

interface ViewPurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

export default function ViewPurchaseModal({
  visible,
  onClose,
  listingId,
  listingTitle,
}: ViewPurchaseModalProps) {
  const { language } = useLanguageStore();
  const { themeMode, colorTheme, fontSize } = useThemeStore();
  const { purchaseViews } = useListingStore();
  const colors = getColors(themeMode, colorTheme);

  const [viewCount, setViewCount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const predefinedAmounts = [50, 100, 250, 500, 1000];
  const cost = (isCustom ? parseInt(customAmount) || 0 : viewCount) * 0.01;

  const handlePurchase = async () => {
    const finalViewCount = isCustom ? parseInt(customAmount) || 0 : viewCount;
    
    if (finalViewCount <= 0) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Zəhmət olmasa düzgün miqdar daxil edin'
          : 'Пожалуйста, введите правильное количество'
      );
      return;
    }

    setLoading(true);
    try {
      await purchaseViews(listingId, finalViewCount);
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az'
          ? `${finalViewCount} baxış uğurla satın alındı. Elanınız indi ön sıralarda görünəcək.`
          : `${finalViewCount} просмотров успешно куплено. Ваше объявление теперь будет показано в приоритете.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Ödəniş zamanı xəta baş verdi'
          : 'Произошла ошибка при оплате'
      );
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = () => {
    if (!isCustom) {
      setViewCount(prev => prev + 50);
    }
  };

  const decrementViews = () => {
    if (!isCustom && viewCount > 50) {
      setViewCount(prev => prev - 50);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize === 'small' ? 18 : fontSize === 'large' ? 22 : 20 }]}>
              {language === 'az' ? 'Baxış satın al' : 'Купить просмотры'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14 }]}>
              {listingTitle}
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Eye size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text, fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14 }]}>
                  {language === 'az' 
                    ? '1 baxış = 1 qəpik (0.01 AZN)'
                    : '1 просмотр = 1 копейка (0.01 AZN)'}
                </Text>
              </View>
              <Text style={[styles.infoDescription, { color: colors.textSecondary, fontSize: fontSize === 'small' ? 10 : fontSize === 'large' ? 14 : 12 }]}>
                {language === 'az'
                  ? 'Satın aldığınız baxış sayı qədər elanınız ön sıralarda görünəcək'
                  : 'Ваше объявление будет показано в приоритете на количество купленных просмотров'}
              </Text>
            </View>

            <View style={styles.amountSection}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize === 'small' ? 14 : fontSize === 'large' ? 18 : 16 }]}>
                {language === 'az' ? 'Baxış miqdarı' : 'Количество просмотров'}
              </Text>

              <View style={styles.predefinedAmounts}>
                {predefinedAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.amountButton,
                      { 
                        backgroundColor: !isCustom && viewCount === amount ? colors.primary : colors.background,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => {
                      setIsCustom(false);
                      setViewCount(amount);
                    }}
                  >
                    <Text style={[
                      styles.amountButtonText,
                      { 
                        color: !isCustom && viewCount === amount ? 'white' : colors.text,
                        fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14
                      }
                    ]}>
                      {amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.customButton,
                  { 
                    backgroundColor: isCustom ? colors.primary : colors.background,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setIsCustom(true)}
              >
                <Text style={[
                  styles.customButtonText,
                  { 
                    color: isCustom ? 'white' : colors.text,
                    fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14
                  }
                ]}>
                  {language === 'az' ? 'Fərdi miqdar' : 'Свое количество'}
                </Text>
              </TouchableOpacity>

              {isCustom && (
                <TextInput
                  style={[
                    styles.customInput,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSize === 'small' ? 14 : fontSize === 'large' ? 18 : 16
                    }
                  ]}
                  placeholder={language === 'az' ? 'Miqdar daxil edin' : 'Введите количество'}
                  placeholderTextColor={colors.placeholder}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                />
              )}

              {!isCustom && (
                <View style={styles.counterControls}>
                  <TouchableOpacity
                    style={[styles.counterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={decrementViews}
                  >
                    <Minus size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: colors.text, fontSize: fontSize === 'small' ? 16 : fontSize === 'large' ? 20 : 18 }]}>
                    {viewCount}
                  </Text>
                  <TouchableOpacity
                    style={[styles.counterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={incrementViews}
                  >
                    <Plus size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={[styles.totalSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary, fontSize: fontSize === 'small' ? 12 : fontSize === 'large' ? 16 : 14 }]}>
                {language === 'az' ? 'Ümumi məbləğ:' : 'Общая сумма:'}
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary, fontSize: fontSize === 'small' ? 18 : fontSize === 'large' ? 22 : 20 }]}>
                {cost.toFixed(2)} AZN
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.7 : 1
                }
              ]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.purchaseButtonText, { fontSize: fontSize === 'small' ? 14 : fontSize === 'large' ? 18 : 16 }]}>
                  {language === 'az' ? 'Satın al' : 'Купить'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    marginBottom: 16,
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  infoDescription: {
    lineHeight: 18,
  },
  amountSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  predefinedAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  amountButtonText: {
    fontWeight: '500',
  },
  customButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  customButtonText: {
    fontWeight: '500',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalLabel: {
    fontWeight: '500',
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});