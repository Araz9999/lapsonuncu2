import { publicProcedure } from '../../../create-context';
import { userDB } from '../../../../db/users';
import { generateTokenPair } from '../../../../utils/jwt';
import { userLoginSchema } from '../../../../utils/validation';
import { AuthenticationError } from '../../../../utils/errors';
import { logger } from '../../../../utils/logger';

export const loginProcedure = publicProcedure
  .input(userLoginSchema)
  .mutation(async ({ input }) => {
    try {
      logger.auth('Login attempt', { email: input.email });

      const user = await userDB.findByEmail(input.email);
      if (!user || !user.passwordHash) {
        // Use same error message to prevent email enumeration
        throw new AuthenticationError(
          'Email və ya şifrə yanlışdır',
          'invalid_credentials'
        );
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        logger.security('Failed login attempt', { 
          email: input.email,
          reason: 'invalid_password' 
        });
        throw new AuthenticationError(
          'Email və ya şifrə yanlışdır',
          'invalid_credentials'
        );
      }

      const tokens = await generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.auth('User logged in successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          phone: user.phone,
          verified: user.verified,
          role: user.role,
          balance: user.balance,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login failed', { error });
      throw error;
    }
  });

/**
 * SECURITY: Verify password using PBKDF2 with stored salt
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) {
    // Legacy hash format without salt - for backwards compatibility
    return await hashPasswordLegacy(password) === storedHash;
  }
  
  const encoder = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hashHex;
}

/**
 * Legacy hash function for backwards compatibility
 * DO NOT USE for new passwords
 */
async function hashPasswordLegacy(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
