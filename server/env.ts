import dotenv from 'dotenv'; 
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define schema for environment variables with strict validation
const envSchema = z.object({
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    (val) => {
      if (typeof val === 'string') return parseInt(val, 10);
      if (typeof val === 'number') return val;
      return 3; // Default value
    },
    z.number().min(1).max(10).default(3)
  ),
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (val) => {
      if (typeof val === 'string') return parseInt(val, 10);
      if (typeof val === 'number') return val;
      return 60000; // Default value
    },
    z.number().min(1000).max(3600000).default(60000)
  ),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

// Validate and parse environment variables
const env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
});

// Handle validation errors gracefully
if (!env.success) {
  console.error("🚨 Invalid environment configuration:", env.error.format());
  throw new Error("Invalid environment variables. Please check your .env file.");
}

// Log environment loading only in non-production environments
if (env.data.NODE_ENV !== "production") {
  console.info("✅ Environment variables loaded successfully.");
}

export default env.data;
