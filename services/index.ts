// Import and export all services
import { apiService } from './apiService';
import { paymentService } from './paymentService';
import { notificationService } from './notificationService';
import { analyticsService } from './analyticsService';
import { storageService } from './storageService';
import { authService } from './authService';
import { payriffService } from './payriffService';

export { apiService, paymentService, notificationService, analyticsService, storageService, authService, payriffService };

// Export types
export type { PaymentMethod, PaymentIntent } from './paymentService';
export type { PayriffPaymentRequest, PayriffPaymentResponse, PayriffPaymentStatus } from './payriffService';
export type { PushNotification } from './notificationService';
export type { AnalyticsEvent, UserProperties } from './analyticsService';
export type { UploadResult, UploadOptions } from './storageService';
export type { AuthUser, LoginCredentials, RegisterData, AuthTokens } from './authService';

// Service initialization
export const initializeServices = async () => {
  console.log('Initializing services...');
  
  try {
    // Initialize authentication service first
    await authService.initialize();
    console.log('✓ Auth service initialized');
    
    // Initialize analytics
    await analyticsService.initialize();
    console.log('✓ Analytics service initialized');
    
    // Set auth token for API service if user is logged in
    const token = authService.getAccessToken();
    if (token) {
      apiService.setAuthToken(token);
      console.log('✓ API service configured with auth token');
    }
    
    console.log('✓ All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
};

// Service health check
export const checkServicesHealth = () => {
  const services = {
    api: true, // API service is always available
    payment: paymentService.isConfigured(),
    payriff: payriffService.isConfigured(),
    notification: notificationService.isConfigured(),
    analytics: analyticsService.isConfigured(),
    storage: storageService.isConfigured(),
    auth: authService.isConfigured(),
  };
  
  console.log('Services health check:', services);
  return services;
};