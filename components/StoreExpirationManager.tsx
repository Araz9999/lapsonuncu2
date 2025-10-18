import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import { useLanguageStore } from '@/store/languageStore';
import { useStoreStore } from '@/store/storeStore';
import Colors from '@/constants/colors';
import { logger } from '@/utils/logger';
import {
  Clock,
  AlertTriangle,
  Archive,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  Package,
  Shield
} from 'lucide-react-native';

interface StoreExpirationManagerProps {
  storeId: string;
  showCompact?: boolean;
}

export default function StoreExpirationManager({ storeId, showCompact = false }: StoreExpirationManagerProps) {
  const { language } = useLanguageStore();
  const { 
    getExpirationInfo, 
    getExpiredStoreActions, 
    sendExpirationNotification,
    renewStore,
    reactivateStore,
    getStorePlans,
    getStoreListingConflicts
  } = useStoreStore();
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showRenewModal, setShowRenewModal] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('basic');
  
  const expirationInfo = getExpirationInfo(storeId);
  const storeActions = getExpiredStoreActions(storeId);
  const storePlans = getStorePlans();
  const listingConflicts = getStoreListingConflicts(storeId);
  
  if (!expirationInfo) return null;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} color={Colors.success} />;
      case 'grace_period': return <Clock size={16} color={Colors.secondary} />;
      case 'deactivated': return <XCircle size={16} color={Colors.error} />;
      case 'archived': return <Archive size={16} color={Colors.textSecondary} />;
      default: return <Info size={16} color={Colors.textSecondary} />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'grace_period': return Colors.secondary;
      case 'deactivated': return Colors.error;
      case 'archived': return Colors.textSecondary;
      default: return Colors.textSecondary;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return language === 'az' ? 'Aktiv' : 'Активен';
      case 'grace_period': return language === 'az' ? 'Güzəşt müddəti' : 'Льготный период';
      case 'deactivated': return language === 'az' ? 'Deaktiv' : 'Деактивирован';
      case 'archived': return language === 'az' ? 'Arxivdə' : 'В архиве';
      default: return language === 'az' ? 'Naməlum' : 'Неизвестно';
    }
  };
  
  const handleRenewStore = async () => {
    if (!storeId) {
      logger.error('[StoreExpiration] No store ID provided');
      return;
    }
    
    if (!selectedPlanId) {
      logger.error('[StoreExpiration] No plan selected');
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Paket seçilməyib' : 'Пакет не выбран'
      );
      return;
    }
    
    logger.info('[StoreExpiration] Renewing store:', { storeId, planId: selectedPlanId, canReactivate: storeActions.canReactivate });
    
    try {
      if (storeActions.canReactivate) {
        await reactivateStore(storeId, selectedPlanId);
        logger.info('[StoreExpiration] Store reactivated successfully');
      } else {
        await renewStore(storeId, selectedPlanId);
        logger.info('[StoreExpiration] Store renewed successfully');
      }
      setShowRenewModal(false);
      Alert.alert(
        language === 'az' ? 'Uğurlu!' : 'Успешно!',
        language === 'az' ? 'Mağaza yeniləndi' : 'Магазин обновлен'
      );
    } catch (error) {
      logger.error('[StoreExpiration] Store renewal failed:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Yeniləmə zamanı xəta baş verdi' : 'Ошибка при обновлении'
      );
    }
  };
  
  const sendNotification = async (type: 'warning' | 'grace_period' | 'deactivated') => {
    if (!storeId) {
      logger.error('[StoreExpiration] No store ID for notification');
      return;
    }
    
    logger.info('[StoreExpiration] Sending expiration notification:', { storeId, type });
    
    try {
      await sendExpirationNotification(storeId, type);
      logger.info('[StoreExpiration] Notification sent successfully');
      Alert.alert(
        language === 'az' ? 'Bildiriş göndərildi' : 'Уведомление отправлено',
        language === 'az' ? 'Xəbərdarlıq bildiriş göndərildi' : 'Предупреждение отправлено'
      );
    } catch (error) {
      logger.error('[StoreExpiration] Notification failed:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Bildiriş göndərilərkən xəta baş verdi' : 'Ошибка при отправке уведомления'
      );
    }
  };
  
  if (showCompact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          {getStatusIcon(expirationInfo.status)}
          <Text style={[styles.compactStatus, { color: getStatusColor(expirationInfo.status) }]}>
            {getStatusText(expirationInfo.status)}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowDetailsModal(true)}
            style={styles.compactInfoButton}
          >
            <Info size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {expirationInfo.status !== 'active' && (
          <Text style={styles.compactAction}>
            {storeActions.recommendedAction}
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          {getStatusIcon(expirationInfo.status)}
          <Text style={[styles.statusText, { color: getStatusColor(expirationInfo.status) }]}>
            {getStatusText(expirationInfo.status)}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setShowDetailsModal(true)}
          style={styles.infoButton}
        >
          <Info size={16} color={Colors.primary} />
          <Text style={styles.infoButtonText}>
            {language === 'az' ? 'Ətraflı' : 'Подробно'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.nextAction}>{expirationInfo.nextAction}</Text>
        {expirationInfo.nextActionDate && (
          <Text style={styles.nextActionDate}>
            {language === 'az' ? 'Tarix: ' : 'Дата: '}{expirationInfo.nextActionDate}
          </Text>
        )}
        
        <Text style={styles.recommendation}>
          {storeActions.recommendedAction}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {storeActions.canRenew && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.renewButton]}
            onPress={() => setShowRenewModal(true)}
          >
            <RefreshCw size={16} color="white" />
            <Text style={styles.renewButtonText}>
              {language === 'az' ? 'Yenilə' : 'Обновить'}
            </Text>
          </TouchableOpacity>
        )}
        
        {storeActions.canReactivate && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.reactivateButton]}
            onPress={() => setShowRenewModal(true)}
          >
            <Zap size={16} color="white" />
            <Text style={styles.reactivateButtonText}>
              {language === 'az' ? 'Reaktiv et' : 'Реактивировать'}
            </Text>
          </TouchableOpacity>
        )}
        
        {expirationInfo.status === 'grace_period' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.notifyButton]}
            onPress={() => sendNotification('grace_period')}
          >
            <AlertTriangle size={16} color={Colors.secondary} />
            <Text style={styles.notifyButtonText}>
              {language === 'az' ? 'Xəbərdar et' : 'Уведомить'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {language === 'az' ? 'Mağaza vəziyyəti haqqında' : 'О состоянии магазина'}
            </Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  {language === 'az' ? 'Cari vəziyyət' : 'Текущее состояние'}
                </Text>
                <View style={styles.detailRow}>
                  {getStatusIcon(expirationInfo.status)}
                  <Text style={[styles.detailText, { color: getStatusColor(expirationInfo.status) }]}>
                    {getStatusText(expirationInfo.status)}
                  </Text>
                </View>
              </View>
              
              {expirationInfo.status === 'active' && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    {language === 'az' ? 'Müddət bitməsinə qədər' : 'До истечения срока'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {expirationInfo.daysUntilExpiration} {language === 'az' ? 'gün' : 'дней'}
                  </Text>
                </View>
              )}
              
              {expirationInfo.status === 'grace_period' && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    {language === 'az' ? 'Güzəşt müddəti qalıb' : 'Осталось льготного периода'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {expirationInfo.daysInGracePeriod} {language === 'az' ? 'gün' : 'дней'}
                  </Text>
                </View>
              )}
              
              {expirationInfo.status === 'deactivated' && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    {language === 'az' ? 'Deaktiv olalı' : 'Деактивирован уже'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {expirationInfo.daysSinceDeactivation} {language === 'az' ? 'gün' : 'дней'}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  {language === 'az' ? 'Növbəti addım' : 'Следующий шаг'}
                </Text>
                <Text style={styles.detailText}>{expirationInfo.nextAction}</Text>
                {expirationInfo.nextActionDate && (
                  <Text style={styles.detailDate}>
                    {language === 'az' ? 'Tarix: ' : 'Дата: '}{expirationInfo.nextActionDate}
                  </Text>
                )}
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  {language === 'az' ? 'Tövsiyə' : 'Рекомендация'}
                </Text>
                <Text style={styles.recommendationText}>
                  {storeActions.recommendedAction}
                </Text>
              </View>
              
              {listingConflicts && listingConflicts.length > 0 && (
                <View style={styles.conflictSection}>
                  <View style={styles.conflictHeader}>
                    <AlertTriangle size={16} color={Colors.secondary} />
                    <Text style={styles.conflictTitle}>
                      {language === 'az' ? 'Məhsul müddəti konflikti' : 'Конфликт сроков товаров'}
                    </Text>
                  </View>
                  
                  <Text style={styles.conflictDescription}>
                    {language === 'az' 
                      ? `${listingConflicts.length} məhsulun müddəti mağaza müddətindən uzundur. Bu məhsullar mağaza bağlandıqdan sonra da aktiv qalacaq.`
                      : `У ${listingConflicts.length} товаров срок действия дольше срока магазина. Эти товары останутся активными после закрытия магазина.`
                    }
                  </Text>
                  
                  <View style={styles.conflictOptions}>
                    <Text style={styles.conflictOptionsTitle}>
                      {language === 'az' ? 'Seçimlər:' : 'Варианты:'}
                    </Text>
                    
                    <View style={styles.conflictOption}>
                      <Shield size={14} color={Colors.primary} />
                      <Text style={styles.conflictOptionText}>
                        {language === 'az' 
                          ? 'Mağazanı yeniləyin ki, bütün məhsullar aktiv qalsın'
                          : 'Обновите магазин, чтобы все товары остались активными'
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.conflictOption}>
                      <Package size={14} color={Colors.textSecondary} />
                      <Text style={styles.conflictOptionText}>
                        {language === 'az' 
                          ? 'Məhsullar müstəqil olaraq aktiv qalacaq, lakin mağaza bağlı olacaq'
                          : 'Товары останутся активными независимо, но магазин будет закрыт'
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.conflictListings}>
                    <Text style={styles.conflictListingsTitle}>
                      {language === 'az' ? 'Təsir edilən məhsullar:' : 'Затронутые товары:'}
                    </Text>
                    {listingConflicts.slice(0, 3).map((conflict: { listingId: string; title: string; remainingDays: number }, index: number) => (
                      <View key={index} style={styles.conflictListing}>
                        <Text style={styles.conflictListingTitle}>{conflict.title}</Text>
                        <Text style={styles.conflictListingDays}>
                          {language === 'az' 
                            ? `${conflict.remainingDays} gün qalıb`
                            : `${conflict.remainingDays} дней осталось`
                          }
                        </Text>
                      </View>
                    ))}
                    {listingConflicts.length > 3 && (
                      <Text style={styles.conflictMoreText}>
                        {language === 'az' 
                          ? `və daha ${listingConflicts.length - 3} məhsul...`
                          : `и еще ${listingConflicts.length - 3} товаров...`
                        }
                      </Text>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.stepsSection}>
                <Text style={styles.stepsSectionTitle}>
                  {language === 'az' ? 'Mağaza müddəti prosesi' : 'Процесс истечения магазина'}
                </Text>
                
                <View style={styles.stepsList}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.success }]}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>
                        {language === 'az' ? 'Aktiv mağaza' : 'Активный магазин'}
                      </Text>
                      <Text style={styles.stepDescription}>
                        {language === 'az' 
                          ? 'Mağaza normal işləyir, bütün funksiyalar mövcuddur'
                          : 'Магазин работает нормально, все функции доступны'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.secondary }]}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>
                        {language === 'az' ? 'Güzəşt müddəti (7 gün)' : 'Льготный период (7 дней)'}
                      </Text>
                      <Text style={styles.stepDescription}>
                        {language === 'az' 
                          ? 'Mağaza hələ aktiv, lakin yeniləmə xəbərdarlığı göstərilir'
                          : 'Магазин еще активен, но показывается предупреждение об обновлении'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.error }]}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>
                        {language === 'az' ? 'Deaktivasiya' : 'Деактивация'}
                      </Text>
                      <Text style={styles.stepDescription}>
                        {language === 'az' 
                          ? 'Mağaza və elanlar gizlədilir, müştərilər görə bilməz'
                          : 'Магазин и объявления скрываются, клиенты не могут их видеть'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={[styles.stepNumber, { backgroundColor: Colors.textSecondary }]}>
                      <Text style={styles.stepNumberText}>4</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>
                        {language === 'az' ? 'Arxivləmə (90 gün sonra)' : 'Архивирование (через 90 дней)'}
                      </Text>
                      <Text style={styles.stepDescription}>
                        {language === 'az' 
                          ? 'Mağaza arxivə köçürülür, məlumatlar qorunur, reaktivasiya mümkündür'
                          : 'Магазин перемещается в архив, данные сохраняются, реактивация возможна'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {language === 'az' ? 'Bağla' : 'Закрыть'}
                </Text>
              </TouchableOpacity>
              
              {(storeActions.canRenew || storeActions.canReactivate) && (
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => {
                    setShowDetailsModal(false);
                    setShowRenewModal(true);
                  }}
                >
                  <Text style={styles.modalActionButtonText}>
                    {storeActions.canReactivate 
                      ? (language === 'az' ? 'Reaktiv et' : 'Реактивировать')
                      : (language === 'az' ? 'Yenilə' : 'Обновить')
                    }
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Renew/Reactivate Modal */}
      <Modal
        visible={showRenewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRenewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {storeActions.canReactivate 
                ? (language === 'az' ? 'Mağazanı reaktiv et' : 'Реактивировать магазин')
                : (language === 'az' ? 'Mağazanı yenilə' : 'Обновить магазин')
              }
            </Text>
            
            <View style={styles.planOptions}>
              {storePlans.map((plan) => (
                <TouchableOpacity 
                  key={plan.id}
                  style={[
                    styles.planOption,
                    selectedPlanId === plan.id && styles.selectedPlanOption
                  ]}
                  onPress={() => setSelectedPlanId(plan.id)}
                >
                  <View style={styles.planOptionInfo}>
                    <Text style={[
                      styles.planOptionTitle,
                      selectedPlanId === plan.id && styles.selectedPlanOptionText
                    ]}>{plan.name[language]}</Text>
                    <Text style={[
                      styles.planOptionPrice,
                      selectedPlanId === plan.id && styles.selectedPlanOptionText
                    ]}>{plan.price} AZN</Text>
                    <Text style={[
                      styles.planOptionFeatures,
                      selectedPlanId === plan.id && styles.selectedPlanOptionText
                    ]}>{plan.maxAds} elan, {plan.duration} gün</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRenewModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {language === 'az' ? 'Ləğv et' : 'Отмена'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalActionButton}
                onPress={handleRenewStore}
              >
                <Text style={styles.modalActionButtonText}>
                  {language === 'az' ? 'Ödə' : 'Оплатить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  compactStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 116, 144, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactInfoButton: {
    padding: 4,
  },
  infoButtonText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  content: {
    marginBottom: 16,
  },
  nextAction: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  nextActionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 13,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  compactAction: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'center',
  },
  renewButton: {
    backgroundColor: Colors.primary,
  },
  renewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reactivateButton: {
    backgroundColor: Colors.success,
  },
  reactivateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  notifyButton: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  notifyButtonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  detailDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  stepsSection: {
    marginTop: 16,
  },
  stepsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  planOptions: {
    gap: 12,
    marginBottom: 20,
  },
  planOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedPlanOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  planOptionInfo: {
    flex: 1,
  },
  planOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  planOptionPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planOptionFeatures: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedPlanOptionText: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCloseButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalActionButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  conflictSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginLeft: 6,
  },
  conflictDescription: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  conflictOptions: {
    marginBottom: 12,
  },
  conflictOptionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  conflictOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  conflictOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  conflictListings: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.3)',
    paddingTop: 8,
  },
  conflictListingsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  conflictListing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  conflictListingTitle: {
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  conflictListingDays: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  conflictMoreText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
});