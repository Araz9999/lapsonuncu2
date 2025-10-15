import { SignJWT, jwtVerify } from 'jose';

// SECURITY: JWT_SECRET must be set in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = 'marketplace-app';
const JWT_AUDIENCE = 'marketplace-users';
const MIN_SECRET_LENGTH = 32;

// FIXED: Enforce strong JWT secret validation
if (!JWT_SECRET || JWT_SECRET.length < MIN_SECRET_LENGTH) {
  const error = `[JWT] CRITICAL: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters!`;
  console.error(error);
  
  if (process.env.NODE_ENV === 'production') {
    // SECURITY: Never allow production to start with weak or missing JWT secret
    throw new Error('JWT_SECRET must be set and strong in production');
  }
  
  if (!JWT_SECRET) {
    console.warn('[JWT] Using fallback secret for development only - DO NOT USE IN PRODUCTION');
  } else {
    console.warn(`[JWT] JWT_SECRET is too weak (${JWT_SECRET.length} chars). Minimum: ${MIN_SECRET_LENGTH} chars`);
  }
}

// SECURITY: Validate secret doesn't contain common weak patterns
const weakSecrets = ['secret', 'password', 'dev-only', 'change-me', 'changeme', 'test', 'demo', 'example'];
const secretLower = (JWT_SECRET || '').toLowerCase();
if (weakSecrets.some(weak => secretLower.includes(weak))) {
  console.error('[JWT] CRITICAL: JWT_SECRET contains weak/common patterns!');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET contains insecure patterns - use a cryptographically random secret');
  }
  console.warn('[JWT] WARNING: JWT_SECRET contains common patterns. Generate a new secret with: openssl rand -base64 48');
}

const secret = new TextEncoder().encode(JWT_SECRET || 'dev-only-fallback-secret-change-immediately-min32chars');

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
