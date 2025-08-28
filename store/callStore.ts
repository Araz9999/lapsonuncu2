import { create } from 'zustand';
import { Call, ActiveCall, CallStatus, CallType } from '@/types/call';
import { users } from '@/mocks/users';
import { Platform } from 'react-native';

interface CallStore {
  calls: Call[];
  activeCall: ActiveCall | null;
  incomingCall: Call | null;
  ringtoneSound: any | null;
  dialToneSound: any | null;
  
  // Call actions
  initiateCall: (receiverId: string, listingId: string, type: CallType) => Promise<string>;
  answerCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: (callId: string) => void;
  
  // Active call controls
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  
  // Call history
  getCallHistory: (userId: string) => Call[];
  markCallAsRead: (callId: string) => void;
  getMissedCallsCount: () => number;
  deleteCall: (callId: string) => void;
  clearAllCallHistory: () => void;
  
  // Sound management
  initializeSounds: () => Promise<void>;
  playRingtone: () => Promise<void>;
  playDialTone: () => Promise<void>;
  stopAllSounds: () => Promise<void>;
  
  // Notifications
  simulateIncomingCall: () => void;
}

// Mock initial calls
const initialCalls: Call[] = [
  {
    id: '1',
    callerId: 'user2',
    receiverId: 'user1',
    listingId: '2',
    type: 'voice',
    status: 'ended',
    startTime: '2023-06-20T15:30:00.000Z',
    endTime: '2023-06-20T15:35:00.000Z',
    duration: 300,
    isRead: true,
  },
  {
    id: '2',
    callerId: 'user1',
    receiverId: 'user3',
    listingId: '3',
    type: 'voice',
    status: 'missed',
    startTime: '2023-06-19T11:15:00.000Z',
    duration: 0,
    isRead: false,
  },
  {
    id: '3',
    callerId: 'user4',
    receiverId: 'user1',
    listingId: '1',
    type: 'voice',
    status: 'ended',
    startTime: '2023-06-18T19:20:00.000Z',
    endTime: '2023-06-18T19:22:00.000Z',
    duration: 120,
    isRead: true,
  },
];

export const useCallStore = create<CallStore>((set, get) => ({
  calls: initialCalls,
  activeCall: null,
  incomingCall: null,
  ringtoneSound: null,
  dialToneSound: null,
  
  initiateCall: async (receiverId: string, listingId: string, type: CallType) => {
    console.log('CallStore - initiating call to:', receiverId);
    
    const callId = Date.now().toString();
    const newCall: Call = {
      id: callId,
      callerId: 'user1', // Current user
      receiverId,
      listingId,
      type,
      status: 'outgoing',
      startTime: new Date().toISOString(),
      isRead: true,
    };
    
    // Add to call history
    set((state) => ({
      calls: [newCall, ...state.calls],
    }));
    
    // Create active call
    const activeCall: ActiveCall = {
      id: callId,
      callerId: 'user1',
      receiverId,
      listingId,
      type,
      startTime: new Date().toISOString(),
      isMuted: false,
      isSpeakerOn: false,
      isVideoEnabled: type === 'video',
    };
    
    set({ activeCall });
    
    // Play dial tone for outgoing call
    if (Platform.OS !== 'web') {
      get().playDialTone();
    }
    
    // Simulate call being answered after 3 seconds
    setTimeout(() => {
      const currentState = get();
      if (currentState.activeCall?.id === callId) {
        get().stopAllSounds();
        set((state) => ({
          calls: state.calls.map(call => 
            call.id === callId 
              ? { ...call, status: 'active' as CallStatus }
              : call
          ),
        }));
      }
    }, 3000);
    
    return callId;
  },
  
  answerCall: (callId: string) => {
    console.log('CallStore - answering call:', callId);
    
    const call = get().calls.find(c => c.id === callId);
    if (!call) return;
    
    // Stop ringtone
    get().stopAllSounds();
    
    // Update call status
    set((state) => ({
      calls: state.calls.map(c => 
        c.id === callId 
          ? { ...c, status: 'active' as CallStatus }
          : c
      ),
      incomingCall: null,
    }));
    
    // Create active call
    const activeCall: ActiveCall = {
      id: callId,
      callerId: call.callerId,
      receiverId: call.receiverId,
      listingId: call.listingId,
      type: call.type,
      startTime: new Date().toISOString(),
      isMuted: false,
      isSpeakerOn: false,
      isVideoEnabled: call.type === 'video',
    };
    
    set({ activeCall });
  },
  
  declineCall: (callId: string) => {
    console.log('CallStore - declining call:', callId);
    
    // Stop ringtone
    get().stopAllSounds();
    
    set((state) => ({
      calls: state.calls.map(call => 
        call.id === callId 
          ? { ...call, status: 'declined' as CallStatus, endTime: new Date().toISOString() }
          : call
      ),
      incomingCall: null,
    }));
  },
  
  endCall: (callId: string) => {
    console.log('CallStore - ending call:', callId);
    
    const activeCall = get().activeCall;
    if (!activeCall) return;
    
    // Stop all sounds
    get().stopAllSounds();
    
    const endTime = new Date().toISOString();
    const startTime = new Date(activeCall.startTime).getTime();
    const duration = Math.floor((new Date(endTime).getTime() - startTime) / 1000);
    
    set((state) => ({
      calls: state.calls.map(call => 
        call.id === callId 
          ? { 
              ...call, 
              status: 'ended' as CallStatus, 
              endTime,
              duration 
            }
          : call
      ),
      activeCall: null,
    }));
  },
  
  toggleMute: () => {
    set((state) => ({
      activeCall: state.activeCall 
        ? { ...state.activeCall, isMuted: !state.activeCall.isMuted }
        : null,
    }));
  },
  
  toggleSpeaker: () => {
    set((state) => ({
      activeCall: state.activeCall 
        ? { ...state.activeCall, isSpeakerOn: !state.activeCall.isSpeakerOn }
        : null,
    }));
  },
  
  toggleVideo: () => {
    set((state) => ({
      activeCall: state.activeCall 
        ? { ...state.activeCall, isVideoEnabled: !state.activeCall.isVideoEnabled }
        : null,
    }));
  },
  
  getCallHistory: (userId: string) => {
    return get().calls.filter(call => 
      call.callerId === userId || call.receiverId === userId
    );
  },
  
  markCallAsRead: (callId: string) => {
    set((state) => ({
      calls: state.calls.map(call => 
        call.id === callId 
          ? { ...call, isRead: true }
          : call
      ),
    }));
  },
  
  getMissedCallsCount: () => {
    return get().calls.filter(call => 
      call.receiverId === 'user1' && 
      call.status === 'missed' && 
      !call.isRead
    ).length;
  },
  
  deleteCall: (callId: string) => {
    console.log('CallStore - deleting call:', callId);
    set((state) => ({
      calls: state.calls.filter(call => call.id !== callId),
    }));
  },
  
  clearAllCallHistory: () => {
    console.log('CallStore - clearing all call history');
    set({ calls: [] });
  },
  
  initializeSounds: async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const { Audio } = await import('expo-av');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('Audio mode configured for calls');
      // We'll use haptic feedback instead of sound files for now
      set({ ringtoneSound: null, dialToneSound: null });
    } catch (error) {
      console.error('Failed to initialize sounds:', error);
    }
  },
  
  playRingtone: async () => {
    if (Platform.OS === 'web') return;
    
    try {
      // Use haptic feedback for ringtone
      const Haptics = await import('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('Playing ringtone with haptic feedback');
      
      // Create a repeating pattern for incoming call
      const ringtoneInterval = setInterval(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
          console.log('Haptic feedback error:', error);
        }
      }, 1000);
      
      // Store interval for cleanup
      (get() as any).ringtoneInterval = ringtoneInterval;
    } catch (error) {
      console.error('Failed to play ringtone:', error);
    }
  },
  
  playDialTone: async () => {
    if (Platform.OS === 'web') return;
    
    try {
      // Use haptic feedback for dial tone
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('Playing dial tone with haptic feedback');
      
      // Create a repeating pattern for outgoing call
      const dialToneInterval = setInterval(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          console.log('Haptic feedback error:', error);
        }
      }, 2000);
      
      // Store interval for cleanup
      (get() as any).dialToneInterval = dialToneInterval;
    } catch (error) {
      console.error('Failed to play dial tone:', error);
    }
  },
  
  stopAllSounds: async () => {
    if (Platform.OS === 'web') return;
    
    const state = get() as any;
    
    try {
      // Clear haptic intervals
      if (state.ringtoneInterval) {
        clearInterval(state.ringtoneInterval);
        state.ringtoneInterval = null;
      }
      if (state.dialToneInterval) {
        clearInterval(state.dialToneInterval);
        state.dialToneInterval = null;
      }
      
      // Stop any actual sounds if they exist
      if (state.ringtoneSound) {
        await state.ringtoneSound.stopAsync();
      }
      if (state.dialToneSound) {
        await state.dialToneSound.stopAsync();
      }
      
      console.log('All sounds and haptic patterns stopped');
    } catch (error) {
      console.error('Failed to stop sounds:', error);
    }
  },
  
  simulateIncomingCall: async () => {
    const callers = ['user2', 'user3', 'user4'];
    const listings = ['1', '2', '3'];
    const callTypes: CallType[] = ['voice', 'video'];
    const randomCaller = callers[Math.floor(Math.random() * callers.length)];
    const randomListing = listings[Math.floor(Math.random() * listings.length)];
    const randomCallType = callTypes[Math.floor(Math.random() * callTypes.length)];
    
    const callId = Date.now().toString();
    const incomingCall: Call = {
      id: callId,
      callerId: randomCaller,
      receiverId: 'user1',
      listingId: randomListing,
      type: randomCallType,
      status: 'incoming',
      startTime: new Date().toISOString(),
      isRead: false,
    };
    
    // Add to call history
    set((state) => ({
      calls: [incomingCall, ...state.calls],
      incomingCall,
    }));
    
    // Play ringtone for incoming call
    if (Platform.OS !== 'web') {
      get().playRingtone();
    }
    
    // Send notification if supported
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const Notifications = await import('expo-notifications');
          const caller = users.find(u => u.id === randomCaller);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: incomingCall.type === 'video' ? 'Gələn video zəng' : 'Gələn zəng',
              body: `${caller?.name || 'Naməlum istifadəçi'} sizə ${incomingCall.type === 'video' ? 'video ' : ''}zəng edir`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              categoryIdentifier: 'call',
            },
            trigger: null,
          });
        } catch (error) {
          console.log('Notifications not available:', error);
        }
      })();
    }
    
    // Auto-decline after 30 seconds if not answered
    setTimeout(() => {
      const currentState = get();
      if (currentState.incomingCall?.id === callId) {
        get().declineCall(callId);
        
        // Mark as missed
        set((state) => ({
          calls: state.calls.map(call => 
            call.id === callId 
              ? { ...call, status: 'missed' as CallStatus }
              : call
          ),
        }));
      }
    }, 30000);
  },
}));