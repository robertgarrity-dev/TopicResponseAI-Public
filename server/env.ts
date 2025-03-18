import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables without clearing
console.log("🔄 Loading environment configuration...");
dotenv.config();

// Define schema for environment variables with strict validation
const envSchema = z.object({
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    (val) => {
      console.log("🔍 Processing RATE_LIMIT_MAX_REQUESTS input:", val);
      if (typeof val === 'string') return parseInt(val, 10);
      if (typeof val === 'number') return val;
      return 3; // Default value
    },
    z.number().min(1).max(10)
  ),
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (val) => {
      console.log("🔍 Processing RATE_LIMIT_WINDOW_MS input:", val);
      if (typeof val === 'string') return parseInt(val, 10);
      if (typeof val === 'number') return val;
      return 60000; // Default value
    },
    z.number().min(1000).max(3600000)
  ),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

console.log("🔄 Current environment state:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("RATE_LIMIT_MAX_REQUESTS:", process.env.RATE_LIMIT_MAX_REQUESTS);
console.log("RATE_LIMIT_WINDOW_MS:", process.env.RATE_LIMIT_WINDOW_MS);

// Validate environment
const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 3,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 60000
});

console.log("\n✅ Validated environment configuration:");
console.log("================================");
console.log("NODE_ENV:", env.NODE_ENV);
console.log("Rate Limit Max Requests:", env.RATE_LIMIT_MAX_REQUESTS);
console.log("Rate Limit Window:", env.RATE_LIMIT_WINDOW_MS);
console.log("================================\n");

export default env;