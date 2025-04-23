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

// Enum untuk tipe pesan chat
export const chatTypeEnum = pgEnum("chat_type", [
  "system",       // Pesan sistem (join, leave, dll)
  "chat"          // Pesan chat biasa dari pengguna
]);

// Tabel untuk pesan chat
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").references(() => users.id), // Bisa null untuk pesan sistem
  username: text("username").notNull(), // Menyimpan username secara eksplisit
  role: text("role").notNull(), // Menyimpan role secara eksplisit
  type: chatTypeEnum("type").notNull(),
  content: text("content").notNull(), 
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

// Tabel untuk invoice
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  invoiceNumber: varchar("invoice_number", { length: 20 }).notNull().unique(), // Format INV-YYYYMMDD-XXXX
  clientId: integer("client_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // Total invoice dalam Rupiah
  status: invoiceStatusEnum("status").notNull().default("draft"),
  type: paymentTypeEnum("type").notNull(),
  dueDate: timestamp("due_date").notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  paidDate: timestamp("paid_date"),
  paidAmount: integer("paid_amount").default(0),
  notes: text("notes"), // Catatan tambahan dari admin
  termsAndConditions: text("terms_and_conditions"), // Syarat dan ketentuan tambahan
  xenditInvoiceId: text("xendit_invoice_id"), // ID invoice dari Xendit
  xenditInvoiceUrl: text("xendit_invoice_url"), // URL invoice dari Xendit
  metadata: jsonb("metadata"), // Data tambahan seperti info pajak, diskon, dll
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Tabel untuk history pembayaran
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  method: text("method").notNull(), // bank_transfer, virtual_account, credit_card, ewallet
  status: text("status").notNull(), // pending, success, failed, cancelled
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  transactionId: text("transaction_id"), // ID transaksi dari payment gateway
  paymentProofUrl: text("payment_proof_url"), // URL bukti pembayaran jika manual
  notes: text("notes"),
  metadata: jsonb("metadata"), // Data tambahan dari payment gateway
  createdAt: timestamp("created_at").notNull().defaultNow()
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

// Invoice schema
export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  projectId: true,
  invoiceNumber: true,
  clientId: true,
  title: true,
  description: true,
  amount: true,
  status: true,
  type: true,
  dueDate: true,
  notes: true,
  termsAndConditions: true,
  metadata: true,
}).extend({
  status: z.enum(["draft", "sent", "paid", "partial", "overdue", "cancelled"]).default("draft"),
  type: z.enum(["dp", "final", "milestone", "full"]),
  metadata: z.record(z.any()).optional(),
});

export const updateInvoiceSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(["draft", "sent", "paid", "partial", "overdue", "cancelled"]).optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  paidDate: z.date().optional(),
  paidAmount: z.number().optional(),
  xenditInvoiceId: z.string().optional(),
  xenditInvoiceUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Payment schema
export const insertPaymentSchema = createInsertSchema(payments).pick({
  invoiceId: true,
  projectId: true,
  clientId: true,
  amount: true,
  method: true,
  status: true,
  transactionId: true,
  paymentProofUrl: true,
  notes: true,
  metadata: true,
}).extend({
  status: z.enum(["pending", "success", "failed", "cancelled"]).default("pending"),
  metadata: z.record(z.any()).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
