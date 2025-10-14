import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import authRoutes from "./routes/auth";
import paymentsRoutes from "./routes/payments";
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

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.route("/auth", authRoutes);
app.route("/payments", paymentsRoutes);
app.route("/webhooks/payriff", payriffWebhook);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Not found handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
