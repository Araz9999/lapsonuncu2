require('dotenv').config();
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { secureHeaders } = require('hono/secure-headers');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Security headers
app.use('*', secureHeaders());

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.EXPO_PUBLIC_FRONTEND_URL,
  'https://naxtap.az',
  'http://localhost:19006', // Expo web dev default
  'http://localhost:5173',  // Vite/serve local
  'http://localhost:3000',  // Common dev port
].filter(Boolean);

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return origin; // allow non-browser clients
    if (allowedOrigins.includes(origin)) return origin;
    // Always allow localhost in dev flows (any port)
    if (origin.startsWith('http://localhost')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

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

// ---------------------------------------------------------------------------
// In-memory development data (NOT FOR PRODUCTION)
// ---------------------------------------------------------------------------
const devDb = {
  users: new Map(), // key: email, value: { id, name, email, passwordHash?, createdAt }
  tokens: new Map(), // key: accessToken, value: { email, refreshToken, expiresAt }
};

function makeId(prefix = 'usr') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeToken(prefix = 'tok') {
  return `${prefix}_${Math.random().toString(36).slice(2)}.${Date.now()}`;
}

function makeTokens(email) {
  const accessToken = makeToken('acc');
  const refreshToken = makeToken('ref');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60m
  devDb.tokens.set(accessToken, { email, refreshToken, expiresAt });
  return { accessToken, refreshToken, expiresAt };
}

function sanitizeUser(u) {
  return { id: u.id, name: u.name, email: u.email };
}

// Social auth configuration status
app.get("/api/auth/status", (c) => {
  // For local development we can intentionally disable social login to avoid 404s
  // unless explicitly enabled via env flag
  const enableLocalOAuth = String(process.env.ENABLE_LOCAL_OAUTH || '').toLowerCase() === 'true';

  const configured = {
    // Only report provider as configured locally when keys are present AND local OAuth is enabled
    google: enableLocalOAuth && Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: enableLocalOAuth && Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    vk: enableLocalOAuth && Boolean(process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET),
  };

  return c.json({
    configured,
    available: Object.keys(configured).filter((k) => configured[k])
  });
});

// ---------------------------------------------------------------------------
// Auth routes (development-only minimal implementation)
// ---------------------------------------------------------------------------
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const name = (body?.name || '').toString().trim() || 'User';
    const email = (body?.email || '').toString().trim().toLowerCase();
    const password = (body?.password || '').toString();

    if (!email || !password) {
      return c.json({ message: 'Email və şifrə tələb olunur' }, 400);
    }
    if (devDb.users.has(email)) {
      return c.json({ message: 'Email artıq mövcuddur' }, 409);
    }
    const user = { id: makeId(), name, email, createdAt: new Date().toISOString() };
    // NOTE: Do not store raw password in real apps; use hash. This is dev-only.
    user.passwordHash = `raw:${password}`;
    devDb.users.set(email, user);

    const tokens = makeTokens(email);
    return c.json({ user: sanitizeUser(user), tokens });
  } catch (err) {
    return c.json({ message: 'Invalid JSON' }, 400);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const password = (body?.password || '').toString();
    if (!email || !password) {
      return c.json({ message: 'Email və şifrə tələb olunur' }, 400);
    }
    const user = devDb.users.get(email);
    if (!user) {
      return c.json({ message: 'İstifadəçi tapılmadı' }, 404);
    }
    // Dev-only password check
    if (user.passwordHash !== `raw:${password}`) {
      return c.json({ message: 'Yanlış şifrə' }, 401);
    }
    const tokens = makeTokens(email);
    return c.json({ user: sanitizeUser(user), tokens });
  } catch (err) {
    return c.json({ message: 'Invalid JSON' }, 400);
  }
});

app.post('/api/auth/logout', async (c) => {
  // Client will clear tokens; server accepts request for symmetry
  return c.json({ success: true });
});

app.post('/api/auth/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const refreshToken = (body?.refreshToken || '').toString();
    if (!refreshToken) return c.json({ message: 'refreshToken tələb olunur' }, 400);
    // In dev, issue a new access token without validating refresh token
    const email = [...devDb.users.keys()][0] || 'guest@local';
    const tokens = makeTokens(email);
    return c.json({ tokens });
  } catch {
    return c.json({ message: 'Invalid JSON' }, 400);
  }
});

app.post('/api/auth/forgot-password', async (c) => {
  // Pretend email sent
  return c.json({ success: true, message: 'Reset link sent if account exists' });
});

app.post('/api/auth/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const token = (body?.token || '').toString();
    const password = (body?.password || '').toString();
    if (!token || !password) return c.json({ message: 'Token və şifrə tələb olunur' }, 400);
    // Dev: accept any token and update the first user password
    const firstUserEmail = [...devDb.users.keys()][0];
    if (!firstUserEmail) return c.json({ message: 'No users to reset' }, 404);
    const user = devDb.users.get(firstUserEmail);
    user.passwordHash = `raw:${password}`;
    devDb.users.set(firstUserEmail, user);
    return c.json({ success: true });
  } catch {
    return c.json({ message: 'Invalid JSON' }, 400);
  }
});

app.post('/api/auth/delete-account', async (c) => {
  // Dev: delete the first user
  const firstUserEmail = [...devDb.users.keys()][0];
  if (firstUserEmail) devDb.users.delete(firstUserEmail);
  return c.json({ success: true });
});

// Listings routes placeholder
app.get("/api/listings", (c) => {
  return c.json({ 
    listings: [],
    message: "Listings endpoint - implement your logic here" 
  });
});

const port = process.env.PORT || 3002;
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
