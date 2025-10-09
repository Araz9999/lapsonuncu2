import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // Base URLs
  BASE_URL: Platform.select({
    web: typeof window !== 'undefined' && window.location ? `${window.location.origin}/api` : 'http://localhost:8081/api',
    default: 'http://localhost:8081/api'
  }),
  
  // AI Services
  OPENAI_API_KEY: 'your-openai-api-key-here',
  
  // Payment Services
  STRIPE_PUBLISHABLE_KEY: Platform.select({
    web: 'pk_test_your_stripe_web_key_here',
    default: 'pk_test_your_stripe_mobile_key_here'
  }),
  PAYPAL_CLIENT_ID: 'your-paypal-client-id-here',
  
  // Payriff Payment Gateway
  PAYRIFF_MERCHANT_ID: 'ES1094797',
  PAYRIFF_SECRET_KEY: '719857DED4904989A4E2AAA2CDAEBB07',
  PAYRIFF_BASE_URL: 'https://api.payriff.com',
  FRONTEND_URL: 'https://1r36dhx42va8pxqbqz5ja.rork.app',
  
  // Push Notifications
  EXPO_PUSH_TOKEN: 'your-expo-push-token-here',
  FCM_SERVER_KEY: 'your-fcm-server-key-here',
  
  // Analytics
  GOOGLE_ANALYTICS_ID: 'your-google-analytics-id-here',
  MIXPANEL_TOKEN: 'your-mixpanel-token-here',
  
  // Social Login
  GOOGLE_CLIENT_ID: Platform.select({
    ios: 'your-google-ios-client-id-here',
    android: 'your-google-android-client-id-here',
    web: 'your-google-web-client-id-here'
  }),
  FACEBOOK_APP_ID: 'your-facebook-app-id-here',
  
  // Maps & Location
  GOOGLE_MAPS_API_KEY: Platform.select({
    ios: 'your-google-maps-ios-key-here',
    android: 'your-google-maps-android-key-here',
    web: 'your-google-maps-web-key-here'
  }),
  
  // File Storage
  AWS_ACCESS_KEY_ID: 'your-aws-access-key-here',
  AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key-here',
  AWS_REGION: 'your-aws-region-here',
  AWS_BUCKET_NAME: 'your-s3-bucket-name-here',
  
  // SMS Services
  TWILIO_ACCOUNT_SID: 'your-twilio-account-sid-here',
  TWILIO_AUTH_TOKEN: 'your-twilio-auth-token-here',
  
  // Email Services
  SENDGRID_API_KEY: 'your-sendgrid-api-key-here',
  
  // Real-time Communication
  SOCKET_IO_URL: 'wss://your-socket-server.com',
  
  // Feature Flags
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_PAYMENTS: true,
  ENABLE_REAL_TIME_CHAT: true,
  
  // App Configuration
  APP_VERSION: '1.0.0',
  MIN_SUPPORTED_VERSION: '1.0.0',
  FORCE_UPDATE_VERSION: '1.0.0',
  
  // Rate Limiting
  API_RATE_LIMIT: 100, // requests per minute
  
  // Cache Configuration
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    return {
      ...API_CONFIG,
      BASE_URL: Platform.select({
        web: typeof window !== 'undefined' && window.location ? `${window.location.origin}/api` : 'http://localhost:8081/api',
        default: 'http://localhost:8081/api'
      }),
      ENABLE_ANALYTICS: false, // Disable analytics in development
    };
  }
  
  return API_CONFIG;
};

// Helper function to validate required API keys
export const validateApiKeys = () => {
  const config = getEnvironmentConfig();
  const requiredKeys = [
    'BASE_URL',
    'OPENAI_API_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'GOOGLE_MAPS_API_KEY'
  ];
  
  const missingKeys = requiredKeys.filter(key => {
    const value = config[key as keyof typeof config];
    return !value || (typeof value === 'string' && value.includes('your-'));
  });
  
  if (missingKeys.length > 0) {
    console.warn('Missing or placeholder API keys:', missingKeys);
    return false;
  }
  
  return true;
};

// Export default configuration
export default getEnvironmentConfig();