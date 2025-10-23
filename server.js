const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { secureHeaders } = require('hono/secure-headers');
const { serve } = require('@hono/node-server');

const app = new Hono();

// Security headers
app.use('*', secureHeaders());

// CORS
app.use("*", cors({
  origin: ['https://naxtap.az', 'http://localhost:3001'],
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
