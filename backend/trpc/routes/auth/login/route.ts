import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { logger } from '../../../../../utils/logger';
import { userDB } from '../../../../db/users';
import { generateTokenPair } from '../../../../utils/jwt';

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    logger.info('[Auth] Login attempt:', input.email);

    const user = await userDB.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new Error('Email və ya şifrə yanlışdır');
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Email və ya şifrə yanlışdır');
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('[Auth] User logged in successfully:', user.id);

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
  const saltBytes = saltHex.match(/.{2}/g);
  if (!saltBytes) {
    // Invalid salt format - reject authentication
    console.error('[Auth] Invalid salt format in stored hash');
    return false;
  }
  const salt = new Uint8Array(saltBytes.map(byte => parseInt(byte, 16)));
  
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
