import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useCallStore } from '@/store/callStore';
import { useLanguageStore } from '@/store/languageStore';
import { users } from '@/mocks/users';
import { listings } from '@/mocks/listings';
import Colors from '@/constants/colors';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  RotateCcw,
} from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const callId = Array.isArray(id) ? id[0] : id;
  
  const { activeCall, endCall, toggleMute, toggleSpeaker, toggleVideo } = useCallStore();
  const { language } = useLanguageStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');

  useEffect(() => {
    if (!activeCall || activeCall.id !== callId) {
      router.back();
      return;
    }

    // Simulate connection after 3 seconds
    const connectionTimer = setTimeout(() => {
      setIsConnected(true);
    }, 3000);

    return () => clearTimeout(connectionTimer);
  }, [activeCall, callId]);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  if (!activeCall || !callId) {
    return null;
  }

  // BUG FIX #14-15: Add null checks for find() results
  const otherUserId = activeCall.callerId === 'user1' ? activeCall.receiverId : activeCall.callerId;
  const otherUser = users.find(user => user.id === otherUserId);
  const listing = listings.find(l => l.id === activeCall.listingId);
  
  // Handle missing user or listing gracefully
  if (!otherUser) {
    console.error('User not found:', otherUserId);
    router.back();
    return null;
  }

  const handleEndCall = () => {
    endCall(callId);
    router.back();
  };

  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const renderVideoCall = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.videoContainer}>
          <View style={styles.remoteVideo}>
            {/* BUG FIX #16: Safe avatar access */}
            <Image 
              source={{ uri: otherUser.avatar || 'https://via.placeholder.com/120' }} 
              style={styles.remoteVideoPlaceholder}
            />
            <Text style={styles.remoteVideoText}>
              {otherUser.name || 'Unknown User'}
            </Text>
            <Text style={[styles.permissionText, { marginTop: 12 }]}>
              {language === 'az' ? 'Video zəng web versiyasında məhdud dəstəklənir' : 'Видеозвонок ограниченно поддерживается в веб-версии'}
            </Text>
          </View>
        </View>
      );
    }

    if (!permission) {
      return (
        <View style={styles.videoContainer}>
          <Text style={styles.permissionText}>
            {language === 'az' ? 'Kamera icazəsi yoxlanılır...' : 'Проверка разрешения камеры...'}
          </Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.videoContainer}>
          <Text style={styles.permissionText}>
            {language === 'az' ? 'Video zəng üçün kamera icazəsi lazımdır' : 'Для видеозвонка требуется разрешение камеры'}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>
              {language === 'az' ? 'İcazə ver' : 'Разрешить'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.videoContainer}>
        {/* Remote user video (simulated) */}
        <View style={styles.remoteVideo}>
          <Image 
            source={{ uri: otherUser.avatar || 'https://via.placeholder.com/120' }} 
            style={styles.remoteVideoPlaceholder}
          />
          <Text style={styles.remoteVideoText}>
            {otherUser.name || 'Unknown User'}
          </Text>
        </View>
        
        {/* Local user video */}
        {activeCall.isVideoEnabled && permission.granted && (
          <View style={styles.localVideo}>
            <CameraView 
              style={styles.localCamera}
              facing={cameraFacing}
            />
          </View>
        )}
        
        {!activeCall.isVideoEnabled && (
          <View style={styles.localVideoOff}>
            <VideoOff size={24} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.backgroundOverlay} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.statusText}>
            {isConnected 
              ? formatDuration(callDuration)
              : (language === 'az' ? 'Qoşulur...' : 'Соединение...')
            }
          </Text>
          <Text style={styles.listingTitle}>
            {listing?.title ? (typeof listing.title === 'string' ? listing.title : listing.title?.[language] || listing.title?.az || '') : 'Unknown Listing'}
          </Text>
        </View>
        
        {activeCall.type === 'video' ? (
          renderVideoCall()
        ) : (
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: otherUser.avatar || 'https://via.placeholder.com/120' }} 
              style={styles.userAvatar}
            />
            <Text style={styles.userName}>{otherUser.name || 'Unknown User'}</Text>
            <Text style={styles.callType}>
              {language === 'az' ? 'Səsli zəng' : 'Голосовой звонок'}
            </Text>
          </View>
        )}
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, activeCall.isMuted && styles.activeControl]}
            onPress={toggleMute}
            testID="mute-button"
          >
            {activeCall.isMuted ? (
              <MicOff size={24} color="#fff" />
            ) : (
              <Mic size={24} color="#fff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, activeCall.isSpeakerOn && styles.activeControl]}
            onPress={toggleSpeaker}
            testID="speaker-button"
          >
            {activeCall.isSpeakerOn ? (
              <Volume2 size={24} color="#fff" />
            ) : (
              <VolumeX size={24} color="#fff" />
            )}
          </TouchableOpacity>
          
          {activeCall.type === 'video' && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, !activeCall.isVideoEnabled && styles.activeControl]}
                onPress={toggleVideo}
                testID="video-button"
              >
                {activeCall.isVideoEnabled ? (
                  <Video size={24} color="#fff" />
                ) : (
                  <VideoOff size={24} color="#fff" />
                )}
              </TouchableOpacity>
              
              {activeCall.isVideoEnabled && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleCameraFacing}
                  testID="flip-camera-button"
                >
                  <RotateCcw size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        
        <View style={styles.endCallContainer}>
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
            testID="end-call-button"
          >
            <PhoneOff size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.privacyNote}>
          {language === 'az' 
            ? 'Bu zəng tətbiq üzərindən həyata keçirilir'
            : 'Этот звонок осуществляется через приложение'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  userInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  userAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  callType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeControl: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  endCallContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  privacyNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  remoteVideoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  remoteVideoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localCamera: {
    flex: 1,
  },
  localVideoOff: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});