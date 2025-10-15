import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { userDB } from '../../../../db/users';
import { emailService } from '../../../../services/email';

export const forgotPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    // SECURITY: Don't log email addresses to prevent information disclosure
    console.log('[Auth] Forgot password attempt received');

    // SECURITY: Add artificial delay to prevent timing attacks
    const startTime = Date.now();
    
    const user = await userDB.findByEmail(input.email);
    
    if (user) {
      const resetToken = generateRandomToken();
      await userDB.setPasswordResetToken(user.id, resetToken, 1);

      const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
      const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

      // Send email asynchronously to maintain consistent timing
      emailService.sendPasswordResetEmail(user.email, {
        name: user.name,
        resetUrl,
      }).then(emailSent => {
        if (!emailSent) {
          console.warn('[Auth] Failed to send password reset email');
        } else {
          console.log('[Auth] Password reset email sent');
        }
      }).catch(error => {
        console.error('[Auth] Error sending password reset email:', error);
      });
    }

    // SECURITY: Always take at least 200ms to prevent timing attacks
    const elapsed = Date.now() - startTime;
    if (elapsed < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
    }

    // SECURITY: Always return the same message regardless of whether user exists
    return {
      success: true,
      message: 'Əgər bu email qeydiyyatdan keçibsə, şifrə sıfırlama linki göndəriləcək',
    };
  });

function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
