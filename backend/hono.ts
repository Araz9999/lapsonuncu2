import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
< cursor/fix-security-bugs-and-optimize-app-89ea
import { compress } from "hono/compress";
import { etag } from "hono/etag";
> main
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";
import paymentsRoutes from "./routes/payments";
< cursor/fix-security-bugs-and-optimize-app-89ea
import payriffWebhook from "./routes/payriff-webhook";

const app = new Hono();

// Security headers
app.use("*", secureHeaders());

// Response compression
app.use("*", compress());
// ETag for better client-side caching
app.use("*", etag());

// Strict CORS - only allow known frontend origins
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.EXPO_PUBLIC_FRONTEND_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL?.replace(/\/$/, "").replace(/\/api$/, ""),
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ].filter(Boolean) as string[]
);

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return false; // block non-CORS requests from setting ACAO
    try {
      const normalized = origin.replace(/\/$/, "");
      return allowedOrigins.has(normalized) ? normalized : false;
    } catch {
      return false;
    }
  },
  credentials: false, // we use Authorization header instead of cookies
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "Content-Type"],
  maxAge: 600,
}));

// Basic body size limit (1 MB) to prevent DoS via oversized payloads
function bodySizeLimit(maxBytes: number) {
  return async (c: any, next: any) => {
    const cl = Number(c.req.header("content-length") || "0");
    if (cl && cl > maxBytes) {
      return c.text("Payload too large", 413);
    }
    await next();
  };
}
app.use("*", bodySizeLimit(1 * 1024 * 1024));

// Very simple in-memory rate limiter per IP (window: 1 min, limit: 300 req)
type Bucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, Bucket>();
const RATE_LIMIT = Number(process.env.API_RATE_LIMIT || 300);
const RATE_WINDOW_MS = 60 * 1000;

function getClientId(c: any): string {
  return (
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",")[0].trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

app.use("*", async (c, next) => {
  const key = getClientId(c);
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > RATE_LIMIT) {
      return c.json({ error: "Too many requests" }, 429);
    }
  }
  await next();
});


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

< cursor/fix-security-bugs-and-optimize-app-3cd5
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
=======
// SECURITY: Configure CORS with allowed origins
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.EXPO_PUBLIC_FRONTEND_URL,
  'https://1r36dhx42va8pxqbqz5ja.rork.app',
  'http://localhost:8081',
  'http://localhost:19006',
].filter(Boolean);

app.use("*", cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return true;
    
    // Check if origin is in allowed list
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    
    // In development, allow localhost with any port
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
      return origin;
    }
    
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return false;
  },
> main
  credentials: true,
  maxAge: 86400,
}));

// Rate limiting
const apiRateLimit = Number(process.env.API_RATE_LIMIT || 100);
app.use('/api/*', rateLimit(apiRateLimit, 60_000));
app.use('/auth/*', rateLimit(Math.max(20, Math.floor(apiRateLimit / 2)), 60_000));
> main

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

< cursor/fix-security-bugs-and-optimize-app-89ea
app.route("/auth", authRoutes);
app.route("/payments", paymentsRoutes);
app.route("/webhooks/payriff", payriffWebhook);
=======
// Mount REST routes under /api
app.route("/api/auth", authRoutes);
app.route("/api/payments", paymentsRoutes);

// SECURITY: Add security headers
app.use('*', async (c, next) => {
  await next();
  
  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  c.header('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HSTS) for HTTPS
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.mxpnl.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
  
  // Referrer Policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
});
> main

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Not found handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
