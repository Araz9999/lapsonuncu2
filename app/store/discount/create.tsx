import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Percent, DollarSign, Gift } from 'lucide-react-native';
import { useDiscountStore } from '@/store/discountStore';
import { useStoreStore } from '@/store/storeStore';
import { useUserStore } from '@/store/userStore';
import { useListingStore } from '@/store/listingStore';
import CountdownTimer from '@/components/CountdownTimer';

export default function CreateDiscountScreen() {
  const router = useRouter();
  const { addDiscount } = useDiscountStore();
  const { getActiveStoreForUser } = useStoreStore();
  const { currentUser } = useUserStore();
  const { listings } = useListingStore();
  
  const currentStore = currentUser ? getActiveStoreForUser(currentUser.id) : null;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'buy_x_get_y',
    value: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usageLimit: '',
    isActive: true,
    hasCountdown: false,
    countdownEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    countdownTitle: '',
  });
  
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  
  if (!currentStore) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Endirim Yarat' }} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Mağaza seçilməyib</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const storeListings = listings.filter(l => l.storeId === currentStore.id && !l.deletedAt);
  
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      Alert.alert('Xəta', 'Endirim başlığı daxil edin');
      return;
    }
    
    if (!formData.value.trim()) {
      Alert.alert('Xəta', 'Endirim dəyəri daxil edin');
      return;
    }
    
    if (selectedListings.length === 0) {
      Alert.alert('Xəta', 'Ən azı bir məhsul seçin');
      return;
    }
    
    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Xəta', 'Düzgün endirim dəyəri daxil edin');
      return;
    }
    
    if (formData.type === 'percentage' && value > 100) {
      Alert.alert('Xəta', 'Faiz endirimi 100%-dən çox ola bilməz');
      return;
    }
    
    addDiscount({
      storeId: currentStore.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      value,
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      applicableListings: selectedListings,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: formData.usageLimit ? (parseInt(formData.usageLimit, 10) || undefined) : undefined,
      usedCount: 0,
      isActive: formData.isActive,
      hasCountdown: formData.hasCountdown,
      countdownEndDate: formData.hasCountdown ? formData.countdownEndDate : undefined,
      countdownTitle: formData.hasCountdown ? formData.countdownTitle : undefined,
    });
    
    Alert.alert('Uğurlu', 'Endirim yaradıldı', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };
  
  const toggleListingSelection = (listingId: string) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };
  
  const selectAllListings = () => {
    if (selectedListings.length === storeListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(storeListings.map(l => l.id));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Endirim Yarat',
          headerRight: () => (
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Yadda saxla</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Əsas Məlumatlar</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endirim Başlığı *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Məsələn: Yay Endirimi"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Açıqlama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Endirim haqqında ətraflı məlumat"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endirim Növü</Text>
          
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'percentage' && styles.activeTypeButton]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'percentage' }))}
            >
              <Percent size={20} color={formData.type === 'percentage' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.typeButtonText, formData.type === 'percentage' && styles.activeTypeButtonText]}>
                Faiz Endirimi
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'fixed_amount' && styles.activeTypeButton]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'fixed_amount' }))}
            >
              <DollarSign size={20} color={formData.type === 'fixed_amount' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.typeButtonText, formData.type === 'fixed_amount' && styles.activeTypeButtonText]}>
                Sabit Məbləğ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 'buy_x_get_y' && styles.activeTypeButton]}
              onPress={() => setFormData(prev => ({ ...prev, type: 'buy_x_get_y' }))}
            >
              <Gift size={20} color={formData.type === 'buy_x_get_y' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.typeButtonText, formData.type === 'buy_x_get_y' && styles.activeTypeButtonText]}>
                X Al Y Pulsuz
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {formData.type === 'percentage' ? 'Endirim Faizi (%) *' :
               formData.type === 'fixed_amount' ? 'Endirim Məbləği (AZN) *' :
               'Neçə Al *'}
            </Text>
            <TextInput
              style={styles.input}
              value={formData.value}
              onChangeText={(text) => setFormData(prev => ({ ...prev, value: text }))}
              placeholder={formData.type === 'percentage' ? '20' : formData.type === 'fixed_amount' ? '10' : '2'}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
          
          {formData.type === 'percentage' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maksimum Endirim Məbləği (AZN)</Text>
              <TextInput
                style={styles.input}
                value={formData.maxDiscountAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maxDiscountAmount: text }))}
                placeholder="50"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Alış Məbləği (AZN)</Text>
            <TextInput
              style={styles.input}
              value={formData.minPurchaseAmount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, minPurchaseAmount: text }))}
              placeholder="100"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tətbiq Olunan Məhsullar</Text>
          
          <TouchableOpacity style={styles.selectAllButton} onPress={selectAllListings}>
            <Text style={styles.selectAllButtonText}>
              {selectedListings.length === storeListings.length ? 'Hamısını Ləğv et' : 'Hamısını Seç'}
            </Text>
          </TouchableOpacity>
          
          {storeListings.map((listing) => (
            <TouchableOpacity
              key={listing.id}
              style={[styles.listingItem, selectedListings.includes(listing.id) && styles.selectedListingItem]}
              onPress={() => toggleListingSelection(listing.id)}
            >
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{typeof listing.title === 'string' ? listing.title : listing.title.az}</Text>
                <Text style={styles.listingPrice}>{listing.price} AZN</Text>
              </View>
              <View style={[styles.checkbox, selectedListings.includes(listing.id) && styles.checkedCheckbox]}>
                {selectedListings.includes(listing.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geri Sayım Timer</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Geri Sayım Timer Əlavə Et</Text>
            <Switch
              value={formData.hasCountdown}
              onValueChange={(value) => setFormData(prev => ({ ...prev, hasCountdown: value }))}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={formData.hasCountdown ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
          
          {formData.hasCountdown && (
            <View style={styles.countdownSection}>
              <Text style={styles.label}>Timer Başlığı</Text>
              <TextInput
                style={styles.input}
                value={formData.countdownTitle}
                onChangeText={(text) => setFormData(prev => ({ ...prev, countdownTitle: text }))}
                placeholder="Məsələn: Məhdud Vaxt Təklifi!"
                placeholderTextColor="#9CA3AF"
              />
              
              <Text style={styles.label}>Timer Vaxtı</Text>
              <CountdownTimer
                endDate={formData.countdownEndDate}
                title={formData.countdownTitle || formData.title || 'Endirim Müddəti'}
                editable
                onTimeChange={(newEndDate) => {
                  setFormData(prev => ({ ...prev, countdownEndDate: newEndDate }));
                }}
                style={styles.timerPreview}
              />
              
              <Text style={styles.helperText}>
                Bu timer endirim səhifəsində göstəriləcək və müştəriləri tələsdirəcək
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Əlavə Parametrlər</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>İstifadə Limiti</Text>
            <TextInput
              style={styles.input}
              value={formData.usageLimit}
              onChangeText={(text) => setFormData(prev => ({ ...prev, usageLimit: text }))}
              placeholder="100"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Boş buraxsanız, limitsiz olacaq</Text>
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Dərhal Aktivləşdir</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={formData.isActive ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
    textAlign: 'center',
  },
  activeTypeButtonText: {
    color: '#FFFFFF',
  },
  selectAllButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  listingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedListingItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  listingPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  countdownSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerPreview: {
    marginVertical: 8,
  },
});