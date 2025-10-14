import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { oauthService } from '../services/oauth';
import { userDB } from '../db/users';
import { generateTokenPair, verifyToken } from '../utils/jwt';

const auth = new Hono();

const stateStore = new Map<string, { provider: string; createdAt: number }>();

function generateState(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function validateState(state: string): boolean {
  const stored = stateStore.get(state);
  if (!stored) return false;

  const isExpired = Date.now() - stored.createdAt > 10 * 60 * 1000;
  if (isExpired) {
    stateStore.delete(state);
    return false;
  }

  return true;
}

auth.get('/:provider/login', async (c) => {
  const provider = c.req.param('provider');
  
  console.log(`[Auth] Initiating ${provider} login`);

  if (!['google', 'facebook', 'vk'].includes(provider)) {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  if (!oauthService.isConfigured(provider)) {
    return c.json({ 
      error: 'Provider not configured',
      message: `${provider} OAuth is not configured. Please add the required environment variables.`
    }, 503);
  }

  try {
    const state = generateState();
    stateStore.set(state, { provider, createdAt: Date.now() });

    const authUrl = oauthService.getAuthorizationUrl(provider, state);
    
    console.log(`[Auth] Redirecting to ${provider} authorization URL`);
    return c.redirect(authUrl);
  } catch (error) {
    console.error(`[Auth] Error initiating ${provider} login:`, error);
    return c.json({ error: 'Failed to initiate login' }, 500);
  }
});

auth.get('/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  console.log(`[Auth] Received ${provider} callback`);

  if (error) {
    console.error(`[Auth] OAuth error from ${provider}:`, error);
    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    return c.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    console.error(`[Auth] Missing code or state in ${provider} callback`);
    return c.json({ error: 'Missing code or state' }, 400);
  }

  if (!validateState(state)) {
    console.error(`[Auth] Invalid or expired state in ${provider} callback`);
    return c.json({ error: 'Invalid or expired state' }, 400);
  }

  try {
    console.log(`[Auth] Exchanging code for token with ${provider}`);
    const tokenResponse = await oauthService.exchangeCodeForToken(provider, code);
    
    console.log(`[Auth] Fetching user info from ${provider}`);
    const userInfo = await oauthService.getUserInfo(provider, tokenResponse.access_token, tokenResponse);

    console.log(`[Auth] Looking up user by social ID`);
    let user = await userDB.findBySocialId(provider, userInfo.id);

    if (!user) {
      console.log(`[Auth] User not found, checking by email: ${userInfo.email}`);
      user = await userDB.findByEmail(userInfo.email);

      if (user) {
        console.log(`[Auth] Found existing user by email, linking ${provider} account`);
        await userDB.addSocialProvider(user.id, {
          provider: provider as any,
          socialId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
        });
      } else {
        console.log(`[Auth] Creating new user from ${provider} data`);
        user = await userDB.createUser({
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
          verified: true,
          socialProviders: [{
            provider: provider as any,
            socialId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            avatar: userInfo.avatar,
          }],
          role: 'user',
          balance: 0,
        });
      }
    }

    console.log(`[Auth] Generating JWT tokens for user`);
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setCookie(c, 'accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    setCookie(c, 'refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    stateStore.delete(state);

    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    const redirectUrl = `${frontendUrl}/auth/success?token=${tokens.accessToken}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      verified: user.verified,
      role: user.role,
    }))}`;

    console.log(`[Auth] ${provider} login successful, redirecting to app`);
    return c.redirect(redirectUrl);
  } catch (error) {
    console.error(`[Auth] Error processing ${provider} callback:`, error);
    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    return c.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
  }
});

auth.post('/logout', async (c) => {
  console.log('[Auth] User logout');
  
  setCookie(c, 'accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  });

  setCookie(c, 'refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  });

  return c.json({ success: true });
});

auth.get('/status', async (c) => {
  const providers = ['google', 'facebook', 'vk'];
  const status = providers.reduce((acc, provider) => {
    acc[provider] = oauthService.isConfigured(provider);
    return acc;
  }, {} as Record<string, boolean>);

  return c.json({
    configured: status,
    available: Object.keys(status).filter(p => status[p]),
  });
});

// Delete current authenticated user's account
auth.delete('/delete', async (c) => {
  try {
    const authHeader = c.req.header('authorization') || c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = await verifyToken(token);
    if (!payload?.userId) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const deleted = await userDB.deleteUser(payload.userId);

    // Clear cookies regardless (mirrors /logout)
    setCookie(c, 'accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 0,
      path: '/',
    });
    setCookie(c, 'refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 0,
      path: '/',
    });

    if (!deleted) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[Auth] Delete account failed:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default auth;
