import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { userDB } from '../../../../db/users';
import { hashPassword } from '../../../../utils/password';

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

