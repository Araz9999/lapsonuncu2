import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
import { logger } from '../../../../../utils/logger';
import { userDB } from '../../../../db/users';
import { generateTokenPair } from '../../../../utils/jwt';
import { emailService } from '../../../../services/email';
import { hashPassword, generateRandomToken } from '../../../../utils/password';

export const registerProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
      phone: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    logger.info('[Auth] Registration attempt:', input.email);

    const existingUser = await userDB.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Bu email artıq qeydiyyatdan keçib');
    }

    // BUG FIX: Add stronger password validation on backend
    if (input.password.length < 8) {
      throw new Error('Şifrə ən azı 8 simvol olmalıdır');
    }
    if (!/[A-Z]/.test(input.password)) {
      throw new Error('Şifrə ən azı 1 böyük hərf olmalıdır');
    }
    if (!/[a-z]/.test(input.password)) {
      throw new Error('Şifrə ən azı 1 kiçik hərf olmalıdır');
    }
    if (!/[0-9]/.test(input.password)) {
      throw new Error('Şifrə ən azı 1 rəqəm olmalıdır');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userDB.createUser({
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
      verified: false,
      role: 'user',
      balance: 0,
      socialProviders: [],
    });

    const verificationToken = generateRandomToken();
    await userDB.setVerificationToken(user.id, verificationToken, 24);

    const frontendUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const emailSent = await emailService.sendVerificationEmail(user.email, {
      name: user.name,
      verificationUrl,
    });

    if (!emailSent) {
      logger.warn('[Auth] Failed to send verification email, but user was created');
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('[Auth] User registered successfully:', user.id);

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
      emailSent,
    };
  });

