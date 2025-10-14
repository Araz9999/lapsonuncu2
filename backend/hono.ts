import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";
import paymentsRoutes from "./routes/payments";

// Simple in-memory rate limiter (per IP per window)
type RateRecord = { count: number; resetAt: number };
const rateBucket = new Map<string, RateRecord>();
function rateLimit(limit: number, windowMs: number) {
  return async (c: any, next: any) => {
    const now = Date.now();
    const headerIp = c.req.header('x-forwarded-for') || c.req.header('X-Forwarded-For');
    const ip = headerIp?.split(',')[0]?.trim() || c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown';

    const record = rateBucket.get(ip);
    if (!record || record.resetAt <= now) {
      rateBucket.set(ip, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (record.count >= limit) {
      return c.text('Too Many Requests', 429);
    }
    record.count += 1;
    rateBucket.set(ip, record);
    await next();
  };
}

const app = new Hono();

// Security headers
app.use('*', secureHeaders());

// CORS with allowed origins list
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'http://localhost:8081';
const allowedOrigins = allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean);

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return '';
    return allowedOrigins.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
}));

// Rate limiting
const apiRateLimit = Number(process.env.API_RATE_LIMIT || 100);
app.use('/api/*', rateLimit(apiRateLimit, 60_000));
app.use('/auth/*', rateLimit(Math.max(20, Math.floor(apiRateLimit / 2)), 60_000));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Mount REST routes under /api
app.route("/api/auth", authRoutes);
app.route("/api/payments", paymentsRoutes);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
