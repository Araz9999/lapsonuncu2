import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform, Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'red';
export type FontSize = 'small' | 'medium' | 'large';

interface ThemeState {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  fontSize: FontSize;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoRefresh: boolean;
  showPriceInTitle: boolean;
  compactMode: boolean;
  animationEffectsEnabled: boolean;
  dynamicColorsEnabled: boolean;
  adaptiveInterfaceEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setFontSize: (size: FontSize) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setShowPriceInTitle: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setAnimationEffectsEnabled: (enabled: boolean) => void;
  setDynamicColorsEnabled: (enabled: boolean) => void;
  setAdaptiveInterfaceEnabled: (enabled: boolean) => void;
  sendNotification: (title: string, body: string) => Promise<void>;
  playNotificationSound: () => void;
  triggerVibration: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'auto',
      colorTheme: 'default',
      fontSize: 'medium',
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      autoRefresh: true,
      showPriceInTitle: true,
      compactMode: false,
      animationEffectsEnabled: true,
      dynamicColorsEnabled: true,
      adaptiveInterfaceEnabled: true,
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        // Apply system theme changes immediately
        if (mode === 'auto') {
          const colorScheme = Appearance.getColorScheme();
          console.log('Auto theme mode activated, system theme:', colorScheme);
        }
      },
      setColorTheme: (theme) => set({ colorTheme: theme }),
      setFontSize: (size) => set({ fontSize: size }),
      setNotificationsEnabled: async (enabled) => {
        set({ notificationsEnabled: enabled });
        if (enabled && Platform.OS !== 'web') {
          try {
            // Only try to import notifications if we're not on web
            const Notifications = await import('expo-notifications');
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
              console.log('Notification permissions not granted');
            }
          } catch (error) {
            console.log('Notifications not available:', error);
          }
        }
      },
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      setShowPriceInTitle: (enabled) => set({ showPriceInTitle: enabled }),
      setCompactMode: (enabled) => set({ compactMode: enabled }),
      setAnimationEffectsEnabled: (enabled) => {
        set({ animationEffectsEnabled: enabled });
        console.log('Animation effects:', enabled ? 'enabled' : 'disabled');
      },
      setDynamicColorsEnabled: (enabled) => {
        set({ dynamicColorsEnabled: enabled });
        console.log('Dynamic colors:', enabled ? 'enabled' : 'disabled');
      },
      setAdaptiveInterfaceEnabled: (enabled) => {
        set({ adaptiveInterfaceEnabled: enabled });
        console.log('Adaptive interface:', enabled ? 'enabled' : 'disabled');
      },
      sendNotification: async (title: string, body: string) => {
        const state = get();
        if (!state.notificationsEnabled) return;
        
        if (Platform.OS !== 'web') {
          try {
            const Notifications = await import('expo-notifications');
            await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                sound: state.soundEnabled ? 'default' : undefined,
              },
              trigger: null,
            });
            
            if (state.vibrationEnabled) {
              try {
                const Haptics = await import('expo-haptics');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (hapticsError) {
                console.log('Haptics not available:', hapticsError);
              }
            }
          } catch (error) {
            console.log('Failed to send notification:', error);
          }
        } else {
          // Web fallback
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
          }
        }
      },
      playNotificationSound: () => {
        const state = get();
        if (!state.soundEnabled) return;
        
        if (Platform.OS !== 'web') {
          // Play notification sound
          console.log('Playing notification sound');
        }
      },
      triggerVibration: async () => {
        const state = get();
        if (!state.vibrationEnabled) return;
        
        if (Platform.OS !== 'web') {
          try {
            const Haptics = await import('expo-haptics');
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            console.log('Vibration not available:', error);
          }
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Configure notifications
if (Platform.OS !== 'web') {
  (async () => {
    try {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (error) {
      console.log('Notifications not available:', error);
    }
  })();
}

// Listen to system theme changes
if (Platform.OS !== 'web') {
  Appearance.addChangeListener(({ colorScheme }) => {
    const store = useThemeStore.getState();
    if (store.themeMode === 'auto') {
      console.log('System theme changed to:', colorScheme);
      // Force re-render by updating a dummy state
      store.setThemeMode('auto');
    }
  });
}