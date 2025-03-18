import express, { type Request, Response, NextFunction } from "express";  
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import env from "./env";

const startTime = Date.now();
console.log(`[${new Date().toISOString()}] 🚀 Starting server initialization...`);

console.log("🔄 Loading environment configuration...");
console.log("🔄 Current environment state:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("RATE_LIMIT_MAX_REQUESTS:", env.RATE_LIMIT_MAX_REQUESTS);
console.log("RATE_LIMIT_WINDOW_MS:", env.RATE_LIMIT_WINDOW_MS);

// Process and validate env variables
console.log("🔍 Processing RATE_LIMIT_MAX_REQUESTS input:", env.RATE_LIMIT_MAX_REQUESTS);
console.log("🔍 Processing RATE_LIMIT_WINDOW_MS input:", env.RATE_LIMIT_WINDOW_MS);

console.log("\n✅ Validated environment configuration:");
console.log("================================");
console.log("NODE_ENV:", env.NODE_ENV);
console.log("Rate Limit Max Requests:", env.RATE_LIMIT_MAX_REQUESTS);
console.log("Rate Limit Window:", env.RATE_LIMIT_WINDOW_MS);
console.log("================================\n");

const app = express();

// Session configuration
const PostgresStore = pgSession(session);
app.use(session({
  store: new PostgresStore({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || process.env.AUTH_API_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: env.NODE_ENV === 'production' ? '.topicresponseai.com' : undefined,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Enable trust proxy for accurate IP detection
app.set('trust proxy', true);
console.log(`[${new Date().toISOString()}] Express trust proxy enabled for accurate IP detection`);

// Parse ALLOWED_ORIGINS from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      'https://replit.com/@support276/TopicResponseAI',
      'https://app.topicresponseai.com',
      'https://topicresponseai.com',
      '*.replit.dev'
    ];

console.log("Allowed Origins:", allowedOrigins);

// CORS Middleware - Must come before other middleware
app.use((req, res, next) => {
  const origin = req.get("Origin");

  // Check if origin is in allowed list or ends with .replit.dev for development
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    origin.endsWith('.replit.dev') ||
    origin === 'https://app.topicresponseai.com'
  );

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, x-cors-token");
    res.setHeader("Access-Control-Expose-Headers", "Authorization");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  } else if (!origin) {
    // Handle requests without origin (like from WordPress or server-to-server)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, x-cors-token");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  }

  console.warn(`🚨 Rejected unauthorized origin: ${origin}`);
  res.status(403).json({
    error: "CORS Error",
    message: "Origin not allowed",
    note: "If testing locally, ensure the origin is added to ALLOWED_ORIGINS."
  });
});

// Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security Headers Middleware - Apply early
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-Download-Options", "noopen");

  res.removeHeader("X-Powered-By");
  next();
});

// Import auth middleware but don't apply it here
// It will be applied in routes.ts
import { authenticateApiKey, validateCorsToken } from "./auth";
// CORS validation and API Key validation are handled in routes.ts

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/assets")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Error Handler
const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.message === "Not allowed by CORS" ? 403 : err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`🚨 Error: ${message}`, {
    status,
    timestamp: new Date().toISOString()
  });

  res.status(status).json({ error: message });
};

app.use(errorHandler);

(async () => {
  try {
    console.log(`[${new Date().toISOString()}] 🔄 Starting server initialization (${Date.now() - startTime}ms elapsed)`);

    console.log(`[${new Date().toISOString()}] 🔄 Registering routes and middleware...`);
    const routesStartTime = Date.now();
    const server = await registerRoutes(app);
    console.log(`[${new Date().toISOString()}] ✅ Routes registered successfully (${Date.now() - routesStartTime}ms)`);

    const port = process.env.PORT || 5000;

    if (env.NODE_ENV === "development") {
      console.log(`[${new Date().toISOString()}] 🔄 Setting up Vite development server...`);
      const viteStartTime = Date.now();
      await setupVite(app, server);
      console.log(`[${new Date().toISOString()}] ✅ Vite development server configured (${Date.now() - viteStartTime}ms)`);
    } else {
      console.log(`[${new Date().toISOString()}] 🔄 Configuring static file serving...`);
      const staticStartTime = Date.now();
      serveStatic(app);
      console.log(`[${new Date().toISOString()}] ✅ Static file serving configured (${Date.now() - staticStartTime}ms)`);
    }

    // Start server directly - port checking not needed in deployment
    console.log(`[${new Date().toISOString()}] 🔄 Starting server on port ${port}...`);
    
    const serverStartTime = Date.now();
    server.listen(port, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] 🚀 Server running in ${env.NODE_ENV} mode on port ${port} (Total startup time: ${Date.now() - startTime}ms)`);
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to start server:`, err);
    process.exit(1);
  }
})();