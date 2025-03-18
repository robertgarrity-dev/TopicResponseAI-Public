import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertBlogTopicSchema, paginationSchema } from "@shared/schema";
import { generateContentSuggestions } from "./gemini";
import rateLimit from "express-rate-limit";
import { authenticateApiKey, validateCorsToken } from "./auth";
import env from "./env";
import { z } from "zod";

// Fix the rate limiter keyGenerator type issue
const aiSuggestionsLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Rate limit exceeded",
    note: `This is a demonstration application with intentional rate limits. Please wait ${env.RATE_LIMIT_WINDOW_MS / 1000} seconds before trying again.`,
    retryAfter: env.RATE_LIMIT_WINDOW_MS / 1000,
  },
  keyGenerator: (req): string => {
    const source = req.headers["x-api-key"] ? "API_KEY" : "IP";
    console.log(`🔍 Rate limit key source type: ${source}`);
    return (req.headers["x-api-key"] as string) || req.ip;
  },
  skip: (req, res) => {
    console.log(`📊 Rate limit status check - Status Code: ${res.statusCode}`);
    return false;
  },
});

export async function registerRoutes(app: Express) {
  // ✅ Require CORS Token Validation First
  app.use("/api", validateCorsToken);

  // ✅ Require API Key for all API routes
  app.use("/api", authenticateApiKey);

  // CORS is handled in index.ts to avoid duplicate configuration

  // ✅ Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      console.log(`✅ Successfully fetched ${categories.length} unique categories`);
      res.json(categories);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // ✅ Get all topics
  app.get("/api/topics", async (req, res) => {
    try {
      // Parse format parameter with validation
      const format = ((req.query.format as string) || 'paginated').toString().toLowerCase();

      if (!['array', 'paginated', 'list'].includes(format)) {
        return res.status(400).json({
          error: "Invalid format parameter",
          validFormats: ['array', 'paginated', 'list']
        });
      }

      // Check if request is coming from WordPress
      const isWordPress = req.headers['user-agent']?.toLowerCase().includes('wordpress');

      if (isWordPress || format === 'array' || format === 'list') {
        // WordPress/Legacy compatibility mode - return filtered array of topics
        const { items } = await storage.getTopics({ page: 1, pageSize: 1000 });
        const category = req.query.category as string;

        // Filter by category if specified
        const filteredItems = category && category !== 'all'
          ? items.filter(item => item.category === category)
          : items;

        console.log(`✅ Successfully fetched ${filteredItems.length} topics in array format for WordPress`);
        return res.json({
          items: filteredItems,
          categories: Array.from(new Set(items.map(topic => topic.category))).sort()
        });
      }

      // Default paginated response for React frontend
      const { page, pageSize } = paginationSchema.parse({
        page: Number(req.query.page) || 1,
        pageSize: Number(req.query.pageSize) || 10
      });

      const category = req.query.category as string;
      const categoryFilter = category && category !== 'all' ? category : undefined;

      const paginatedTopics = await storage.getTopics({ page, pageSize }, categoryFilter);
      console.log(`✅ Successfully fetched topics page ${page}. Items: ${paginatedTopics.items.length}, Total: ${paginatedTopics.total}`);
      res.json(paginatedTopics);
    } catch (error) {
      console.error("❌ Error fetching topics:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch topics" });
    }
  });

  // ✅ Get single topic
  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getTopic(Number(req.params.id));
      if (!topic) {
        console.log(`⚠️ Topic ${req.params.id} not found`);
        return res.status(404).json({ error: "Topic not found" });
      }
      console.log(`✅ Successfully fetched topic: ${req.params.id}`);
      res.json(topic);
    } catch (error) {
      console.error("❌ Error fetching topic:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch topic" });
    }
  });

  // ✅ Create new topic
  app.post("/api/topics", async (req, res) => {
    try {
      const validatedData = insertBlogTopicSchema.parse(req.body);
      const topic = await storage.createTopic(validatedData);
      console.log(`✅ Created new topic: ${topic.id}`);
      res.status(201).json(topic);
    } catch (error) {
      console.error("❌ Error creating topic:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid topic data" });
    }
  });

  // ✅ Update topic
  app.put("/api/topics/:id", async (req, res) => {
    try {
      const validatedData = insertBlogTopicSchema.parse(req.body);
      const topic = await storage.updateTopic(Number(req.params.id), validatedData);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      console.log(`✅ Updated topic: ${req.params.id}`);
      res.json(topic);
    } catch (error) {
      console.error("❌ Error updating topic:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid topic data" });
    }
  });

  // ✅ Delete topic
  app.delete("/api/topics/:id", async (req, res) => {
    try {
      const success = await storage.deleteTopic(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Topic not found" });
      }
      console.log(`✅ Deleted topic: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error("❌ Error deleting topic:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete topic" });
    }
  });

  // ✅ Generate AI suggestions with rate limiting
  app.post("/api/topics/:id/suggestions", aiSuggestionsLimiter, async (req, res) => {
    try {
      console.log(`🚀 Processing AI suggestion request for topic ${req.params.id}`);

      const topic = await storage.getTopic(Number(req.params.id));
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const suggestions = await generateContentSuggestions(topic.title, topic.description);
      const updatedTopic = await storage.updateAiSuggestions(topic.id, suggestions);

      if (!updatedTopic) {
        return res.status(500).json({ error: "Failed to update suggestions" });
      }

      console.log(`✅ Successfully generated AI suggestions for topic ${req.params.id}`);
      res.json(updatedTopic);
    } catch (error) {
      console.error("❌ Error generating suggestions:", error);
      res.status(500).json({
        error: "Failed to generate AI suggestions",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  });

  return createServer(app);
}