import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb, varchar } from "drizzle-orm/pg-core";
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
  "approved",       // Project sudah diapprove oleh client tapi belum dilakukan pembayaran akhir
  "awaiting_handover", // Project menunggu penyerahan dokumen/kode
  "completed",      // Project sudah selesai sepenuhnya
  "rejected"        // Project ditolak oleh client
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

// Enum untuk tipe notifikasi
export const notificationTypeEnum = pgEnum("notification_type", [
  "status_update",     // Pemberitahuan perubahan status project
  "new_message",       // Ada pesan baru di LiveChat
  "new_feedback",      // Ada feedback baru dari client/admin
  "new_milestone",     // Milestone baru ditambahkan
  "milestone_update",  // Milestone diupdate
  "payment_update",    // Update pembayaran project
  "invoice_created",   // Invoice baru dibuat
  "payment_received",  // Pembayaran diterima
  "admin_action"       // Tindakan admin lainnya
]);

// Enum untuk status invoice
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",        // Invoice dibuat tapi belum dikirim
  "sent",         // Invoice sudah dikirim ke client
  "paid",         // Invoice sudah dibayar
  "partial",      // Invoice dibayar sebagian
  "overdue",      // Invoice sudah lewat tanggal jatuh tempo
  "cancelled"     // Invoice dibatalkan
]);

// Enum untuk tipe pembayaran
export const paymentTypeEnum = pgEnum("payment_type", [
  "dp",           // Down Payment (biasanya 50%)
  "final",        // Pembayaran akhir
  "milestone",    // Pembayaran milestone
  "full"          // Pembayaran penuh (100%)
]);

// Tabel untuk notifikasi
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata") // Untuk menyimpan data terkait notifikasi seperti ID feedback, milestone, dll
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
    "approved",
    "awaiting_handover",
    "completed",
    "rejected"
  ]).optional(),
  paymentStatus: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
  adminFeedback: z.string().optional(), // Admin dapat memberikan feedback pada permintaan
  quote: z.number().positive().optional(), // Admin dapat mengubah harga penawaran
  timeline: z.number().positive().optional(), // Admin dapat mengubah perkiraan waktu penyelesaian
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

// Notification schema
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  projectId: true,
  metadata: true,
});

export const updateNotificationSchema = z.object({
  id: z.number(),
  isRead: z.boolean().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
