import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { BlogTopic, type InsertBlogTopic, blogTopics, type PaginationParams, type PaginatedResponse } from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

export interface IStorage {
  getAllTopics(): Promise<BlogTopic[]>;
  getTopics(pagination?: PaginationParams, category?: string): Promise<PaginatedResponse<BlogTopic>>;
  getTopic(id: number): Promise<BlogTopic | undefined>;
  createTopic(topic: InsertBlogTopic): Promise<BlogTopic>;
  updateTopic(id: number, topic: Partial<InsertBlogTopic>): Promise<BlogTopic | undefined>;
  deleteTopic(id: number): Promise<boolean>;
  updateAiSuggestions(id: number, suggestions: string): Promise<BlogTopic | undefined>;
  getAllCategories(): Promise<string[]>;
}

export class PostgresStorage implements IStorage {
  async getAllTopics(): Promise<BlogTopic[]> {
    const topics = await db.select().from(blogTopics);
    return topics;
  }

  async getAllCategories(): Promise<string[]> {
    const result = await db
      .select({ category: blogTopics.category })
      .from(blogTopics)
      .groupBy(blogTopics.category)
      .orderBy(blogTopics.category);

    return result.map(row => row.category);
  }

  async getTopics(pagination?: PaginationParams, category?: string): Promise<PaginatedResponse<BlogTopic>> {
    const { page = 1, pageSize = 10 } = pagination || {};
    const offset = (page - 1) * pageSize;

    // Build where clause based on category
    const whereClause = category ? eq(blogTopics.category, category) : undefined;

    // Get total count with category filter
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogTopics)
      .where(whereClause);

    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated results with category filter
    const items = await db
      .select()
      .from(blogTopics)
      .where(whereClause)
      .orderBy(desc(blogTopics.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getTopic(id: number): Promise<BlogTopic | undefined> {
    const results = await db
      .select()
      .from(blogTopics)
      .where(eq(blogTopics.id, id));
    return results[0];
  }

  async createTopic(insertTopic: InsertBlogTopic): Promise<BlogTopic> {
    const results = await db
      .insert(blogTopics)
      .values(insertTopic)
      .returning();
    return results[0];
  }

  async updateTopic(id: number, updates: Partial<InsertBlogTopic>): Promise<BlogTopic | undefined> {
    const results = await db
      .update(blogTopics)
      .set(updates)
      .where(eq(blogTopics.id, id))
      .returning();
    return results[0];
  }

  async deleteTopic(id: number): Promise<boolean> {
    const results = await db
      .delete(blogTopics)
      .where(eq(blogTopics.id, id))
      .returning();
    return results.length > 0;
  }

  async updateAiSuggestions(id: number, suggestions: string): Promise<BlogTopic | undefined> {
    try {
      const results = await db
        .update(blogTopics)
        .set({ aiSuggestions: suggestions })
        .where(eq(blogTopics.id, id))
        .returning();
      return results[0];
    } catch (error) {
      console.error("Error updating AI suggestions:", error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();