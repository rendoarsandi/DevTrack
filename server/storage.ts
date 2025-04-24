import { 
  users, projects, feedback, activities, milestones, 
  notifications, invoices, payments, chatMessages, feedbackTokens,
  dashboardWidgets, userWidgets
} from "@shared/schema";
import type { 
  User, InsertUser, 
  Project, InsertProject, UpdateProject,
  Feedback, InsertFeedback,
  FeedbackToken, InsertFeedbackToken,
  Activity, InsertActivity,
  Milestone, InsertMilestone, UpdateMilestone,
  Notification, InsertNotification, UpdateNotification,
  Invoice, InsertInvoice, UpdateInvoice,
  Payment, InsertPayment,
  ChatMessage, InsertChatMessage,
  DashboardWidget, InsertDashboardWidget,
  UserWidget, InsertUserWidget, UpdateUserWidget
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, inArray, and, asc, count, like, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmailVerification(userId: number, isVerified: boolean): Promise<User | undefined>;
  
  // Project methods
  getProjects(): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(project: UpdateProject): Promise<Project | undefined>;
  
  // Feedback methods
  getFeedbackByProject(projectId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Feedback Token methods
  createFeedbackToken(token: InsertFeedbackToken): Promise<FeedbackToken>;
  getFeedbackToken(token: string): Promise<FeedbackToken | undefined>;
  getFeedbackTokensByProject(projectId: number): Promise<FeedbackToken[]>;
  markFeedbackTokenAsUsed(token: string): Promise<FeedbackToken | undefined>;
  
  // Activity methods
  getActivitiesByClient(clientId: number): Promise<Activity[]>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Milestone methods
  getMilestonesByProject(projectId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(milestone: UpdateMilestone): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  
  // Notification methods
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(notification: UpdateNotification): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Invoice methods
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByProject(projectId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(invoice: UpdateInvoice): Promise<Invoice | undefined>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getPaymentsByClient(clientId: number): Promise<Payment[]>;
  getPaymentsByProject(projectId: number): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Chat methods
  getChatMessagesByProject(projectId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Dashboard Widget methods
  getDashboardWidgets(): Promise<DashboardWidget[]>;
  getDashboardWidgetsByRole(role: string): Promise<DashboardWidget[]>;
  getDashboardWidget(id: number): Promise<DashboardWidget | undefined>;
  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  
  // User Widget methods
  getUserWidgets(userId: number): Promise<UserWidget[]>;
  getUserWidget(id: number): Promise<UserWidget | undefined>;
  createUserWidget(widget: InsertUserWidget): Promise<UserWidget>;
  updateUserWidget(widget: UpdateUserWidget): Promise<UserWidget | undefined>;
  deleteUserWidget(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserEmailVerification(userId: number, isVerified: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ emailVerified: isVerified, ...(isVerified ? { lastLogin: new Date() } : {}) })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.clientId, clientId));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        status: "pending_review", // Start with pending review status
        paymentStatus: 0,
        progress: 0,
      })
      .returning();
    
    // Create an activity for the new project
    await this.createActivity({
      projectId: project.id,
      type: "quotation",
      content: `Quotation sent for ${insertProject.title}`
    });
    
    return project;
  }

  async updateProject(updateData: UpdateProject): Promise<Project | undefined> {
    const project = await this.getProject(updateData.id);
    if (!project) return undefined;
    
    const updateValues: Partial<Project> = {};
    
    if (updateData.status !== undefined) {
      updateValues.status = updateData.status;
    }
    
    if (updateData.paymentStatus !== undefined) {
      updateValues.paymentStatus = updateData.paymentStatus;
      
      // Create a payment activity if payment status changed
      if (project.paymentStatus !== updateData.paymentStatus) {
        await this.createActivity({
          projectId: project.id,
          type: "payment",
          content: `Payment updated to ${updateData.paymentStatus}% for ${project.title}`
        });
      }
    }
    
    if (updateData.progress !== undefined) {
      updateValues.progress = updateData.progress;
    }
    
    if (updateData.adminFeedback !== undefined) {
      updateValues.adminFeedback = updateData.adminFeedback;
    }
    
    // Handle quote update
    if (updateData.quote !== undefined) {
      updateValues.quote = updateData.quote;
      
      // Create a quotation activity if price changed
      if (project.quote !== updateData.quote) {
        await this.createActivity({
          projectId: project.id,
          type: "quotation",
          content: `Price updated from $${project.quote} to $${updateData.quote}`
        });
      }
    }
    
    // Handle timeline update
    if (updateData.timeline !== undefined) {
      updateValues.timeline = updateData.timeline;
      
      // Create an activity if timeline changed
      if (project.timeline !== updateData.timeline) {
        await this.createActivity({
          projectId: project.id,
          type: "status_change",
          content: `Project timeline updated from ${project.timeline} to ${updateData.timeline} weeks`
        });
      }
    }
    
    const [updatedProject] = await db
      .update(projects)
      .set(updateValues)
      .where(eq(projects.id, updateData.id))
      .returning();
      
    return updatedProject;
  }

  // Feedback methods
  async getFeedbackByProject(projectId: number): Promise<Feedback[]> {
    return await db.select().from(feedback).where(eq(feedback.projectId, projectId));
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(insertFeedback)
      .returning();
    
    // Create activity for the feedback
    await this.createActivity({
      projectId: insertFeedback.projectId,
      type: "feedback",
      content: insertFeedback.content
    });
    
    return newFeedback;
  }
  
  // Feedback Token methods
  async createFeedbackToken(token: InsertFeedbackToken): Promise<FeedbackToken> {
    // Generate random token if not provided
    const tokenValue = token.token || crypto.randomUUID().replace(/-/g, '');
    
    // Set expiration to 7 days from now if not provided
    const expiresAt = token.expiresAt || (() => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    })();
    
    const [newToken] = await db
      .insert(feedbackTokens)
      .values({
        projectId: token.projectId,
        token: tokenValue,
        expiresAt: expiresAt,
        isUsed: false
      })
      .returning();
      
    return newToken;
  }
  
  async getFeedbackToken(token: string): Promise<FeedbackToken | undefined> {
    const [feedbackToken] = await db
      .select()
      .from(feedbackTokens)
      .where(eq(feedbackTokens.token, token));
      
    return feedbackToken || undefined;
  }
  
  async getFeedbackTokensByProject(projectId: number): Promise<FeedbackToken[]> {
    return await db
      .select()
      .from(feedbackTokens)
      .where(eq(feedbackTokens.projectId, projectId))
      .orderBy(desc(feedbackTokens.createdAt));
  }
  
  async markFeedbackTokenAsUsed(token: string): Promise<FeedbackToken | undefined> {
    const [updatedToken] = await db
      .update(feedbackTokens)
      .set({ isUsed: true })
      .where(eq(feedbackTokens.token, token))
      .returning();
      
    return updatedToken || undefined;
  }

  // Activity methods
  async getActivitiesByClient(clientId: number): Promise<Activity[]> {
    // Get all client projects
    const clientProjects = await this.getProjectsByClient(clientId);
    const projectIds = clientProjects.map(project => project.id);
    
    if (projectIds.length === 0) return [];
    
    // Using inArray with drizzle
    return await db
      .select()
      .from(activities)
      .where(inArray(activities.projectId, projectIds))
      .orderBy(desc(activities.createdAt));
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(activities.createdAt);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    
    return activity;
  }
  
  // Milestone methods
  async getMilestonesByProject(projectId: number): Promise<Milestone[]> {
    return await db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(asc(milestones.order));
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id));
    
    return milestone || undefined;
  }
  
  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    // Get project to create related activity
    const project = await this.getProject(insertMilestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    const [milestone] = await db
      .insert(milestones)
      .values(insertMilestone)
      .returning();
    
    // Create activity for milestone creation
    await this.createActivity({
      projectId: milestone.projectId,
      type: "milestone",
      content: `New milestone created: ${milestone.title}`
    });
    
    return milestone;
  }
  
  async updateMilestone(updateData: UpdateMilestone): Promise<Milestone | undefined> {
    const milestone = await this.getMilestone(updateData.id);
    if (!milestone) return undefined;
    
    const updateValues: Partial<Milestone> = {};
    
    if (updateData.title !== undefined) {
      updateValues.title = updateData.title;
    }
    
    if (updateData.description !== undefined) {
      updateValues.description = updateData.description;
    }
    
    if (updateData.dueDate !== undefined) {
      updateValues.dueDate = updateData.dueDate;
    }
    
    if (updateData.completed !== undefined) {
      updateValues.completed = updateData.completed;
      
      // If milestone is completed, set completedAt date
      if (updateData.completed && !milestone.completed) {
        updateValues.completedAt = new Date();
        
        // Create activity for milestone completion
        await this.createActivity({
          projectId: milestone.projectId,
          type: "milestone",
          content: `Milestone completed: ${milestone.title}`
        });
      } else if (!updateData.completed && milestone.completed) {
        updateValues.completedAt = null;
      }
    }
    
    if (updateData.progress !== undefined) {
      updateValues.progress = updateData.progress;
    }
    
    if (updateData.order !== undefined) {
      updateValues.order = updateData.order;
    }
    
    const [updatedMilestone] = await db
      .update(milestones)
      .set(updateValues)
      .where(eq(milestones.id, updateData.id))
      .returning();
      
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    const milestone = await this.getMilestone(id);
    if (!milestone) return false;
    
    await db.delete(milestones).where(eq(milestones.id, id));
    
    // Create activity for milestone deletion
    await this.createActivity({
      projectId: milestone.projectId,
      type: "milestone",
      content: `Milestone deleted: ${milestone.title}`
    });
    
    return true;
  }
  
  // Notification methods
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    
    return notification;
  }
  
  async updateNotification(updateData: UpdateNotification): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: updateData.isRead })
      .where(eq(notifications.id, updateData.id))
      .returning();
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Invoice methods
  async getInvoices(): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByProject(projectId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.projectId, projectId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    
    return invoice || undefined;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate invoice number if not provided
    if (!insertInvoice.invoiceNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Get count of invoices for today to generate sequential number
      const todayInvoices: { count: number }[] = await db
        .select({ count: count() })
        .from(invoices)
        .where(sql`${invoices.invoiceNumber} LIKE ${`INV-${year}${month}${day}-%`}`);
      
      const invoiceCount = (todayInvoices[0]?.count || 0) + 1;
      const sequentialNumber = String(invoiceCount).padStart(4, '0');
      
      insertInvoice.invoiceNumber = `INV-${year}${month}${day}-${sequentialNumber}`;
    }

    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    
    // Create activity for invoice creation
    await this.createActivity({
      projectId: invoice.projectId,
      type: "payment",
      content: `Invoice created: ${invoice.invoiceNumber} for ${invoice.amount}`
    });
    
    // Create notification for client
    await this.createNotification({
      userId: invoice.clientId,
      type: "invoice_created",
      title: "New Invoice",
      message: `A new invoice (${invoice.invoiceNumber}) has been created for your project.`,
      projectId: invoice.projectId,
      metadata: { invoiceId: invoice.id }
    });
    
    return invoice;
  }

  async updateInvoice(updateData: UpdateInvoice): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(updateData.id);
    if (!invoice) return undefined;
    
    const updateValues: Partial<Invoice> = {};
    // Gunakan nilai dari notificationTypeEnum
    let notificationType: "status_update" | "new_message" | "new_feedback" | "new_milestone" | "milestone_update" | "payment_update" | "invoice_created" | "payment_received" | "admin_action" = "payment_update";
    let notificationTitle = "Invoice Updated";
    let notificationMessage = `Your invoice (${invoice.invoiceNumber}) has been updated.`;
    
    // Update only the fields that are provided
    if (updateData.title !== undefined) updateValues.title = updateData.title;
    if (updateData.description !== undefined) updateValues.description = updateData.description;
    if (updateData.amount !== undefined) updateValues.amount = updateData.amount;
    if (updateData.notes !== undefined) updateValues.notes = updateData.notes;
    if (updateData.termsAndConditions !== undefined) updateValues.termsAndConditions = updateData.termsAndConditions;
    if (updateData.dueDate !== undefined) updateValues.dueDate = updateData.dueDate;
    
    // Handle status changes
    if (updateData.status !== undefined) {
      updateValues.status = updateData.status;
      
      // Create special notifications based on status
      if (updateData.status === "paid") {
        notificationType = "payment_received";
        notificationTitle = "Payment Received";
        notificationMessage = `Your payment for invoice ${invoice.invoiceNumber} has been received.`;
        
        // If paid, set paidDate if not already set
        if (!invoice.paidDate) {
          updateValues.paidDate = new Date();
        }
      } else if (updateData.status === "sent") {
        notificationType = "invoice_created";
        notificationTitle = "Invoice Sent";
        notificationMessage = `Invoice ${invoice.invoiceNumber} has been sent to you.`;
      } else if (updateData.status === "overdue") {
        notificationTitle = "Invoice Overdue";
        notificationMessage = `Your invoice ${invoice.invoiceNumber} is now overdue.`;
      }
    }
    
    // Update paid amount if provided
    if (updateData.paidAmount !== undefined) {
      updateValues.paidAmount = updateData.paidAmount;
      
      // If paid amount equals full amount, mark as paid
      if (updateData.paidAmount >= invoice.amount && invoice.status !== "paid") {
        updateValues.status = "paid";
        updateValues.paidDate = new Date();
        
        notificationType = "payment_received";
        notificationTitle = "Payment Received";
        notificationMessage = `Your payment for invoice ${invoice.invoiceNumber} has been received in full.`;
      } else if (updateData.paidAmount > 0 && updateData.paidAmount < invoice.amount) {
        // Partial payment
        updateValues.status = "partial";
        
        notificationTitle = "Partial Payment";
        notificationMessage = `A partial payment of ${updateData.paidAmount} has been received for invoice ${invoice.invoiceNumber}.`;
      }
    }
    
    // Update PayPal related fields
    if (updateData.paypalOrderId !== undefined) updateValues.paypalOrderId = updateData.paypalOrderId;
    if (updateData.paypalOrderStatus !== undefined) updateValues.paypalOrderStatus = updateData.paypalOrderStatus;
    
    // Add updatedAt timestamp
    updateValues.updatedAt = new Date();
    
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateValues)
      .where(eq(invoices.id, updateData.id))
      .returning();
    
    // Create notification for the client
    await this.createNotification({
      userId: invoice.clientId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      projectId: invoice.projectId,
      metadata: { invoiceId: invoice.id }
    });
    
    // Create activity log
    await this.createActivity({
      projectId: invoice.projectId,
      type: "payment",
      content: `Invoice ${invoice.invoiceNumber} updated: ${notificationMessage}`
    });
    
    // Update project payment status if invoice is related to project
    if (invoice.type === "dp" && updateValues.status === "paid") {
      // If this is a DP invoice and it's now paid, update project status to in_progress
      await this.updateProject({
        id: invoice.projectId,
        status: "in_progress",
        paymentStatus: 50 // 50% paid
      });
    } else if (invoice.type === "final" && updateValues.status === "paid") {
      // If this is a final invoice and it's now paid, update project status to completed
      await this.updateProject({
        id: invoice.projectId,
        status: "completed",
        paymentStatus: 100 // 100% paid
      });
    }
    
    return updatedInvoice;
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByClient(clientId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByProject(projectId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.projectId, projectId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    
    // If payment is successful, update invoice
    if (payment.status === "success") {
      const invoice = await this.getInvoice(payment.invoiceId);
      if (invoice) {
        // Calculate new paid amount
        const newPaidAmount = (invoice.paidAmount || 0) + payment.amount;
        
        // Update invoice with new payment info
        await this.updateInvoice({
          id: invoice.id,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= invoice.amount ? "paid" : "partial"
        });
      }
    }
    
    // Create activity for payment
    await this.createActivity({
      projectId: payment.projectId,
      type: "payment",
      content: `Payment of ${payment.amount} received via ${payment.method}`
    });
    
    return payment;
  }
  
  // Chat methods
  async getChatMessagesByProject(projectId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(asc(chatMessages.createdAt));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    
    return chatMessage;
  }
  
  // Dashboard Widget methods
  async getDashboardWidgets(): Promise<DashboardWidget[]> {
    return await db.select().from(dashboardWidgets);
  }
  
  async getDashboardWidgetsByRole(role: string): Promise<DashboardWidget[]> {
    return await db
      .select()
      .from(dashboardWidgets)
      .where(
        sql`${dashboardWidgets.availableToRoles} && ARRAY[${role}]::text[]`
      );
  }
  
  async getDashboardWidget(id: number): Promise<DashboardWidget | undefined> {
    const [widget] = await db
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.id, id));
    
    return widget || undefined;
  }
  
  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const [newWidget] = await db
      .insert(dashboardWidgets)
      .values(widget)
      .returning();
    
    return newWidget;
  }
  
  // User Widget methods
  async getUserWidgets(userId: number): Promise<UserWidget[]> {
    return await db
      .select()
      .from(userWidgets)
      .where(eq(userWidgets.userId, userId))
      .orderBy(userWidgets.position);
  }
  
  async getUserWidget(id: number): Promise<UserWidget | undefined> {
    const [widget] = await db
      .select()
      .from(userWidgets)
      .where(eq(userWidgets.id, id));
    
    return widget || undefined;
  }
  
  async createUserWidget(widget: InsertUserWidget): Promise<UserWidget> {
    const [newWidget] = await db
      .insert(userWidgets)
      .values(widget)
      .returning();
    
    return newWidget;
  }
  
  async updateUserWidget(widget: UpdateUserWidget): Promise<UserWidget | undefined> {
    const [updatedWidget] = await db
      .update(userWidgets)
      .set({
        ...widget,
        updatedAt: new Date()
      })
      .where(eq(userWidgets.id, widget.id))
      .returning();
    
    return updatedWidget || undefined;
  }
  
  async deleteUserWidget(id: number): Promise<boolean> {
    const result = await db
      .delete(userWidgets)
      .where(eq(userWidgets.id, id));
    
    return result.count > 0;
  }
}

export const storage = new DatabaseStorage();
