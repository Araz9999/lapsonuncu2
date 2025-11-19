require('dotenv').config();
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { secureHeaders } = require('hono/secure-headers');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Security headers
app.use('*', secureHeaders());

// CORS (allow configurable origins + dynamic local dev origins)
const defaultOrigins = 'https://naxtap.az,http://localhost:3000,http://localhost:3001';
const allowedOriginsConfig = (process.env.CORS_ORIGINS || defaultOrigins).split(',').map(o => o.trim());

// --- UPDATED CORS BLOCK ---
app.use("*", cors({
  origin: (origin, c) => {
    // 1. Allow requests with no origin (like mobile apps, curl requests, Postman)
    // We return the origin (or a simplified wildcard behavior) to allow it.
    if (!origin) {
      return origin; 
    }

    // 2. Allow from configured origins (Exact match)
    if (allowedOriginsConfig.includes(origin)) {
      return origin;
    }

    // 3. [FIX] Allow ANY localhost port
    // This specifically fixes your error with 'http://localhost:56994'
    if (origin.startsWith('http://localhost')) {
      return origin;
    }

    // 4. Allow from local network IPs for development (e.g. testing on phone via wifi)
    // We check if we are NOT in production to be safe.
    if (process.env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('http://172.')) {
            return origin;
        }
    }
    
    // 5. Block all other origins
    // In Hono, returning null/undefined prevents the Allow-Origin header from being set, blocking the request.
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));
// --------------------------

// Basic API routes
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Naxtap API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (c) => {
  return c.json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Auth routes placeholder
app.post("/api/auth/login", (c) => {
  return c.json({ message: "Login endpoint - implement your logic here" });
});

app.post("/api/auth/register", (c) => {
  return c.json({ message: "Register endpoint - implement your logic here" });
});

// Listings routes placeholder
app.get("/api/listings", (c) => {
  return c.json({ 
    listings: [],
    message: "Listings endpoint - implement your logic here" 
  });
});

// Auth status route (used by frontend to detect enabled providers)
app.get('/api/auth/status', (c) => {
  console.log('Auth status requested');
  const providers = {
    google: !!process.env.GOOGLE_CLIENT_ID,
    facebook: !!process.env.FACEBOOK_APP_ID,
    vk: !!process.env.VK_CLIENT_ID,
  };
  return c.json({
    providers,
    base: process.env.EXPO_PUBLIC_RORK_API_BASE_URL || null,
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

console.log(`🚀 Naxtap API server starting on ${host}:${port}`);
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Missing'}`);

// Use @hono/node-server to serve the app
serve({
  fetch: app.fetch,
  port: parseInt(port),
  hostname: "0.0.0.0"
}, (info) => {
  console.log(`✅ Server running at http://${info.address}:${info.port}`);
});

