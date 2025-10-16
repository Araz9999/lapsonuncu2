import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { userDB } from '../../../../db/users';
import { emailService } from '../../../../services/email';
import { generateRandomToken } from '../../../../utils/password';

export const forgotPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('[Auth] Forgot password attempt:', input.email);

    const user = await userDB.findByEmail(input.email);
    
    if (!user) {
      return {
        success: true,
        message: 'Əgər bu email qeydiyyatdan keçibsə, şifrə sıfırlama linki göndəriləcək',
      };
    }

    const resetToken = generateRandomToken();
    await userDB.setPasswordResetToken(user.id, resetToken, 1);

    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const emailSent = await emailService.sendPasswordResetEmail(user.email, {
      name: user.name,
      resetUrl,
    });

    if (!emailSent) {
      console.warn('[Auth] Failed to send password reset email');
    }

    console.log('[Auth] Password reset email sent:', user.id);

    return {
      success: true,
      message: 'Əgər bu email qeydiyyatdan keçibsə, şifrə sıfırlama linki göndəriləcək',
    };
  });

