import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback to localhost for development
  if (__DEV__) {
    console.warn('EXPO_PUBLIC_RORK_API_BASE_URL not set, using localhost:3001');
    return 'http://localhost:3001';
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

// Cache for auth headers to avoid repeated AsyncStorage reads
let cachedAuthHeader: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

export const trpcClient = trpc.createClient({
  links: [
    // Only enable logger in development
    ...(process.env.NODE_ENV === 'development' 
      ? [loggerLink({
          enabled: () => false, // Disable even in dev for better performance
        })]
      : []
    ),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const now = Date.now();
          // Use cached header if still valid
          if (cachedAuthHeader && (now - cacheTimestamp) < CACHE_DURATION) {
            return cachedAuthHeader;
          }
          
          const raw = await AsyncStorage.getItem('auth_tokens');
          if (!raw) {
            cachedAuthHeader = {};
            cacheTimestamp = now;
            return {};
          }
          let tokens;
          try {
            tokens = JSON.parse(raw);
          } catch {
            // Invalid JSON, clear cache
            cachedAuthHeader = {};
            cacheTimestamp = now;
            return {};
          }
          if (tokens?.accessToken) {
            cachedAuthHeader = { Authorization: `Bearer ${tokens.accessToken}` };
            cacheTimestamp = now;
            return cachedAuthHeader;
          }
        } catch {}
        cachedAuthHeader = {};
        cacheTimestamp = Date.now();
        return {};
      },
    }),
  ],
  // Add error handling for network issues
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on network errors to prevent infinite loops
          if (error?.message?.includes('fetch')) {
            return false;
          }
          return failureCount < 2;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 30, // 30 minutes
      },
    },
  },
});

// Export function to clear auth cache when needed
export const clearAuthCache = () => {
  cachedAuthHeader = null;
  cacheTimestamp = 0;
};
