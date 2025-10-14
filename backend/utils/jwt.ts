import { SignJWT, jwtVerify } from 'jose';

< cursor/fix-security-bugs-and-optimize-app-89ea
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail fast in production; use weak fallback only in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[JWT] Using insecure fallback secret in non-production environment');

< cursor/fix-security-bugs-and-optimize-app-3cd5
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  // Fail closed in production; warn in development
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[JWT] Missing JWT_SECRET');
  } else {
    console.warn('[JWT] JWT_SECRET not set. Using ephemeral dev secret.');
  }
> main
}
const JWT_ISSUER = 'marketplace-app';
const JWT_AUDIENCE = 'marketplace-users';

const secret = new TextEncoder().encode(JWT_SECRET || 'dev-only-insecure-secret');

// SECURITY: JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = 'marketplace-app';
const JWT_AUDIENCE = 'marketplace-users';

if (!JWT_SECRET) {
  console.error('[JWT] CRITICAL: JWT_SECRET environment variable is not set!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[JWT] Using fallback secret for development only');
}

const secret = new TextEncoder().encode(JWT_SECRET || 'dev-only-fallback-secret-change-immediately');
> main

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

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
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
