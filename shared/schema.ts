import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
});

export const statusEnum = pgEnum("status", [
  "awaiting_dp", 
  "in_progress", 
  "under_review", 
  "completed"
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: statusEnum("status").notNull().default("awaiting_dp"),
  clientId: integer("client_id").notNull().references(() => users.id),
  quote: integer("quote").notNull(),
  timeline: integer("timeline").notNull(), // in weeks
  paymentStatus: integer("payment_status").notNull().default(0), // 0 = awaiting, 50 = half paid, 100 = fully paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
  progress: integer("progress").notNull().default(0), // progress percentage
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(), // "commit", "payment", "feedback", "quotation"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  clientId: true,
  quote: true,
  timeline: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  projectId: true,
  content: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  projectId: true,
  type: true,
  content: true,
});

export const updateProjectSchema = z.object({
  id: z.number(),
  status: z.enum(["awaiting_dp", "in_progress", "under_review", "completed"]).optional(),
  paymentStatus: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Activity = typeof activities.$inferSelect;
