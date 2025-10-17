import { publicProcedure } from '../../../create-context';
< Araz
import { z } from 'zod';
import { logger } from '../../../../../utils/logger';
=======
> main
import { userDB } from '../../../../db/users';
import { generateTokenPair } from '../../../../utils/jwt';
import { emailService } from '../../../../services/email';
< lapsonuncu-degisiklikleri
import { userRegistrationSchema } from '../../../../utils/validation';
import { AuthenticationError, DatabaseError } from '../../../../utils/errors';
import { logger } from '../../../../utils/logger';
=======
import { hashPassword, generateRandomToken } from '../../../../utils/password';
< Araz
=======
> main

> main
export const registerProcedure = publicProcedure
  .input(userRegistrationSchema)
  .mutation(async ({ input }) => {
< Araz
    logger.info('[Auth] Registration attempt:', input.email);
=======
    try {
      logger.auth('Registration attempt', { email: input.email });
> main

< lapsonuncu-degisiklikleri
      const existingUser = await userDB.findByEmail(input.email);
      if (existingUser) {
        throw new AuthenticationError(
          'Bu email artıq qeydiyyatdan keçib',
          'email_exists'
        );
      }
=======
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
> main

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

      if (!user) {
        throw new DatabaseError('Failed to create user', undefined, 'createUser');
      }

      const verificationToken = generateRandomToken();
      const tokenSet = await userDB.setVerificationToken(user.id, verificationToken, 24);
      
      if (!tokenSet) {
        logger.warn('Failed to set verification token', { userId: user.id });
      }

< Araz
    if (!emailSent) {
      logger.warn('[Auth] Failed to send verification email, but user was created');
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('[Auth] User registered successfully:', user.id);
=======
      const frontendUrl = process.env.FRONTEND_URL || 
        process.env.EXPO_PUBLIC_FRONTEND_URL || 
        'https://1r36dhx42va8pxqbqz5ja.rork.app';
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

      let emailSent = false;
      try {
        emailSent = await emailService.sendVerificationEmail(user.email, {
          name: user.name,
          verificationUrl,
        });
      } catch (emailError) {
        logger.error('Failed to send verification email', { 
          userId: user.id,
          error: emailError 
        });
      }
> main

      const tokens = await generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.auth('User registered successfully', { userId: user.id });

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
    } catch (error) {
      logger.error('Registration failed', { error });
      throw error;
    }
  });

