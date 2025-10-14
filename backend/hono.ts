import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";

const app = new Hono();

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
  credentials: true,
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.route("/auth", authRoutes);

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

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
