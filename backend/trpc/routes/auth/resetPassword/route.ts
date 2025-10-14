import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { userDB } from '../../../../db/users';

export const resetPasswordProcedure = publicProcedure
  .input(
    z.object({
      token: z.string(),
      password: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Auth] Password reset attempt');

    const user = await userDB.findByPasswordResetToken(input.token);
    if (!user) {
      throw new Error('Şifrə sıfırlama linki etibarsızdır və ya vaxtı keçib');
    }

    const passwordHash = await hashPassword(input.password);
    await userDB.updatePassword(user.id, passwordHash);

    console.log('[Auth] Password reset successfully:', user.id);

    return {
      success: true,
      message: 'Şifrə uğurla dəyişdirildi',
    };
  });

/**
 * SECURITY: Hash password using PBKDF2 with salt
 * This is a secure password hashing implementation
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
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
  const saltArray = Array.from(salt);
  
  // Store salt:hash format
  return `${saltArray.map(b => b.toString(16).padStart(2, '0')).join('')}:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
