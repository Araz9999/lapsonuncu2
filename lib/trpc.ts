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
          const tokens = JSON.parse(raw);
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
});

// Export function to clear auth cache when needed
export const clearAuthCache = () => {
  cachedAuthHeader = null;
  cacheTimestamp = 0;
};
