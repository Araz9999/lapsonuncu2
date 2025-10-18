import { SignJWT, jwtVerify } from 'jose';
import { logger } from './logger';

// SECURITY: JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = 'marketplace-app';
const JWT_AUDIENCE = 'marketplace-users';

if (!JWT_SECRET) {
  logger.error('[JWT] CRITICAL: JWT_SECRET environment variable is not set!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  logger.warn('[JWT] Using fallback secret for development only');
}

const secret = new TextEncoder().encode(JWT_SECRET || 'dev-only-fallback-secret-change-immediately');

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(secret);

  return token;
}

export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('30d')
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    // BUG FIX: Validate payload fields before using
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      logger.error('[JWT] Invalid payload structure');
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    logger.error('[JWT] Token verification failed:', error);
    return null;
  }
}

export async function generateTokenPair(payload: JWTPayload) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}
