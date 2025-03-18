import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const AUTH_API_KEY = process.env.AUTH_API_KEY || ""; // API Key for requests
const CORS_TOKEN = process.env.CORS_TOKEN || ""; // Separate token for CORS validation

if (!AUTH_API_KEY || !CORS_TOKEN) {
  throw new Error("Required authentication tokens are not configured");
}

// 🔹 API Key Authentication Middleware
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== AUTH_API_KEY) {
    // Log authentication failure without exposing the key
    console.warn("🚫 Authentication failed - Invalid or missing API key");
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid or missing API key"
    });
  }

  next(); // API key is valid, continue to route
};

// 🔹 CORS Token Validation Middleware
export const validateCorsToken = (req: Request, res: Response, next: NextFunction) => {
  const corsToken = req.headers["x-cors-token"];

  if (!corsToken || corsToken !== CORS_TOKEN) {
    console.warn("🚫 CORS validation failed - Invalid or missing token");
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid origin"
    });
  }

  next();
};