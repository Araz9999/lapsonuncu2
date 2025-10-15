import { publicProcedure } from '../../../create-context';
import { userDB } from '../../../../db/users';
import { generateTokenPair } from '../../../../utils/jwt';
import { emailService } from '../../../../services/email';
import { userRegistrationSchema } from '../../../../utils/validation';
import { AuthenticationError, DatabaseError } from '../../../../utils/errors';
import { logger } from '../../../../utils/logger';

export const registerProcedure = publicProcedure
  .input(userRegistrationSchema)
  .mutation(async ({ input }) => {
    try {
      logger.auth('Registration attempt', { email: input.email });

      const existingUser = await userDB.findByEmail(input.email);
      if (existingUser) {
        throw new AuthenticationError(
          'Bu email artıq qeydiyyatdan keçib',
          'email_exists'
        );
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

      if (!user) {
        throw new DatabaseError('Failed to create user', undefined, 'createUser');
      }

      const verificationToken = generateRandomToken();
      const tokenSet = await userDB.setVerificationToken(user.id, verificationToken, 24);
      
      if (!tokenSet) {
        logger.warn('Failed to set verification token', { userId: user.id });
      }

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

function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
