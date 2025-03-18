import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import env from "./env";

console.log(`[${new Date().toISOString()}] 🚀 Initializing server...`);

const app = express();

// 🔹 Ensure SESSION_SECRET is set
if (!process.env.SESSION_SECRET) {
  console.error("🚨 SESSION_SECRET is required but missing! Set it in your environment variables.");
  throw new Error("SESSION_SECRET is required.");
}

// 🔹 Session Configuration
const PostgresStore = pgSession(session);
app.use(
  session({
    store: new PostgresStore({
      pool,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      domain: env.NODE_ENV === "production" ? ".topicresponseai.com" : undefined,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 🔹 Enable Trust Proxy for Proper IP Detection
app.set("trust proxy", true);
console.log(`[${new Date().toISOString()}] Express trust proxy enabled`);

// 🔹 CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "https://replit.com/@support276/TopicResponseAI",
      "https://app.topicresponseai.com",
      "https://topicresponseai.com",
      "*.replit.dev",
    ];

console.log(`[${new Date().toISOString()}] Allowed Origins:`, allowedOrigins);

app.use((req, res, next) => {
  const origin = req.get("Origin");
  const isAllowed =
    origin &&
    (allowedOrigins.includes(origin) || origin.endsWith(".replit.dev") || origin === "https://app.topicresponseai.com");

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, x-cors-token");
    res.setHeader("Access-Control-Expose-Headers", "Authorization");

    if (req.method === "OPTIONS") return res.status(204).end();
    return next();
  }

  console.warn(`🚨 Rejected unauthorized origin: ${origin}`);
  res.status(403).json({ error: "CORS Error", message: "Origin not allowed" });
});

// 🔹 Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 Security Headers
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

// 🔹 Import Authentication Middleware
import { authenticateApiKey, validateCorsToken } from "./auth";

// 🔹 Logging Middleware (For API & Static Requests)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    if (path.startsWith("/api") || path.startsWith("/assets")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });

  next();
});

// 🔹 Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`🚨 Error: ${err.message || "Internal Server Error"}`);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// 🔹 Server Initialization
(async () => {
  try {
    console.log(`[${new Date().toISOString()}] 🔄 Registering routes...`);
    const server = await registerRoutes(app);
    console.log(`[${new Date().toISOString()}] ✅ Routes registered successfully`);

    const port = process.env.PORT || 5000;

    if (env.NODE_ENV === "development") {
      console.log(`[${new Date().toISOString()}] 🔄 Setting up Vite development server...`);
      await setupVite(app, server);
      console.log(`[${new Date().toISOString()}] ✅ Vite development server configured`);
    } else {
      console.log(`[${new Date().toISOString()}] 🔄 Configuring static file serving...`);
      serveStatic(app);
      console.log(`[${new Date().toISOString()}] ✅ Static file serving configured`);
    }

    // Start server
    console.log(`[${new Date().toISOString()}] 🚀 Starting server on port ${port}...`);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] ✅ Server running in ${env.NODE_ENV} mode on port ${port}`);
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to start server:`, err);
    process.exit(1);
  }
})();
