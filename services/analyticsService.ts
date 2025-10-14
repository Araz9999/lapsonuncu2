import config from '@/constants/config';
import { Platform } from 'react-native';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  signupDate?: Date;
  [key: string]: any;
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
      console.log('Analytics not configured or disabled');
      return;
    }

    if (Platform.OS === 'web') {
      await this.initializeGoogleAnalytics();
    }
    
    await this.initializeMixpanel();
  }

  private async initializeGoogleAnalytics(): Promise<void> {
    if (Platform.OS !== 'web' || !this.googleAnalyticsId) return;

    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.googleAnalyticsId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.googleAnalyticsId}');
      `;
      document.head.appendChild(script2);

      (window as any).gtag = (window as any).gtag || function() {
        ((window as any).dataLayer = (window as any).dataLayer || []).push(arguments);
      };
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  private async initializeMixpanel(): Promise<void> {
    if (!this.mixpanelToken) return;

    try {
      if (Platform.OS === 'web') {
        const script = document.createElement('script');
        script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          (window as any).mixpanel.init(this.mixpanelToken);
        };
      } else {
        console.log('Mixpanel mobile SDK would need to be installed separately');
      }
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    console.log('Analytics Event:', event);

    if (Platform.OS === 'web') {
      this.trackGoogleAnalytics(event);
    }
    
    this.trackMixpanel(event);
  }

  private trackGoogleAnalytics(event: AnalyticsEvent): void {
    if (Platform.OS !== 'web' || !(window as any).gtag) return;

    try {
      (window as any).gtag('event', event.name, {
        ...event.properties,
        user_id: event.userId,
      });
    } catch (error) {
      console.error('Google Analytics tracking error:', error);
    }
  }

  private trackMixpanel(event: AnalyticsEvent): void {
    try {
      if (Platform.OS === 'web' && (window as any).mixpanel) {
        (window as any).mixpanel.track(event.name, event.properties);
        if (event.userId) {
          (window as any).mixpanel.identify(event.userId);
        }
      } else {
        console.log('Mixpanel mobile tracking would be implemented here');
      }
    } catch (error) {
      console.error('Mixpanel tracking error:', error);
    }
  }

  identify(userProperties: UserProperties): void {
    if (!this.isEnabled) return;

    console.log('Analytics Identify:', userProperties);

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

    console.log('Analytics Set User Properties:', properties);

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