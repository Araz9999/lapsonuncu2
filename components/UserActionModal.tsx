import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  Badge, 
  UserX, 
  UserCheck, 
  X, 
  Flag, 
  UserPlus, 
  UserMinus, 
  Heart, 
  HeartOff, 
  VolumeX, 
  Volume2, 
  Share2, 
  Shield, 
  ShieldOff, 
  Bell, 
  BellOff, 
  StickyNote, 
  Edit3 
} from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useLanguageStore } from '@/store/languageStore';
import { User } from '@/types/user';
import { logger } from '@/utils/logger';
interface UserActionModalProps {
  visible: boolean;
  onClose: () => void;
  user: User;
}

const { width } = Dimensions.get('window');

export default function UserActionModal({ visible, onClose, user }: UserActionModalProps) {
  const { language } = useLanguageStore();
  const { 
    blockUser, 
    unblockUser, 
    isUserBlocked, 
    canNudgeUser, 
    nudgeUser,
    muteUser,
    unmuteUser,
    isUserMuted,
    followUser,
    unfollowUser,
    isUserFollowed,
    addToFavoriteUsers,
    removeFromFavoriteUsers,
    isUserFavorite,
    trustUser,
    untrustUser,
    isUserTrusted,
    reportUser,
    isUserReported,
    subscribeToUser,
    unsubscribeFromUser,
    isSubscribedToUser,
    addUserNote,
    removeUserNote,
    getUserNote,
    currentUser 
  } = useUserStore();
  const { addNotification } = useNotificationStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportText, setReportText] = useState('');
  
  const isBlocked = isUserBlocked(user.id);
  const canNudge = canNudgeUser(user.id);
  const isMuted = isUserMuted(user.id);
  const isFollowed = isUserFollowed(user.id);
  const isFavorite = isUserFavorite(user.id);
  const isTrusted = isUserTrusted(user.id);
  const isReported = isUserReported(user.id);
  const isSubscribed = isSubscribedToUser(user.id);
  const userNote = getUserNote(user.id);

  const texts = {
    az: {
      userActions: 'İstifadəçi əməliyyatları',
      nudge: 'Dürt',
      nudgeDesc: 'İstifadəçini dürtün',
      block: 'Blok et',
      blockDesc: 'Bu istifadəçini blok edin',
      unblock: 'Blokdan çıxar',
      unblockDesc: 'Bu istifadəçini blokdan çıxarın',
      cancel: 'Ləğv et',
      nudgeSuccess: 'İstifadəçi dürtüldü!',
      nudgeLimit: 'Bu istifadəçini artıq bu gün dürtmüsünüz. 24 saat gözləyin.',
      blockConfirm: 'Bu istifadəçini blok etmək istədiyinizə əminsinizmi?',
      blockSuccess: 'İstifadəçi blok edildi',
      unblockConfirm: 'Bu istifadəçini blokdan çıxarmaq istədiyinizə əminsinizmi?',
      unblockSuccess: 'İstifadəçi blokdan çıxarıldı',
      report: 'Şikayət et',
      reportDesc: 'Bu istifadəçini şikayət edin',
      reportSuccess: 'İstifadəçi şikayət edildi',
      reportReason: 'Şikayət səbəbi',
      follow: 'İzlə',
      followDesc: 'Bu istifadəçini izləyin',
      unfollow: 'İzləməyi dayandır',
      unfollowDesc: 'Bu istifadəçini izləməyi dayandırın',
      followSuccess: 'İstifadəçi izlənilir',
      unfollowSuccess: 'İzləmə dayandırıldı',
      addToFavorites: 'Sevimlilərə əlavə et',
      addToFavoritesDesc: 'Bu istifadəçini sevimlilərə əlavə edin',
      removeFromFavorites: 'Sevimlilərdən çıxar',
      removeFromFavoritesDesc: 'Bu istifadəçini sevimlilərdən çıxarın',
      favoriteSuccess: 'Sevimlilərə əlavə edildi',
      unfavoriteSuccess: 'Sevimlilərdən çıxarıldı',
      mute: 'Səssizə al',
      muteDesc: 'Bu istifadəçinin məzmununu gizlədin',
      unmute: 'Səsini aç',
      unmuteDesc: 'Bu istifadəçinin səsini açın',
      muteSuccess: 'İstifadəçi səssizə alındı',
      unmuteSuccess: 'İstifadəçinin səsi açıldı',
      share: 'Profili paylaş',
      shareDesc: 'Bu istifadəçinin profilini paylaşın',
      trust: 'Etibar et',
      trustDesc: 'Bu istifadəçiyə etibar edin',
      untrust: 'Etibarsız say',
      untrustDesc: 'Bu istifadəçini etibarsız sayın',
      trustSuccess: 'İstifadəçi etibarlı kimi qeyd edildi',
      untrustSuccess: 'İstifadəçi etibarsız kimi qeyd edildi',
      subscribe: 'Bildirişlərə abunə ol',
      subscribeDesc: 'Yeni elanları üçün bildiriş alın',
      unsubscribe: 'Abunəlikdən çıx',
      unsubscribeDesc: 'Bildirişləri dayandırın',
      subscribeSuccess: 'Bildirişlərə abunə oldunuz',
      unsubscribeSuccess: 'Abunəlikdən çıxdınız',
      addNote: 'Qeyd əlavə et',
      addNoteDesc: 'Bu istifadəçi haqqında qeyd əlavə edin',
      editNote: 'Qeydi redaktə et',
      editNoteDesc: 'Bu istifadəçi haqqında qeydi redaktə edin',
      removeNote: 'Qeydi sil',
      removeNoteDesc: 'Bu istifadəçi haqqında qeydi silin',
      noteSuccess: 'Qeyd əlavə edildi',
      noteRemoved: 'Qeyd silindi',
      notePlaceholder: 'İstifadəçi haqqında qeydlərinizi yazın...',
      save: 'Yadda saxla',
      yes: 'Bəli',
      no: 'Xeyr',
    },
    ru: {
      userActions: 'Действия пользователя',
      nudge: 'Подтолкнуть',
      nudgeDesc: 'Подтолкнуть пользователя',
      block: 'Заблокировать',
      blockDesc: 'Заблокировать этого пользователя',
      unblock: 'Разблокировать',
      unblockDesc: 'Разблокировать этого пользователя',
      cancel: 'Отмена',
      nudgeSuccess: 'Пользователь подтолкнут!',
      nudgeLimit: 'Вы уже подтолкнули этого пользователя сегодня. Подождите 24 часа.',
      blockConfirm: 'Вы уверены, что хотите заблокировать этого пользователя?',
      blockSuccess: 'Пользователь заблокирован',
      unblockConfirm: 'Вы уверены, что хотите разблокировать этого пользователя?',
      unblockSuccess: 'Пользователь разблокирован',
      report: 'Пожаловаться',
      reportDesc: 'Пожаловаться на этого пользователя',
      reportSuccess: 'Жалоба отправлена',
      reportReason: 'Причина жалобы',
      follow: 'Подписаться',
      followDesc: 'Подписаться на этого пользователя',
      unfollow: 'Отписаться',
      unfollowDesc: 'Отписаться от этого пользователя',
      followSuccess: 'Вы подписались на пользователя',
      unfollowSuccess: 'Вы отписались от пользователя',
      addToFavorites: 'В избранное',
      addToFavoritesDesc: 'Добавить пользователя в избранное',
      removeFromFavorites: 'Из избранного',
      removeFromFavoritesDesc: 'Удалить пользователя из избранного',
      favoriteSuccess: 'Добавлено в избранное',
      unfavoriteSuccess: 'Удалено из избранного',
      mute: 'Заглушить',
      muteDesc: 'Скрыть контент этого пользователя',
      unmute: 'Включить звук',
      unmuteDesc: 'Показать контент этого пользователя',
      muteSuccess: 'Пользователь заглушен',
      unmuteSuccess: 'Звук пользователя включен',
      share: 'Поделиться профилем',
      shareDesc: 'Поделиться профилем этого пользов��теля',
      trust: 'Доверять',
      trustDesc: 'Отметить пользователя как надежного',
      untrust: 'Не доверять',
      untrustDesc: 'Отметить пользователя как ненадежного',
      trustSuccess: 'Пользователь отмечен как надежный',
      untrustSuccess: 'Пользователь отмечен как ненадежный',
      subscribe: 'Подписаться на уведомления',
      subscribeDesc: 'Получать уведомления о новых объявлениях',
      unsubscribe: 'Отписаться от уведомлений',
      unsubscribeDesc: 'Отключить уведомления',
      subscribeSuccess: 'Вы подписались на уведомления',
      unsubscribeSuccess: 'Вы отписались от уведомлений',
      addNote: 'Добавить заметку',
      addNoteDesc: 'Добавить заметку об этом пользователе',
      editNote: 'Редактировать заметку',
      editNoteDesc: 'Редактировать заметку об этом пользователе',
      removeNote: 'Удалить заметку',
      removeNoteDesc: 'Удалить заметку об этом пользователе',
      noteSuccess: 'Заметка добавлена',
      noteRemoved: 'Заметка удалена',
      notePlaceholder: 'Напишите свои заметки о пользователе...',
      save: 'Сохранить',
      yes: 'Да',
      no: 'Нет',
    },
  };

  const t = texts[language];

  const handleNudge = async () => {
    if (!canNudge) {
      Alert.alert('', t.nudgeLimit);
      return;
    }

    setIsLoading(true);
    try {
      nudgeUser(user.id);
      
      // Add notification for the nudged user (simulated)
      addNotification({
        type: 'nudge',
        title: t.nudge,
        message: `${currentUser?.name || 'Kimsə'} sizi dürtdü`,
        fromUserId: currentUser?.id,
        fromUserName: currentUser?.name,
        fromUserAvatar: currentUser?.avatar,
        data: { userId: currentUser?.id }
      });

      Alert.alert('', t.nudgeSuccess);
      onClose();
    } catch (error) {
      logger.error('Nudge error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = () => {
    Alert.alert(
      '',
      t.blockConfirm,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: () => {
            blockUser(user.id);
            Alert.alert('', t.blockSuccess);
            onClose();
          },
        },
      ]
    );
  };

  const handleUnblock = () => {
    Alert.alert(
      '',
      t.unblockConfirm,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          onPress: () => {
            unblockUser(user.id);
            Alert.alert('', t.unblockSuccess);
            onClose();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    setShowReportInput(true);
  };

  const handleSubmitReport = () => {
    // ✅ Validate input
    if (!reportText.trim()) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Şikayət səbəbini yazın' : 'Напишите причину жалобы'
      );
      return;
    }

    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      reportUser(user.id, reportText.trim());
      Alert.alert('', t.reportSuccess);
      setShowReportInput(false);
      setReportText('');
      onClose();
    } catch (error) {
      logger.error('[UserActionModal] Report error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Şikayət göndərilmədi' : 'Не удалось отправить жалобу'
      );
    }
  };

  const handleFollow = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      if (isFollowed) {
        unfollowUser(user.id);
        Alert.alert('', t.unfollowSuccess);
      } else {
        followUser(user.id);
        Alert.alert('', t.followSuccess);
      }
    } catch (error) {
      logger.error('[UserActionModal] Follow/unfollow error:', error);
    }
  };

  const handleFavorite = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      if (isFavorite) {
        removeFromFavoriteUsers(user.id);
        Alert.alert('', t.unfavoriteSuccess);
      } else {
        addToFavoriteUsers(user.id);
        Alert.alert('', t.favoriteSuccess);
      }
    } catch (error) {
      logger.error('[UserActionModal] Favorite/unfavorite error:', error);
    }
  };

  const handleMute = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      if (isMuted) {
        unmuteUser(user.id);
        Alert.alert('', t.unmuteSuccess);
      } else {
        muteUser(user.id);
        Alert.alert('', t.muteSuccess);
      }
    } catch (error) {
      logger.error('[UserActionModal] Mute/unmute error:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${user.name} profilini görün - ${user.location[language] || user.location.az}`,
        title: user.name,
      });
    } catch (error) {
      logger.error('Share error:', error);
    }
  };

  const handleTrust = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      if (isTrusted) {
        untrustUser(user.id);
        Alert.alert('', t.untrustSuccess);
      } else {
        trustUser(user.id);
        Alert.alert('', t.trustSuccess);
      }
    } catch (error) {
      logger.error('[UserActionModal] Trust/untrust error:', error);
    }
  };

  const handleSubscribe = async () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    setIsLoading(true);
    try {
      if (isSubscribed) {
        unsubscribeFromUser(user.id);
        Alert.alert('', t.unsubscribeSuccess);
      } else {
        subscribeToUser(user.id);
        Alert.alert('', t.subscribeSuccess);
      }
    } catch (error) {
      logger.error('Subscribe/unsubscribe error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Əməliyyat uğursuz oldu' : 'Операция не удалась'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNote = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    if (userNote) {
      setNoteText(userNote);
    } else {
      setNoteText('');
    }
    setShowNoteInput(true);
  };

  const handleSaveNote = () => {
    // ✅ Validate user data
    if (!user?.id) {
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'İstifadəçi məlumatı tapılmadı' : 'Информация о пользователе не найдена'
      );
      return;
    }

    try {
      if (noteText.trim()) {
        addUserNote(user.id, noteText.trim());
        Alert.alert('', t.noteSuccess);
      } else {
        removeUserNote(user.id);
        Alert.alert('', t.noteRemoved);
      }
      setShowNoteInput(false);
      setNoteText('');
    } catch (error) {
      logger.error('[UserActionModal] Note save error:', error);
      Alert.alert(
        language === 'az' ? 'Xəta' : 'Ошибка',
        language === 'az' ? 'Qeyd yadda saxlanmadı' : 'Не удалось сохранить заметку'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <BlurView intensity={20} style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.userActions}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.content}>
            {!showNoteInput && !showReportInput ? (
              <>
                {!isBlocked && (
                  <TouchableOpacity
                    style={[styles.actionButton, !canNudge && styles.disabledButton]}
                    onPress={handleNudge}
                    disabled={!canNudge || isLoading}
                  >
                    <View style={styles.actionIcon}>
                      <Badge size={20} color={canNudge ? "#007AFF" : "#999"} />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={[styles.actionTitle, !canNudge && styles.disabledText]}>
                        {t.nudge}
                      </Text>
                      <Text style={[styles.actionDesc, !canNudge && styles.disabledText]}>
                        {t.nudgeDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleFollow}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {isFollowed ? (
                        <UserMinus size={20} color="#FF9500" />
                      ) : (
                        <UserPlus size={20} color="#007AFF" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {isFollowed ? t.unfollow : t.follow}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {isFollowed ? t.unfollowDesc : t.followDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleFavorite}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {isFavorite ? (
                        <HeartOff size={20} color="#FF3B30" />
                      ) : (
                        <Heart size={20} color="#FF3B30" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {isFavorite ? t.removeFromFavorites : t.addToFavorites}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {isFavorite ? t.removeFromFavoritesDesc : t.addToFavoritesDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleMute}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {isMuted ? (
                        <Volume2 size={20} color="#34C759" />
                      ) : (
                        <VolumeX size={20} color="#FF9500" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {isMuted ? t.unmute : t.mute}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {isMuted ? t.unmuteDesc : t.muteDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      <Share2 size={20} color="#007AFF" />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>{t.share}</Text>
                      <Text style={styles.actionDesc}>{t.shareDesc}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleTrust}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {isTrusted ? (
                        <ShieldOff size={20} color="#FF9500" />
                      ) : (
                        <Shield size={20} color="#34C759" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {isTrusted ? t.untrust : t.trust}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {isTrusted ? t.untrustDesc : t.trustDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSubscribe}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {isSubscribed ? (
                        <BellOff size={20} color="#FF9500" />
                      ) : (
                        <Bell size={20} color="#007AFF" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {isSubscribed ? t.unsubscribe : t.subscribe}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {isSubscribed ? t.unsubscribeDesc : t.subscribeDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleNote}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      {userNote ? (
                        <Edit3 size={20} color="#007AFF" />
                      ) : (
                        <StickyNote size={20} color="#007AFF" />
                      )}
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>
                        {userNote ? t.editNote : t.addNote}
                      </Text>
                      <Text style={styles.actionDesc}>
                        {userNote ? t.editNoteDesc : t.addNoteDesc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!isBlocked && !isReported && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleReport}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      <Flag size={20} color="#FF3B30" />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={[styles.actionTitle, { color: '#FF3B30' }]}>
                        {t.report}
                      </Text>
                      <Text style={styles.actionDesc}>{t.reportDesc}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {isBlocked ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleUnblock}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      <UserCheck size={20} color="#34C759" />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={styles.actionTitle}>{t.unblock}</Text>
                      <Text style={styles.actionDesc}>{t.unblockDesc}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBlock}
                    disabled={isLoading}
                  >
                    <View style={styles.actionIcon}>
                      <UserX size={20} color="#FF3B30" />
                    </View>
                    <View style={styles.actionText}>
                      <Text style={[styles.actionTitle, { color: '#FF3B30' }]}>
                        {t.block}
                      </Text>
                      <Text style={styles.actionDesc}>{t.blockDesc}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            ) : showNoteInput ? (
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputTitle}>
                  {userNote ? t.editNote : t.addNote}
                </Text>
                <TextInput
                  style={styles.noteInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder={t.notePlaceholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.noteButtons}>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.cancelNoteButton]}
                    onPress={() => {
                      setShowNoteInput(false);
                      setNoteText('');
                    }}
                  >
                    <Text style={styles.cancelNoteText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.saveNoteButton]}
                    onPress={handleSaveNote}
                  >
                    <Text style={styles.saveNoteText}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputTitle}>
                  {t.reportReason}
                </Text>
                <TextInput
                  style={styles.noteInput}
                  value={reportText}
                  onChangeText={setReportText}
                  placeholder={t.reportDesc}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.noteButtons}>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.cancelNoteButton]}
                    onPress={() => {
                      setShowReportInput(false);
                      setReportText('');
                    }}
                  >
                    <Text style={styles.cancelNoteText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteButton, styles.saveNoteButton]}
                    onPress={handleSubmitReport}
                  >
                    <Text style={styles.saveNoteText}>{t.report}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
              </View>
            </ScrollView>

            {!showNoteInput && !showReportInput && (
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  noteInputContainer: {
    padding: 4,
  },
  noteInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    backgroundColor: '#f8f9fa',
  },
  noteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  noteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelNoteButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  saveNoteButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelNoteText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveNoteText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});