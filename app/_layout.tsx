import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, Component, ReactNode, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { useRatingStore } from '@/store/ratingStore';
import { useCallStore } from '@/store/callStore';
import { getColors } from '@/constants/colors';
import IncomingCallModal from '@/components/IncomingCallModal';
import FloatingChatButton from '@/components/FloatingChatButton';
import { LanguageProvider } from '@/store/languageStore';

import { initializeServices, checkServicesHealth } from '@/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const [queryClient] = useState(() => new QueryClient());
  const [fontLoadingComplete, setFontLoadingComplete] = useState(false);

  useEffect(() => {
    if (error) {
      console.warn('Font loading error (non-critical):', error.message);
      setFontLoadingComplete(true);
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      setFontLoadingComplete(true);
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!fontLoadingComplete) {
    return null;
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <RootLayoutNav />
          </LanguageProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { themeMode, colorTheme } = useThemeStore();

  const { loadRatings } = useRatingStore();
  const { initializeSounds } = useCallStore();
  const colors = getColors(themeMode, colorTheme);
  
  // Load ratings on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadRatings();
      } catch (error) {
        console.error('Failed to load ratings:', error);
      }
    };
    loadData();
  }, []); // Remove loadRatings from dependencies to prevent infinite loop
  
  // Initialize call sounds
  useEffect(() => {
    const initSounds = async () => {
      try {
        console.log('Starting sound initialization from layout...');
        await initializeSounds();
        console.log('Sound initialization completed successfully');
      } catch (error) {
        console.error('Failed to initialize sounds in layout:', error);
        // Continue app execution even if sound initialization fails
      }
    };
    
    // Delay sound initialization to ensure app is fully loaded
    const timer = setTimeout(() => {
      initSounds();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []); // Remove initializeSounds from dependencies to prevent infinite loop
  
  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      try {
        await initializeServices();
        checkServicesHealth();
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };
    initServices();
  }, []);
  
  return (
    <>
      <StatusBar style={themeMode === 'dark' || (themeMode === 'auto' && colors.background === '#111827') ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="listing/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="category" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="profile/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            title: "",
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            title: "",
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="create-listing" 
          options={{ 
            title: "",
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="about" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="wallet" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="favorites" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="stores" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="my-store" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/create" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/add-listing/[storeId]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/promote/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="conversation/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="my-listings" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store-management" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/edit/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store/discounts/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="listing/promote/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="listing/edit/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="call/[id]" 
          options={{ 
            title: "",
            presentation: 'fullScreenModal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="call-history" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="blocked-users" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store-settings" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store-analytics" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store-theme" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="payment-history" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="store-reviews" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="auth/forgot-password" 
          options={{ 
            title: "",
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="listing/auto-renewal/[id]" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="support" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="moderation" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="operator-dashboard" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="live-chat" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="terms" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="privacy" 
          options={{ 
            title: "",
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="auth/success" 
          options={{ 
            title: "",
            presentation: 'modal',
            headerShown: false,
          }} 
        />
      </Stack>
      <IncomingCallModal />
      <FloatingChatButton />
    </>
  );
}