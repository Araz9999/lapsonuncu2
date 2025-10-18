import config from '@/constants/config';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
  userId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: Date;
  [key: string]: string | number | boolean | Date | undefined;
}

class AnalyticsService {
  private googleAnalyticsId: string;
  private mixpanelToken: string;
  private isEnabled: boolean;

  constructor() {
    this.googleAnalyticsId = config.GOOGLE_ANALYTICS_ID as string;
    this.mixpanelToken = config.MIXPANEL_TOKEN as string;
    this.isEnabled = config.ENABLE_ANALYTICS as boolean;
  }

  async initialize(): Promise<void> {
    if (!this.isEnabled || !this.isConfigured()) {
      logger.info('[AnalyticsService] Analytics not configured or disabled');
      return;
    }

    logger.info('[AnalyticsService] Initializing analytics:', { platform: Platform.OS });
    
    if (Platform.OS === 'web') {
      await this.initializeGoogleAnalytics();
    }
    
    await this.initializeMixpanel();
    
    logger.info('[AnalyticsService] Analytics initialized successfully');
  }

  private async initializeGoogleAnalytics(): Promise<void> {
    if (Platform.OS !== 'web' || !this.googleAnalyticsId) return;

    try {
      // SECURITY: Validate Google Analytics ID format before injection
      const gaIdPattern = /^(G|UA|AW|DC)-[A-Z0-9-]+$/;
      if (!gaIdPattern.test(this.googleAnalyticsId)) {
        logger.error('[Analytics] Invalid Google Analytics ID format');
        return;
      }

      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.googleAnalyticsId)}`;
      document.head.appendChild(script1);

      // SECURITY: Use textContent instead of innerHTML for script content
      const script2 = document.createElement('script');
      script2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.googleAnalyticsId.replace(/'/g, "\\'")}');
      `;
      document.head.appendChild(script2);

      interface WindowWithGtag extends Window {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
      }
      
      const windowWithGtag = window as unknown as WindowWithGtag;
      windowWithGtag.gtag = windowWithGtag.gtag || function(...args: unknown[]) {
        (windowWithGtag.dataLayer = windowWithGtag.dataLayer || []).push(args);
      };
      
      logger.info('[AnalyticsService] Google Analytics initialized successfully');
    } catch (error) {
      logger.error('[AnalyticsService] Failed to initialize Google Analytics:', error);
    }
  }

  private async initializeMixpanel(): Promise<void> {
    if (!this.mixpanelToken) return;
    if (this.mixpanelToken.length < 10) return; // avoid initializing with placeholders

    try {
      if (Platform.OS === 'web') {
        const script = document.createElement('script');
        script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          (window as any).mixpanel.init(this.mixpanelToken);
          logger.info('[AnalyticsService] Mixpanel initialized successfully');
        };
      } else {
        logger.info('[AnalyticsService] Mixpanel mobile SDK would need to be installed separately');
      }
    } catch (error) {
      logger.error('[AnalyticsService] Failed to initialize Mixpanel:', error);
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;
    
    // ✅ Input validation
    if (!event || !event.name || typeof event.name !== 'string') {
      logger.error('[AnalyticsService] Invalid event:', event);
      return;
    }

    logger.info('[AnalyticsService] Tracking event:', { name: event.name, userId: event.userId });

    if (Platform.OS === 'web') {
      this.trackGoogleAnalytics(event);
    }
    
    this.trackMixpanel(event);
  }

  private trackGoogleAnalytics(event: AnalyticsEvent): void {
    if (Platform.OS !== 'web') return;

    try {
      interface WindowWithGtag extends Window {
        gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
      }
      const windowWithGtag = window as unknown as WindowWithGtag;
      
      if (windowWithGtag.gtag) {
        windowWithGtag.gtag('event', event.name, {
          ...event.properties,
          user_id: event.userId,
        });
        logger.info('[AnalyticsService] Google Analytics event tracked:', event.name);
      }
    } catch (error) {
      logger.error('[AnalyticsService] Google Analytics tracking error:', error);
    }
  }

  private trackMixpanel(event: AnalyticsEvent): void {
    try {
      interface WindowWithMixpanel extends Window {
        mixpanel?: {
          track: (name: string, properties?: Record<string, unknown>) => void;
          identify: (userId: string) => void;
          people: {
            set: (properties: Record<string, unknown>) => void;
          };
        };
      }
      const windowWithMixpanel = window as unknown as WindowWithMixpanel;
      
      if (Platform.OS === 'web' && windowWithMixpanel.mixpanel) {
        windowWithMixpanel.mixpanel.track(event.name, event.properties);
        if (event.userId) {
          windowWithMixpanel.mixpanel.identify(event.userId);
        }
        logger.info('[AnalyticsService] Mixpanel event tracked:', event.name);
      } else {
        logger.info('[AnalyticsService] Mixpanel mobile tracking would be implemented here');
      }
    } catch (error) {
      logger.error('[AnalyticsService] Mixpanel tracking error:', error);
    }
  }

  identify(userProperties: UserProperties): void {
    if (!this.isEnabled) return;
    
    // ✅ Input validation
    if (!userProperties || !userProperties.userId) {
      logger.error('[AnalyticsService] Invalid user properties:', userProperties);
      return;
    }

    logger.info('[AnalyticsService] Identifying user:', { userId: userProperties.userId });

    if (Platform.OS === 'web') {
      if ((window as any).gtag) {
        (window as any).gtag('config', this.googleAnalyticsId, {
          user_id: userProperties.userId,
        });
      }

      if ((window as any).mixpanel) {
        (window as any).mixpanel.identify(userProperties.userId);
        (window as any).mixpanel.people.set(userProperties);
      }
    }
  }

  setUserProperties(properties: Partial<UserProperties>): void {
    if (!this.isEnabled) return;
    
    // ✅ Input validation
    if (!properties || Object.keys(properties).length === 0) {
      logger.error('[AnalyticsService] Empty properties object');
      return;
    }

    logger.info('[AnalyticsService] Setting user properties:', Object.keys(properties));

    if (Platform.OS === 'web' && (window as any).mixpanel) {
      (window as any).mixpanel.people.set(properties);
    }
  }

  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.track({
      name: 'page_view',
      properties: {
        page_name: pageName,
        ...properties,
      },
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track({
      name: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  trackPurchase(amount: number, currency: string, itemId?: string): void {
    // ✅ Input validation
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      logger.error('[AnalyticsService] Invalid purchase amount:', amount);
      return;
    }
    
    if (!currency || typeof currency !== 'string') {
      logger.error('[AnalyticsService] Invalid currency:', currency);
      return;
    }
    
    logger.info('[AnalyticsService] Tracking purchase:', { amount, currency, itemId });
    
    this.track({
      name: 'purchase',
      properties: {
        amount,
        currency,
        item_id: itemId,
      },
    });
  }

  isConfigured(): boolean {
    const hasGA = Boolean(this.googleAnalyticsId) && !this.googleAnalyticsId.includes('your-');
    const hasMixpanel = Boolean(this.mixpanelToken) && !this.mixpanelToken.includes('your-');
    // Enabled only if at least one provider is fully configured
    return hasGA || hasMixpanel;
  }
}

export const analyticsService = new AnalyticsService();