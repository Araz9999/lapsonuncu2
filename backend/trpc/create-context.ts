import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { verifyToken } from "../utils/jwt";

import { logger } from '@/utils/logger';
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  let user = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      user = await verifyToken(token);
    } catch (error) {
      logger.error('[Context] Token verification failed:', error);
    }
  }

  return {
    req: opts.req,
    user,
    ip:
      opts.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      opts.req.headers.get('cf-connecting-ip') ||
      opts.req.headers.get('x-real-ip') ||
      null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Giriş tələb olunur',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
