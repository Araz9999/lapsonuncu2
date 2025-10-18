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
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguageStore } from '@/store/languageStore';
import { useStoreStore } from '@/store/storeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
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
import { logger } from '@/utils/logger';
import { validateEmail, validateAzerbaijanPhone, validateWebsiteURL, validateStoreName } from '@/utils/inputValidation';

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
    if (store) {
      logger.info('[EditStore] Loading store data:', { storeId: store.id, storeName: store.name });\n      \n      setFormData({
        name: store.name,
        categoryName: store.categoryName,
        address: store.address,
        description: store.description || '',
        contactInfo: {
          phone: store.contactInfo.phone || '',
          email: store.contactInfo.email || '',
          website: store.contactInfo.website || '',
          whatsapp: store.contactInfo.whatsapp || ''
        }
      });\n      \n      logger.info('[EditStore] Form data initialized successfully');\n    } else {\n      logger.warn('[EditStore] No store found for ID:', id);\n    }
  }, [store, id]);
  
  const handleSave = async () => {
    if (!store || !currentUser) {
      logger.error('[EditStore] Missing store or user:', { hasStore: !!store, hasUser: !!currentUser });
      return;
    }
    
    logger.info('[EditStore] Saving store changes:', { storeId: store.id, storeName: formData.name });
    
    // ✅ Validate store name
    const nameValidation = validateStoreName(formData.name);
    if (!nameValidation.isValid) {
      logger.warn('[EditStore] Invalid store name:', { name: formData.name, error: nameValidation.error });
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        nameValidation.error || (language === 'az' ? 'Mağaza adı düzgün deyil' : 'Неверное название магазина')
      );
      return;
    }
    
    if (!formData.address.trim()) {
      logger.warn('[EditStore] Address is required');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Ünvan tələb olunur' : 'Адрес обязателен'
      );
      return;
    }
    
    // ✅ Validate email (optional but must be valid if provided)
    if (formData.contactInfo.email.trim() && !validateEmail(formData.contactInfo.email.trim())) {
      logger.warn('[EditStore] Invalid email format:', formData.contactInfo.email);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' 
          ? 'Email formatı düzgün deyil (məsələn: info@magaza.az)' 
          : 'Неверный формат email'
      );
      return;
    }
    
    // ✅ Validate phone (optional but must be valid if provided)
    if (formData.contactInfo.phone.trim() && !validateAzerbaijanPhone(formData.contactInfo.phone.trim(), false)) {
      logger.warn('[EditStore] Invalid phone format:', formData.contactInfo.phone);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az'
          ? 'Telefon formatı düzgün deyil (məsələn: +994501234567)'
          : 'Неверный формат телефона'
      );
      return;
    }
    
    // ✅ Validate WhatsApp (optional but must be valid if provided)
    if (formData.contactInfo.whatsapp.trim() && !validateAzerbaijanPhone(formData.contactInfo.whatsapp.trim(), false)) {
      logger.warn('[EditStore] Invalid WhatsApp format:', formData.contactInfo.whatsapp);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az'
          ? 'WhatsApp nömrəsi formatı düzgün deyil'
          : 'Неверный формат WhatsApp'
      );
      return;
    }
    
    // ✅ Validate website URL (optional but must be valid if provided)
    if (formData.contactInfo.website.trim() && !validateWebsiteURL(formData.contactInfo.website.trim(), false)) {
      logger.warn('[EditStore] Invalid website URL:', formData.contactInfo.website);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az'
          ? 'Website URL formatı düzgün deyil (məsələn: https://magaza.az)'
          : 'Неверный формат URL'
      );
      return;
    }
    
    setIsLoading(true);
    
    try {
      logger.info('[EditStore] Updating store:', {
        storeId: store.id,
        name: formData.name.trim(),
        hasEmail: !!formData.contactInfo.email.trim(),
        hasPhone: !!formData.contactInfo.phone.trim()
      });
      
      await editStore(store.id, {
        name: formData.name.trim(),
        categoryName: formData.categoryName.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        contactInfo: {
          phone: formData.contactInfo.phone.trim(),
          email: formData.contactInfo.email.trim(),
          website: formData.contactInfo.website.trim(),
          whatsapp: formData.contactInfo.whatsapp.trim()
        }
      });
      
      logger.info('[EditStore] Store updated successfully:', store.id);
      
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' ? 'Mağaza məlumatları yeniləndi' : 'Информация о магазине обновлена',
        [{
          text: 'OK',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      logger.error('[EditStore] Failed to update store:', error);
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