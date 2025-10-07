import { publicProcedure } from '../../../create-context';
import { z } from 'zod';
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
    console.log('[Auth] Login attempt:', input.email);

    const user = await userDB.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new Error('Email və ya şifrə yanlışdır');
    }

    const passwordHash = await hashPassword(input.password);
    if (passwordHash !== user.passwordHash) {
      throw new Error('Email və ya şifrə yanlışdır');
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    console.log('[Auth] User logged in successfully:', user.id);

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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
