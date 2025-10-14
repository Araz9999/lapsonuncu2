import { SignJWT, jwtVerify } from 'jose';

// SECURITY: Do not fall back to a hardcoded JWT secret in production
const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0)
  ? process.env.JWT_SECRET
  : (process.env.NODE_ENV === 'production' ? '' : 'dev-insecure-secret');
const JWT_ISSUER = 'marketplace-app';
const JWT_AUDIENCE = 'marketplace-users';

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('[JWT] Missing JWT_SECRET in production! Token operations will fail.');
}

const secret = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : new Uint8Array();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT secret not configured');
  }
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT secret not configured');
  }
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
    if (!JWT_SECRET) {
      throw new Error('JWT secret not configured');
    }
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
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
