interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

class OAuthService {
  private configs: Record<string, OAuthConfig> = {};

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    console.log('[OAuth] Frontend URL:', frontendUrl);

    this.configs.google = {
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${frontendUrl}/api/auth/google/callback`,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid email profile',
    };

    this.configs.facebook = {
      clientId: process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || '',
      redirectUri: `${frontendUrl}/api/auth/facebook/callback`,
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/me',
      scope: 'email,public_profile',
    };

    this.configs.vk = {
      clientId: process.env.VK_CLIENT_ID || process.env.EXPO_PUBLIC_VK_CLIENT_ID || '',
      clientSecret: process.env.VK_CLIENT_SECRET || process.env.EXPO_PUBLIC_VK_CLIENT_SECRET || '',
      redirectUri: `${frontendUrl}/api/auth/vk/callback`,
      authorizationUrl: 'https://oauth.vk.com/authorize',
      tokenUrl: 'https://oauth.vk.com/access_token',
      userInfoUrl: 'https://api.vk.com/method/users.get',
      scope: 'email',
    };
  }

  getAuthorizationUrl(provider: string, state: string): string {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });

    if (provider === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    }

    if (provider === 'vk') {
      params.append('v', '5.131');
      params.append('display', 'page');
    }

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(provider: string, code: string): Promise<OAuthTokenResponse> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    console.log(`[OAuth] Exchanging code for token with ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OAuth] Token exchange failed for ${provider}:`, errorText);
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[OAuth] Successfully exchanged code for token with ${provider}`);
      return data;
    } catch (error) {
      console.error(`[OAuth] Error exchanging code for token with ${provider}:`, error);
      throw error;
    }
  }

  async getUserInfo(provider: string, accessToken: string, tokenResponse?: OAuthTokenResponse): Promise<OAuthUserInfo> {
    const config = this.configs[provider];
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    console.log(`[OAuth] Fetching user info from ${provider}`);

    try {
      let url = config.userInfoUrl;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      };

      if (provider === 'facebook') {
        url = `${config.userInfoUrl}?fields=id,name,email,picture&access_token=${accessToken}`;
        delete headers.Authorization;
      }

      if (provider === 'vk') {
        url = `${config.userInfoUrl}?access_token=${accessToken}&v=5.131&fields=photo_200`;
        delete headers.Authorization;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OAuth] User info fetch failed for ${provider}:`, errorText);
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[OAuth] Successfully fetched user info from ${provider}`);

      return this.normalizeUserInfo(provider, data, tokenResponse);
    } catch (error) {
      console.error(`[OAuth] Error fetching user info from ${provider}:`, error);
      throw error;
    }
  }

  private normalizeUserInfo(provider: string, data: any, tokenResponse?: OAuthTokenResponse): OAuthUserInfo {
    switch (provider) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.picture,
        };

      case 'facebook':
        return {
          id: data.id,
          email: data.email || `fb_${data.id}@facebook.placeholder`,
          name: data.name,
          avatar: data.picture?.data?.url,
        };

      case 'vk':
        const user = data.response?.[0];
        const vkEmail = (tokenResponse as any)?.email || (data as any)?.email || `vk_${user?.id}@vk.placeholder`;
        return {
          id: user?.id?.toString() || '',
          email: vkEmail,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
          avatar: user?.photo_200,
        };

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  isConfigured(provider: string): boolean {
    const config = this.configs[provider];
    if (!config) return false;

    return !!(
      config.clientId &&
      config.clientSecret &&
      !config.clientId.includes('your-') &&
      !config.clientSecret.includes('your-')
    );
  }

  getAllConfiguredProviders(): string[] {
    return Object.keys(this.configs).filter(provider => this.isConfigured(provider));
  }
}

export const oauthService = new OAuthService();
