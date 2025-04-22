import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["client", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("client"),
});

export const statusEnum = pgEnum("status", [
  "pending_review", // Project baru yang perlu direview oleh admin
  "awaiting_dp",    // Project sudah direview dan menunggu pembayaran DP
  "in_progress",    // Project dalam pengerjaan
  "under_review",   // Project selesai dan menunggu review dari client
  "completed"       // Project sudah selesai sepenuhnya
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: statusEnum("status").notNull().default("pending_review"), // Project baru akan selalu pending review
  clientId: integer("client_id").notNull().references(() => users.id),
  quote: integer("quote").notNull(),
  timeline: integer("timeline").notNull(), // in weeks
  paymentStatus: integer("payment_status").notNull().default(0), // 0 = awaiting, 50 = half paid, 100 = fully paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
  progress: integer("progress").notNull().default(0), // progress percentage
  attachments: jsonb("attachments"), // for storing file references 
  adminFeedback: text("admin_feedback"), // Admin dapat memberikan feedback tentang project
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
  type: text("type").notNull(), // "commit", "payment", "feedback", "quotation", "status_change"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0), // progress percentage
  order: integer("order").notNull(), // for ordering milestones
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
}).extend({
  role: z.enum(["client", "admin"]).default("client"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  description: true,
  clientId: true,
  quote: true,
  timeline: true,
}).extend({
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
    size: z.number(),
  })).optional(),
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

export const insertMilestoneSchema = createInsertSchema(milestones).pick({
  projectId: true,
  title: true,
  description: true,
  dueDate: true,
  order: true,
});

export const updateProjectSchema = z.object({
  id: z.number(),
  status: z.enum([
    "pending_review", 
    "awaiting_dp", 
    "in_progress", 
    "under_review", 
    "completed"
  ]).optional(),
  paymentStatus: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  adminFeedback: z.string().optional(), // Admin dapat memberikan feedback pada permintaan
});

// Update schemas
export const updateMilestoneSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  completed: z.boolean().optional(),
  completedAt: z.date().optional(),
  progress: z.number().min(0).max(100).optional(),
  order: z.number().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
