import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useStoreStore } from '@/store/storeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
import {
  ArrowLeft,
  Store,
  Save,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle
} from 'lucide-react-native';

export default function EditStoreScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguageStore();
  const { stores, editStore } = useStoreStore();
  const { currentUser } = useUserStore();
  
  const store = stores.find(s => s.id === id);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryName: '',
    address: '',
    description: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
      whatsapp: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    try {
      if (store) {
        // ✅ Validate store data
        if (!store.name || !store.categoryName || !store.address) {
          logger.error('[EditStoreScreen] Invalid store data');
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Mağaza məlumatları düzgün deyil' : 'Данные магазина неверны'
          );
          return;
        }
        
        // ✅ Null-safe access to contactInfo
        const contactInfo = store.contactInfo || {};
        
        setFormData({
          name: store.name || '',
          categoryName: store.categoryName || '',
          address: store.address || '',
          description: store.description || '',
          contactInfo: {
            phone: contactInfo.phone || '',
            email: contactInfo.email || '',
            website: contactInfo.website || '',
            whatsapp: contactInfo.whatsapp || ''
          }
        });
        
        logger.debug('[EditStoreScreen] Store data loaded:', store.id);
      }
    } catch (error) {
      logger.error('[EditStoreScreen] Error loading store data:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza məlumatlarını yükləyərkən xəta' : 'Ошибка при загрузке данных магазина'
      );
    }
  }, [store, language]);
  
  const handleSave = async () => {
    // ✅ Validate authentication
    if (!currentUser || !currentUser.id) {
      logger.error('[EditStoreScreen] User not authenticated');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Hesaba daxil olmalısınız' : 'Вы должны войти в систему'
      );
      return;
    }
    
    // ✅ Validate store
    if (!store || !store.id) {
      logger.error('[EditStoreScreen] Invalid store');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza tapılmadı' : 'Магазин не найден'
      );
      return;
    }
    
    // ✅ Check if already saving
    if (isLoading) {
      logger.warn('[EditStoreScreen] Save already in progress');
      return;
    }
    
    // Validation: Store name
    if (!formData.name.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza adı tələb olunur' : 'Название магазина обязательно'
      );
      return;
    }
    
    if (formData.name.trim().length < 3) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza adı ən azı 3 simvol olmalıdır' : 'Название магазина должно быть не менее 3 символов'
      );
      return;
    }
    
    if (formData.name.trim().length > 50) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza adı maksimum 50 simvol ola bilər' : 'Название магазина не должно превышать 50 символов'
      );
      return;
    }
    
    // Validation: Address
    if (!formData.address.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Ünvan tələb olunur' : 'Адрес обязателен'
      );
      return;
    }
    
    if (formData.address.trim().length < 5) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Ünvan ən azı 5 simvol olmalıdır' : 'Адрес должен быть не менее 5 символов'
      );
      return;
    }
    
    // ✅ Validation: Description length if provided
    if (formData.description.trim() && formData.description.trim().length > 1000) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Təsvir maksimum 1000 simvol ola bilər' : 'Описание не должно превышать 1000 символов'
      );
      return;
    }
    
    // ✅ Validation: Email format if provided (enhanced regex)
    const emailTrimmed = formData.contactInfo.email.trim();
    if (emailTrimmed) {
      // Enhanced email regex
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!emailRegex.test(emailTrimmed) || emailTrimmed.length > 255) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Düzgün email formatı daxil edin' : 'Введите корректный формат email'
        );
        return;
      }
    }
    
    // ✅ Validation: Phone number if provided (enhanced)
    const phoneTrimmed = formData.contactInfo.phone.trim();
    if (phoneTrimmed) {
      // Remove non-digit characters for validation
      const phoneDigits = phoneTrimmed.replace(/\D/g, '');
      
      if (phoneDigits.length < 9 || phoneDigits.length > 15) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Telefon nömrəsi 9-15 rəqəm olmalıdır' : 'Номер телефона должен содержать 9-15 цифр'
        );
        return;
      }
    }
    
    // ✅ Validation: WhatsApp number if provided (enhanced)
    const whatsappTrimmed = formData.contactInfo.whatsapp.trim();
    if (whatsappTrimmed) {
      // Remove non-digit characters for validation
      const whatsappDigits = whatsappTrimmed.replace(/\D/g, '');
      
      if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'WhatsApp nömrəsi 9-15 rəqəm olmalıdır' : 'Номер WhatsApp должен содержать 9-15 цифр'
        );
        return;
      }
    }
    
    // ✅ Validation: Website URL if provided (enhanced)
    const websiteTrimmed = formData.contactInfo.website.trim();
    if (websiteTrimmed) {
      try {
        const url = new URL(websiteTrimmed);
        
        // Check protocol
        if (!['http:', 'https:'].includes(url.protocol)) {
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Vebsayt http:// və ya https:// ilə başlamalıdır' : 'Веб-сайт должен начинаться с http:// или https://'
          );
          return;
        }
        
        // Check URL length
        if (websiteTrimmed.length > 2083) {
          Alert.alert(
            language === 'az' ? 'Xəta' : 'Ошибка',
            language === 'az' ? 'Vebsayt ünvanı çox uzundur' : 'URL веб-сайта слишком длинный'
          );
          return;
        }
      } catch (error) {
        logger.error('[EditStoreScreen] Invalid website URL:', error);
        Alert.alert(
          language === 'az' ? 'Xəta' : 'Ошибка',
          language === 'az' ? 'Düzgün vebsayt ünvanı daxil edin' : 'Введите корректный URL веб-сайта'
        );
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      await editStore(store.id, {
        name: formData.name.trim(),
        categoryName: formData.categoryName.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        contactInfo: {
          phone: formData.contactInfo.phone.trim() || undefined,
          email: formData.contactInfo.email.trim() || undefined,
          website: formData.contactInfo.website.trim() || undefined,
          whatsapp: formData.contactInfo.whatsapp.trim() || undefined
        }
      });
      
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' ? 'Mağaza məlumatları yeniləndi' : 'Информация о магазине обновлена',
        [{
          text: 'OK',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Mağaza yenilənərkən xəta baş verdi' : 'Ошибка при обновлении магазина'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!store) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'az' ? 'Mağazanı redaktə et' : 'Редактировать магазин'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Store size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>
            {language === 'az' ? 'Mağaza tapılmadı' : 'Магазин не найден'}
          </Text>
        </View>
      </View>
    );
  }
  
  if (store.userId !== currentUser?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'az' ? 'Mağazanı redaktə et' : 'Редактировать магазин'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Store size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>
            {language === 'az' ? 'İcazə yoxdur' : 'Нет доступа'}
          </Text>
          <Text style={styles.errorDescription}>
            {language === 'az' ? 'Bu mağazanı redaktə etmək icazəniz yoxdur' : 'У вас нет прав для редактирования этого магазина'}
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'az' ? 'Mağazanı redaktə et' : 'Редактировать магазин'}
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={isLoading}
        >
          <Save size={24} color={isLoading ? Colors.textSecondary : Colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Əsas məlumatlar' : 'Основная информация'}
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Mağaza adı' : 'Название магазина'} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={language === 'az' ? 'Mağaza adını daxil edin' : 'Введите название магазина'}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Kateqoriya' : 'Категория'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.categoryName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, categoryName: text }))}
              placeholder={language === 'az' ? 'Kateqoriya adını daxil edin' : 'Введите название категории'}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Ünvan' : 'Адрес'} *
            </Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder={language === 'az' ? 'Mağaza ünvanını daxil edin' : 'Введите адрес магазина'}
                placeholderTextColor={Colors.textSecondary}
                multiline
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Təsvir' : 'Описание'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder={language === 'az' ? 'Mağaza haqqında məlumat' : 'Информация о магазине'}
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'az' ? 'Əlaqə məlumatları' : 'Контактная информация'}
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Telefon' : 'Телефон'}
            </Text>
            <View style={styles.inputWithIcon}>
              <Phone size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                value={formData.contactInfo.phone}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, phone: text }
                }))}
                placeholder={language === 'az' ? 'Telefon nömrəsi' : 'Номер телефона'}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'E-poçt' : 'Email'}
            </Text>
            <View style={styles.inputWithIcon}>
              <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                value={formData.contactInfo.email}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, email: text }
                }))}
                placeholder={language === 'az' ? 'E-poçt ünvanı' : 'Email адрес'}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'Veb sayt' : 'Веб-сайт'}
            </Text>
            <View style={styles.inputWithIcon}>
              <Globe size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                value={formData.contactInfo.website}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, website: text }
                }))}
                placeholder={language === 'az' ? 'Veb sayt ünvanı' : 'Адрес веб-сайта'}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {language === 'az' ? 'WhatsApp' : 'WhatsApp'}
            </Text>
            <View style={styles.inputWithIcon}>
              <MessageCircle size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.textInputWithIcon]}
                value={formData.contactInfo.whatsapp}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, whatsapp: text }
                }))}
                placeholder={language === 'az' ? 'WhatsApp nömrəsi' : 'Номер WhatsApp'}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>
        
        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.saveButtonLarge, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {isLoading 
                ? (language === 'az' ? 'Yadda saxlanılır...' : 'Сохранение...')
                : (language === 'az' ? 'Dəyişiklikləri yadda saxla' : 'Сохранить изменения')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
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
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textInputWithIcon: {
    paddingLeft: 44,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 1,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});