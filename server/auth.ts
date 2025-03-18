import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

// Load authentication keys safely
const AUTH_API_KEY = process.env.AUTH_API_KEY?.trim();
const CORS_TOKEN = process.env.CORS_TOKEN?.trim();

// Ensure required authentication tokens exist
if (!AUTH_API_KEY || !CORS_TOKEN) {
  console.error("🚨 Critical Error: Authentication tokens are missing.");
  throw new Error("Authentication tokens are required. Ensure AUTH_API_KEY and CORS_TOKEN are set.");
}

// Utility function to normalize header keys (case-insensitive lookup)
const getHeader = (req: Request, headerName: string) => {
  return req.headers[headerName.toLowerCase()] || req.headers[headerName.toUpperCase()];
};

// 🔹 API Key Authentication Middleware
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = getHeader(req, "x-api-key");

  if (!apiKey || apiKey !== AUTH_API_KEY) {
    console.warn("🚫 Authentication attempt failed.");
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid API key.",
    });
  }

  next(); // API key is valid, proceed to the next middleware
};

// 🔹 CORS Token Validation Middleware
export const validateCorsToken = (req: Request, res: Response, next: NextFunction) => {
  const corsToken = getHeader(req, "x-cors-token");

  if (!corsToken || corsToken !== CORS_TOKEN) {
    console.warn("🚫 CORS validation failed.");
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid CORS token.",
    });
  }

  next();
};
