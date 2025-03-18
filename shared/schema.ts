import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the blog topics table schema
export const blogTopics = pgTable("blog_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  aiSuggestions: text("ai_suggestions"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schema for validation
export const insertBlogTopicSchema = createInsertSchema(blogTopics).pick({
  title: true,
  description: true,
  category: true,
  aiSuggestions: true,
}).extend({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.string().min(2).max(50),
  categoryType: z.enum(["existing", "new"]).nullable(),
}).omit({
  aiSuggestions: true,
}).refine((data) => {
  if (!data.categoryType) {
    return false;
  }
  return true;
}, {
  message: "Please select whether to use an existing category or add a new one",
  path: ["categoryType"],
});

// Pagination parameters schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Paginated response interface
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type InsertBlogTopic = z.infer<typeof insertBlogTopicSchema>;
export type BlogTopic = typeof blogTopics.$inferSelect;