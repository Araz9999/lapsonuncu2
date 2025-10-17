import { Hono } from 'hono';
import { logger } from '../../utils/logger';
import { setCookie } from 'hono/cookie';
import { oauthService } from '../services/oauth';
import { userDB } from '../db/users';
import { generateTokenPair, verifyToken } from '../utils/jwt';
import { authRateLimit } from '../middleware/rateLimit';
const auth = new Hono();

// SECURITY: Apply rate limiting to all auth routes
auth.use('*', authRateLimit);

const stateStore = new Map<string, { provider: string; createdAt: number }>();

/**
 * SECURITY: Generate cryptographically secure random state
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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
  
< cursor/fix-many-bugs-and-errors-4e56
  logger.debug(`[Auth] Initiating ${provider} login`);
=======
  logger.info(`[Auth] Initiating ${provider} login`);
> Araz

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
    
< cursor/fix-many-bugs-and-errors-4e56
    logger.debug(`[Auth] Redirecting to ${provider} authorization URL`);
=======
    logger.info(`[Auth] Redirecting to ${provider} authorization URL`);
> Araz
    return c.redirect(authUrl);
  } catch (error) {
    logger.error(`[Auth] Error initiating ${provider} login:`, error);
    return c.json({ error: 'Failed to initiate login' }, 500);
  }
});

auth.get('/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

< cursor/fix-many-bugs-and-errors-4e56
  logger.debug(`[Auth] Received ${provider} callback`);
=======
  logger.info(`[Auth] Received ${provider} callback`);
> Araz

  if (error) {
    logger.error(`[Auth] OAuth error from ${provider}:`, error);
    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    return c.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    logger.error(`[Auth] Missing code or state in ${provider} callback`);
    return c.json({ error: 'Missing code or state' }, 400);
  }

  if (!validateState(state)) {
    logger.error(`[Auth] Invalid or expired state in ${provider} callback`);
    return c.json({ error: 'Invalid or expired state' }, 400);
  }

  try {
< cursor/fix-many-bugs-and-errors-4e56
    logger.debug(`[Auth] Exchanging code for token with ${provider}`);
    const tokenResponse = await oauthService.exchangeCodeForToken(provider, code);
    
    logger.debug(`[Auth] Fetching user info from ${provider}`);
    const userInfo = await oauthService.getUserInfo(provider, tokenResponse.access_token, tokenResponse);

    logger.debug(`[Auth] Looking up user by social ID`);
    let user = await userDB.findBySocialId(provider, userInfo.id);

    if (!user) {
      logger.debug(`[Auth] User not found, checking by email: ${userInfo.email}`);
      user = await userDB.findByEmail(userInfo.email);

      if (user) {
        logger.debug(`[Auth] Found existing user by email, linking ${provider} account`);
=======
    logger.info(`[Auth] Exchanging code for token with ${provider}`);
    const tokenResponse = await oauthService.exchangeCodeForToken(provider, code);
    
    logger.info(`[Auth] Fetching user info from ${provider}`);
    const userInfo = await oauthService.getUserInfo(provider, tokenResponse.access_token, tokenResponse);

    logger.info(`[Auth] Looking up user by social ID`);
    let user = await userDB.findBySocialId(provider, userInfo.id);

    if (!user) {
      logger.info(`[Auth] User not found, checking by email: ${userInfo.email}`);
      user = await userDB.findByEmail(userInfo.email);

      if (user) {
< cursor/fix-many-bugs-and-errors-2981
        logger.info(`[Auth] Found existing user by email, linking ${provider} account`);
=======
        console.log(`[Auth] Found existing user by email, linking ${provider} account`);
        // BUG FIX: Validate provider type before using
        if (provider !== 'google' && provider !== 'facebook' && provider !== 'vk') {
          throw new Error('Invalid OAuth provider');
        }
> Araz
> Araz
        await userDB.addSocialProvider(user.id, {
< lapsonuncu-degisiklikleri
          provider: provider as 'google' | 'facebook' | 'vk',
=======
          provider: provider,
> main
          socialId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
        });
      } else {
< cursor/fix-many-bugs-and-errors-4e56
        logger.debug(`[Auth] Creating new user from ${provider} data`);
=======
< cursor/fix-many-bugs-and-errors-2981
        logger.info(`[Auth] Creating new user from ${provider} data`);

        console.log(`[Auth] Creating new user from ${provider} data`);
        // BUG FIX: Validate provider type before using
        if (provider !== 'google' && provider !== 'facebook' && provider !== 'vk') {
          throw new Error('Invalid OAuth provider');
        }
> Araz
> Araz
        user = await userDB.createUser({
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
          verified: true,
          socialProviders: [{
< lapsonuncu-degisiklikleri
            provider: provider as 'google' | 'facebook' | 'vk',
=======
            provider: provider,
> main
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

< cursor/fix-many-bugs-and-errors-4e56
    logger.debug(`[Auth] Generating JWT tokens for user`);
=======
    logger.info(`[Auth] Generating JWT tokens for user`);
> Araz
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    stateStore.delete(state);

    // SECURITY: Store tokens in httpOnly cookies instead of URL parameters
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

    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    // Pass only user ID in URL, client can fetch full user data with the cookie
    const redirectUrl = `${frontendUrl}/auth/success?userId=${user.id}`;

< cursor/fix-many-bugs-and-errors-4e56
    logger.debug(`[Auth] ${provider} login successful, redirecting to app`);
=======
    logger.info(`[Auth] ${provider} login successful, redirecting to app`);
> Araz
    return c.redirect(redirectUrl);
  } catch (error) {
    logger.error(`[Auth] Error processing ${provider} callback:`, error);
    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    return c.redirect(`${frontendUrl}/auth/login?error=authentication_failed`);
  }
});

auth.post('/logout', async (c) => {
< cursor/fix-many-bugs-and-errors-4e56
  logger.debug('[Auth] User logout');
=======
  logger.info('[Auth] User logout');
> Araz
  
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
    logger.error('[Auth] Delete account failed:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default auth;
