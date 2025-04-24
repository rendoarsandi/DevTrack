import type { Express } from "express";
import { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUpload } from "./upload";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, verifyCode, resendVerificationCode } from "./email-verification";
import { createOrder, capturePayment, getOrderDetails } from "./paypal";
import { 
  insertProjectSchema, updateProjectSchema, 
  insertFeedbackSchema, insertFeedbackTokenSchema, insertMilestoneSchema, 
  updateMilestoneSchema, insertNotificationSchema,
  updateNotificationSchema, insertInvoiceSchema, updateInvoiceSchema,
  insertPaymentSchema, projects, activities, insertActivitySchema,
  invoices, payments
} from "@shared/schema";
import { z } from "zod";
import { parse } from "url";


// Middleware to ensure user is an admin
function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log("Admin auth check:", { 
    isAuthenticated: req.isAuthenticated(), 
    user: req.user ? { 
      id: req.user.id, 
      username: req.user.username, 
      role: req.user.role 
    } : null 
  });
  
  if (!req.isAuthenticated()) {
    console.log("Admin access denied: Not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Special handling for demo admin user
  if (req.user.username === 'admin') {
    console.log("Admin access granted to admin user");
    return next();
  }
  
  if (!req.user.role || req.user.role !== "admin") {
    console.log("Admin access denied: Not admin role");
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  console.log("Admin access granted");
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup file upload routes
  setupFileUpload(app);
  
  // Email verification routes
  app.post("/api/verify-email/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user;
    
    // Jangan kirim kode verifikasi jika email sudah diverifikasi
    if (user.emailVerified) {
      return res.status(400).json({ 
        message: "Email already verified",
        code: "EMAIL_ALREADY_VERIFIED"
      });
    }
    
    // Pastikan user punya email
    if (!user.email) {
      return res.status(400).json({ 
        message: "User does not have an email address",
        code: "NO_EMAIL_ADDRESS"
      });
    }
    
    try {
      const success = await sendVerificationEmail(user.email, user.username);
      
      if (success) {
        return res.status(200).json({ 
          message: "Verification code sent successfully" 
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to send verification code",
          code: "EMAIL_SEND_FAILED"
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      return res.status(500).json({ 
        message: "An error occurred while sending verification code",
        code: "SERVER_ERROR"
      });
    }
  });
  
  app.post("/api/verify-email/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user;
    const { code } = req.body;
    
    // Pastikan user punya email
    if (!user.email) {
      return res.status(400).json({ 
        message: "User does not have an email address",
        code: "NO_EMAIL_ADDRESS" 
      });
    }
    
    // Verifikasi kode
    if (!code || !verifyCode(user.email, code)) {
      return res.status(400).json({ 
        message: "Invalid or expired verification code",
        code: "INVALID_CODE"
      });
    }
    
    try {
      // Update status verifikasi email di database
      const updatedUser = await storage.updateUserEmailVerification(user.id, true);
      
      if (updatedUser) {
        // Update user di session
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Error updating session:", err);
            return res.status(500).json({ 
              message: "Failed to update session",
              code: "SESSION_UPDATE_FAILED"
            });
          }
          
          return res.status(200).json({ 
            message: "Email verified successfully",
            user: {
              id: updatedUser.id,
              username: updatedUser.username,
              email: updatedUser.email,
              emailVerified: updatedUser.emailVerified,
              role: updatedUser.role
            }
          });
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to update user verification status",
          code: "UPDATE_FAILED"
        });
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({ 
        message: "An error occurred while verifying email",
        code: "SERVER_ERROR"
      });
    }
  });
  
  app.post("/api/verify-email/resend", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user;
    
    // Jangan kirim kode verifikasi jika email sudah diverifikasi
    if (user.emailVerified) {
      return res.status(400).json({ 
        message: "Email already verified",
        code: "EMAIL_ALREADY_VERIFIED"
      });
    }
    
    // Pastikan user punya email
    if (!user.email) {
      return res.status(400).json({ 
        message: "User does not have an email address",
        code: "NO_EMAIL_ADDRESS"
      });
    }
    
    try {
      const success = await resendVerificationCode(user.email);
      
      if (success) {
        return res.status(200).json({ 
          message: "Verification code resent successfully" 
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to resend verification code",
          code: "EMAIL_RESEND_FAILED"
        });
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      return res.status(500).json({ 
        message: "An error occurred while resending verification code",
        code: "SERVER_ERROR"
      });
    }
  });
  
  // Admin routes
  app.get("/api/admin/projects", adminAuthMiddleware, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      return res.json(projects);
    } catch (error) {
      console.error("Error fetching admin projects:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/admin/projects/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
      
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      return res.json(project);
    } catch (error) {
      console.error("Error fetching project details:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Endpoint for admin to get project feedback (including review messages)
  app.get("/api/admin/projects/:id/feedback", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
      
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      const feedback = await storage.getFeedbackByProject(id);
      return res.json(feedback);
    } catch (error) {
      console.error("Error fetching project feedback:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Endpoint for admin to get project activities
  app.get("/api/admin/projects/:id/activities", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
      
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      const activities = await storage.getActivitiesByProject(id);
      return res.json(activities);
    } catch (error) {
      console.error("Error fetching project activities:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/admin/projects/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
      
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      const validatedData = updateProjectSchema.parse({
        ...req.body,
        id,
      });
      
      const updatedProject = await storage.updateProject(validatedData);
      
      // Create activity record for status changes
      if (req.body.status && req.body.status !== project.status) {
        await storage.createActivity({
          projectId: id,
          type: "status_change",
          content: `Project status changed from ${project.status} to ${req.body.status}`,
        });
        
        // Create notification for the client
        await storage.createNotification({
          userId: project.clientId,
          type: "status_update",
          title: "Project Status Changed",
          message: `Your project "${project.title}" status changed from ${project.status} to ${req.body.status}`,
          projectId: id,
          metadata: { 
            oldStatus: project.status,
            newStatus: req.body.status
          }
        });
      }
      
      // Create activity record for admin feedback
      if (req.body.adminFeedback && req.body.adminFeedback !== project.adminFeedback) {
        await storage.createActivity({
          projectId: id,
          type: "feedback",
          content: `Admin provided feedback: ${req.body.adminFeedback}`,
        });
      }
      
      return res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/admin/users", adminAuthMiddleware, async (req, res) => {
    try {
      // This would need a getUsers method in storage, 
      // but we'll handle this in the future.
      // For now, return empty array
      return res.json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Projects Routes
  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user;
    const projects = await storage.getProjectsByClient(user.id);
    return res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    return res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Periksa apakah email pengguna telah diverifikasi
    if (!req.user.emailVerified) {
      return res.status(403).json({ 
        message: "Email verification required",
        code: "EMAIL_VERIFICATION_REQUIRED"
      });
    }
    
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        clientId: req.user.id, // Force the clientId to be the current user
      });
      
      const project = await storage.createProject(validatedData);
      return res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid project ID" });
    
    // Validate the project exists and belongs to the user
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Only non-admins (clients) are restricted to their own projects
    if (req.user.role !== "admin" && project.clientId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      // Pastikan untuk melakukan deep copy object
      const requestData = JSON.parse(JSON.stringify(req.body));
      
      const validatedData = updateProjectSchema.parse({
        ...requestData,
        id, // Ensure the ID is set correctly
      });
      
      // Khusus untuk status, tambahkan activity log
      if (validatedData.status !== undefined && validatedData.status !== project.status) {
        // Buat activity log untuk perubahan status
        await storage.createActivity({
          projectId: id,
          type: "status_change",
          content: `Project status changed from ${project.status} to ${validatedData.status}`
        });
      }
      
      const updatedProject = await storage.updateProject(validatedData);
      return res.json(updatedProject);
    } catch (error) {
      console.error("Project update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  // Feedback Routes
  app.get("/api/projects/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Allow access to both the client who owns the project AND any admin user
    if (project.clientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const feedback = await storage.getFeedbackByProject(projectId);
    return res.json(feedback);
  });

  app.post("/api/projects/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertFeedbackSchema.parse({
        ...req.body,
        projectId,
      });
      
      const feedback = await storage.createFeedback(validatedData);
      
      // Create notification for admin user(s)
      // For now, we'll just store one notification that will be seen by any admin
      const adminNotification = {
        userId: 1, // Assuming admin user has ID 1, this should be refined later
        type: "new_feedback" as const,
        title: "New Feedback",
        message: `Client ${req.user.username} provided feedback on project "${project.title}"`,
        projectId,
        metadata: { feedbackId: feedback.id }
      };
      
      await storage.createNotification(adminNotification);
      
      return res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Project Review Routes
  app.post("/api/projects/:id/review", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    try {
      // Validate project is in a reviewable state
      if (project.status !== "under_review") {
        return res.status(400).json({ 
          message: "Project is not currently under review" 
        });
      }
      
      const { action, ratings, feedback } = req.body;
      
      if (!action || !["approve", "request_changes", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid review action" });
      }
      
      // Determine the new status based on the action
      let paymentStatus = project.paymentStatus;
      
      // Inisialisasi newStatus dengan nilai default
      let newStatus: "pending_review" | "awaiting_dp" | "in_progress" | "under_review" | "completed" | "rejected";
      
      if (action === "approve") {
        // Jika di-approve, status berubah ke completed dengan pembayaran final
        newStatus = "completed"; 
        paymentStatus = 100; // Menandakan project selesai dan terbayar penuh
      } else if (action === "request_changes") {
        // Jika ada request changes, kembali ke in_progress
        newStatus = "in_progress";
      } else {
        // Jika ditolak
        newStatus = "rejected";
      }
      
      // Update the project status
      const updatedProject = await storage.updateProject({
        id: projectId,
        status: newStatus as any, // terpaksa casting karena ada type error
        paymentStatus: paymentStatus
      });
      
      // Create feedback record with the detailed review
      const reviewFeedback = await storage.createFeedback({
        projectId,
        content: feedback || `Project ${action === "approve" ? "approved" : action === "request_changes" ? "needs changes" : "rejected"}`
      });
      
      // Log this as an activity
      await storage.createActivity({
        projectId,
        type: "review",
        content: `Client ${
          action === "approve" ? "approved the project. Final payment required." : 
          action === "request_changes" ? "requested changes to the project." : 
          "rejected the project."
        }`
      });
      
      return res.status(200).json({
        success: true,
        project: updatedProject,
        feedback: reviewFeedback
      });
    } catch (error) {
      console.error("Error processing project review:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint khusus untuk menerima proyek oleh client
  app.post("/api/projects/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    // Validasi proyek ada dan milik pengguna
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    // Validasi proyek dalam status yang tepat
    if (project.status !== "under_review") {
      return res.status(400).json({ message: "Project is not in reviewable state" });
    }
    
    try {
      // Extract message jika ada
      const { message } = req.body;
      
      // Submit feedback jika ada pesan
      if (message) {
        // Cek apakah pesan sudah memiliki prefix
        const hasPrefix = message.startsWith('REVIEW:');
        
        // Hanya tambahkan prefix jika belum ada
        let content = message;
        if (!hasPrefix) {
          content = `REVIEW: ${message}`;
        }
        
        await storage.createFeedback({
          projectId,
          content: content
        });
      }
      
      // Update status proyek ke completed (sebagai pengganti approved)
      const updatedProject = await db
        .update(projects)
        .set({
          status: "completed",
          progress: 90
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      // Buat activity log untuk mencatat perubahan status
      await db.insert(activities).values({
        projectId,
        type: "status_change",
        content: "Project has been accepted by client. Awaiting final payment."
      });
      
      return res.status(200).json({ 
        success: true,
        project: updatedProject[0]
      });
    } catch (error) {
      console.error("Error accepting project:", error);
      return res.status(500).json({ 
        message: "Failed to accept project: " + (error instanceof Error ? error.message : "Unknown error")
      });
    }
  });
  
  // Endpoint untuk meminta perubahan pada proyek
  app.post("/api/projects/:id/request-changes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    // Validasi proyek ada dan milik pengguna
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    // Validasi proyek dalam status yang tepat
    if (project.status !== "under_review") {
      return res.status(400).json({ message: "Project is not in reviewable state" });
    }
    
    try {
      // Extract message (harus ada)
      const { message } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Feedback message is required" });
      }
      
      // Submit feedback with a special prefix to mark it as a change request
      // Cek apakah sudah ada tag JSON attachments
      const hasAttachments = message.includes('---ATTACHMENTS_DATA---');
      const hasPrefix = message.startsWith('REQUEST CHANGES:');
      
      // Hanya tambahkan prefix jika belum ada
      let content = message;
      if (!hasPrefix) {
        content = `REQUEST CHANGES: ${message}`;
      }
      
      await storage.createFeedback({
        projectId,
        content: content
      });
      
      // Hitung progress baru
      const newProgress = Math.max(30, project.progress - 10);
      
      // Update status proyek ke in_progress
      const updatedProject = await db
        .update(projects)
        .set({
          status: "in_progress",
          progress: newProgress
        })
        .where(eq(projects.id, projectId))
        .returning();
      
      // Buat activity log untuk mencatat perubahan status
      await db.insert(activities).values({
        projectId,
        type: "status_change",
        content: "Client requested changes to the project. Returning to development."
      });
      
      return res.status(200).json({ 
        success: true,
        project: updatedProject[0]
      });
    } catch (error) {
      console.error("Error requesting changes:", error);
      return res.status(500).json({ 
        message: "Failed to request changes: " + (error instanceof Error ? error.message : "Unknown error")
      });
    }
  });
  
  // Activities Routes
  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const activities = await storage.getActivitiesByClient(req.user.id);
    return res.json(activities);
  });

  app.get("/api/projects/:id/activities", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Allow access to both the client who owns the project AND any admin user
    if (project.clientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const activities = await storage.getActivitiesByProject(projectId);
    return res.json(activities);
  });
  
  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const count = await storage.getUnreadNotificationCount(req.user.id);
      return res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid notification ID" });
    
    try {
      const validatedData = updateNotificationSchema.parse({
        ...req.body,
        id
      });
      
      const notification = await storage.updateNotification(validatedData);
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      
      return res.json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/notifications/mark-all-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Milestone Routes
  app.get("/api/projects/:id/milestones", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Allow access to both the client who owns the project AND any admin user
    if (project.clientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const milestones = await storage.getMilestonesByProject(projectId);
    return res.json(milestones);
  });
  
  app.post("/api/projects/:id/milestones", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    try {
      // Get count of existing milestones to determine the order
      const existingMilestones = await storage.getMilestonesByProject(projectId);
      const order = existingMilestones.length;
      
      const validatedData = insertMilestoneSchema.parse({
        ...req.body,
        projectId,
        order,
      });
      
      const milestone = await storage.createMilestone(validatedData);
      return res.status(201).json(milestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/projects/:projectId/milestones/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.projectId);
    const id = parseInt(req.params.id);
    
    if (isNaN(projectId) || isNaN(id)) {
      return res.status(400).json({ message: "Invalid project or milestone ID" });
    }
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Allow access to both the client who owns the project AND any admin user
    if (project.clientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Verify the milestone exists and belongs to the project
    const milestone = await storage.getMilestone(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });
    if (milestone.projectId !== projectId) {
      return res.status(400).json({ message: "Milestone does not belong to this project" });
    }
    
    try {
      const validatedData = updateMilestoneSchema.parse({
        ...req.body,
        id,
      });
      
      const updatedMilestone = await storage.updateMilestone(validatedData);
      
      // If the milestone was completed, check if all milestones are completed to update project progress
      if (updatedMilestone?.completed) {
        const milestones = await storage.getMilestonesByProject(projectId);
        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => m.completed).length;
        
        // Calculate overall project progress
        const progress = Math.round((completedMilestones / totalMilestones) * 100);
        
        if (progress !== project.progress) {
          await storage.updateProject({
            id: projectId,
            progress,
          });
        }
      }
      
      return res.json(updatedMilestone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/projects/:projectId/milestones/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.projectId);
    const id = parseInt(req.params.id);
    
    if (isNaN(projectId) || isNaN(id)) {
      return res.status(400).json({ message: "Invalid project or milestone ID" });
    }
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Allow access to both the client who owns the project AND any admin user
    if (project.clientId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Verify the milestone exists and belongs to the project
    const milestone = await storage.getMilestone(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });
    if (milestone.projectId !== projectId) {
      return res.status(400).json({ message: "Milestone does not belong to this project" });
    }
    
    const success = await storage.deleteMilestone(id);
    
    if (success) {
      // Recalculate project progress after milestone deletion
      const milestones = await storage.getMilestonesByProject(projectId);
      
      if (milestones.length > 0) {
        const completedMilestones = milestones.filter(m => m.completed).length;
        const progress = Math.round((completedMilestones / milestones.length) * 100);
        
        if (progress !== project.progress) {
          await storage.updateProject({
            id: projectId,
            progress,
          });
        }
      }
      
      return res.sendStatus(204);
    } else {
      return res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // Store clients by project
  interface ChatClient {
    ws: WebSocket;
    user: {
      id: number | string;
      username: string;
      role: string;
    };
    projectId: number;
  }
  
  const clients: ChatClient[] = [];
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    // Parse query parameters
    const { query } = parse(req.url || '', true);
    const userString = query.user as string;
    const projectIdString = query.projectId as string;
    
    if (!userString || !projectIdString) {
      console.log('Missing user or projectId in query params');
      ws.close();
      return;
    }
    
    try {
      const user = JSON.parse(userString);
      const projectId = parseInt(projectIdString);
      
      if (!user.id || !user.username || !user.role || isNaN(projectId)) {
        console.log('Invalid user data or projectId');
        ws.close();
        return;
      }
      
      // Add client to clients list
      const client: ChatClient = {
        ws,
        user,
        projectId
      };
      
      clients.push(client);
      
      // Send system message to confirm connection
      const systemMessage = {
        type: 'system',
        content: `${user.role === 'admin' ? 'Admin' : 'Client'} ${user.username} has joined the chat`,
        timestamp: new Date().toISOString(),
        sender: {
          id: 'system',
          username: 'System',
          role: 'system'
        },
        projectId
      };
      
      // Broadcast to all clients in this project
      broadcastToProject(projectId, systemMessage);
      
      // Listen for messages
      ws.on('message', async (messageData) => {
        try {
          const parsedData = JSON.parse(messageData.toString());
          if (!parsedData.content) return;
          
          const message = {
            type: 'chat',
            content: parsedData.content,
            timestamp: new Date().toISOString(),
            sender: user,
            projectId
          };
          
          // Log to database as feedback
          try {
            // Store in database asynchronously - don't wait for result
            await storage.createFeedback({
              projectId,
              content: `CHAT: ${user.username} (${user.role}): ${parsedData.content}`
            });
            
            // Get project to find client and notify them
            const project = await storage.getProject(projectId);
            if (project) {
              // If message is from admin, notify client
              if (user.role === 'admin') {
                await storage.createNotification({
                  userId: project.clientId,
                  type: 'new_message',
                  title: 'New Message',
                  message: `Admin sent: ${parsedData.content.substring(0, 50)}${parsedData.content.length > 50 ? '...' : ''}`,
                  projectId,
                  metadata: { messageType: 'chat' }
                });
              } 
              // If message is from client, notify admin users (future implementation)
              // This would need to get all admin users and notify each one
            }
          } catch (e) {
            console.error('Error creating feedback record:', e);
          }
          
          // Broadcast message to all clients in this project
          broadcastToProject(projectId, message);
        } catch (e) {
          console.error('Error processing message:', e);
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        console.log(`Client disconnected: ${user.username}`);
        // Remove client from list
        const index = clients.findIndex(c => 
          c.ws === ws && 
          c.user.id === user.id && 
          c.projectId === projectId
        );
        
        if (index !== -1) {
          clients.splice(index, 1);
          
          // Send system message about disconnection
          const disconnectMessage = {
            type: 'system',
            content: `${user.role === 'admin' ? 'Admin' : 'Client'} ${user.username} has left the chat`,
            timestamp: new Date().toISOString(),
            sender: {
              id: 'system',
              username: 'System',
              role: 'system'
            },
            projectId
          };
          
          broadcastToProject(projectId, disconnectMessage);
        }
      });
      
    } catch (error) {
      console.error('Error parsing connection parameters:', error);
      ws.close();
    }
  });
  
  // Function to broadcast to all clients in a specific project
  function broadcastToProject(projectId: number, message: any) {
    const projectClients = clients.filter(client => client.projectId === projectId);
    const messageStr = JSON.stringify(message);
    
    projectClients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }
  
  // ============ INVOICE API ENDPOINTS ============
  
  // Get all invoices (admin only)
  app.get("/api/admin/invoices", adminAuthMiddleware, async (req, res) => {
    try {
      const allInvoices = await storage.getInvoices();
      return res.json(allInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all invoices for a specific client (admin or client)
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      let invoiceList;
      
      if (req.user.role === "admin") {
        // Admin kan melihat semua invoice
        invoiceList = await storage.getInvoices();
      } else {
        // Client hanya dapat melihat invoice mereka sendiri
        invoiceList = await storage.getInvoicesByClient(req.user.id);
      }
      
      return res.json(invoiceList);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get invoices for a specific project
  app.get("/api/projects/:id/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    try {
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      // Pastikan pengguna adalah client yang memiliki proyek atau admin
      if (req.user.role !== "admin" && project.clientId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const invoiceList = await storage.getInvoicesByProject(projectId);
      return res.json(invoiceList);
    } catch (error) {
      console.error("Error fetching project invoices:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });
    
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      
      // Pastikan pengguna adalah client yang memiliki invoice atau admin
      if (req.user.role !== "admin" && invoice.clientId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      return res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new invoice (admin only)
  app.post("/api/invoices", adminAuthMiddleware, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      // Validasi project dan client
      const project = await storage.getProject(validatedData.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      
      const invoice = await storage.createInvoice(validatedData);
      return res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update an invoice (admin only)
  app.patch("/api/invoices/:id", adminAuthMiddleware, async (req, res) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });
    
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      
      const validatedData = updateInvoiceSchema.parse({
        ...req.body,
        id: invoiceId,
      });
      
      const updatedInvoice = await storage.updateInvoice(validatedData);
      return res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // ============ PAYMENT API ENDPOINTS ============
  
  // Get all payments (admin only)
  app.get("/api/admin/payments", adminAuthMiddleware, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      return res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get payments for a specific invoice
  app.get("/api/invoices/:id/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return res.status(400).json({ message: "Invalid invoice ID" });
    
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      
      // Pastikan pengguna adalah client yang memiliki invoice atau admin
      if (req.user.role !== "admin" && invoice.clientId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const paymentList = await storage.getPaymentsByInvoice(invoiceId);
      return res.json(paymentList);
    } catch (error) {
      console.error("Error fetching invoice payments:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a payment record (admin or client)
  app.post("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      
      // Admin dapat membuat pembayaran untuk invoice apapun
      // Client hanya dapat membuat pembayaran untuk invoice mereka sendiri
      if (req.user.role !== "admin") {
        const invoice = await storage.getInvoice(validatedData.invoiceId);
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        
        if (invoice.clientId !== req.user.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
        
        // Set clientId to current user if not admin
        validatedData.clientId = req.user.id;
      }
      
      const payment = await storage.createPayment(validatedData);
      return res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Webhook untuk Xendit (tanpa autentikasi)
  app.post("/api/webhooks/xendit", async (req, res) => {
    try {
      // Validasi Xendit signature (akan diimplementasikan nanti)
      // For now, just log the webhook data
      console.log("Received Xendit webhook:", req.body);
      
      const { event, data } = req.body;
      
      // Handle berbagai tipe event dari Xendit
      if (event === "invoice.paid") {
        const xenditInvoiceId = data.id;
        
        // Cari invoice berdasarkan metadata yang mengandung xenditId
        const allInvoices = await db.select().from(invoices);
        const invoice = allInvoices.find(inv => {
          if (!inv.metadata || typeof inv.metadata !== 'object') return false;
          
          // Pastikan metadata adalah object dan convert ke tipe yang aman
          const metadata = inv.metadata as Record<string, any>;
          return metadata.xenditId === xenditInvoiceId;
        });
        
        if (invoice) {
          // Update status invoice menjadi paid
          await storage.updateInvoice({
            id: invoice.id,
            status: "paid",
            paidDate: new Date(),
            paidAmount: invoice.amount,
            metadata: { 
              // Hanya copy metadata yang sudah ada jika itu adalah object
              ...(invoice.metadata && typeof invoice.metadata === 'object' 
                ? Object.fromEntries(Object.entries(invoice.metadata as object)) 
                : {}),
              xenditPaymentData: data 
            }
          });
          
          // Tambahkan payment record
          await storage.createPayment({
            invoiceId: invoice.id,
            projectId: invoice.projectId,
            clientId: invoice.clientId,
            amount: invoice.amount,
            method: data.payment_method || "xendit",
            status: "success",
            transactionId: data.payment_id,
            notes: "Paid via Xendit",
            metadata: data
          });
        }
      }
      
      // Selalu return 200 untuk webhook
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing Xendit webhook:", error);
      // Tetap return 200 untuk webhook (mencegah Xendit retry yang berlebihan)
      return res.status(200).json({ success: false, error: "Error processing webhook" });
    }
  });
  
  // Feedback Tokens API Endpoints
  
  // Generate a new feedback token for a project (admin only)
  app.post("/api/admin/projects/:id/feedback-tokens", adminAuthMiddleware, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Create a new feedback token
      const token = await storage.createFeedbackToken({ projectId });
      
      return res.status(201).json(token);
    } catch (error) {
      console.error("Error creating feedback token:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all feedback tokens for a project (admin only)
  app.get("/api/admin/projects/:id/feedback-tokens", adminAuthMiddleware, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const tokens = await storage.getFeedbackTokensByProject(projectId);
      return res.json(tokens);
    } catch (error) {
      console.error("Error fetching feedback tokens:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Public feedback submission endpoint (no authentication required)
  app.post("/api/public/feedback/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { content, rating } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Feedback content is required" });
      }
      
      // Get the token and check if it's valid
      const feedbackToken = await storage.getFeedbackToken(token);
      if (!feedbackToken) {
        return res.status(404).json({ message: "Invalid feedback token" });
      }
      
      // Check if token is expired
      if (feedbackToken.expiresAt && new Date(feedbackToken.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Feedback token has expired" });
      }
      
      // Check if token is already used
      if (feedbackToken.isUsed) {
        return res.status(400).json({ message: "Feedback token has already been used" });
      }
      
      // Create the feedback
      const newFeedback = await storage.createFeedback({
        projectId: feedbackToken.projectId,
        content,
        rating: rating ? parseInt(rating) : undefined
      });
      
      // Mark the token as used
      await storage.markFeedbackTokenAsUsed(token);
      
      // Get the project to create notification
      const project = await storage.getProject(feedbackToken.projectId);
      
      // Notify admin about new feedback
      if (project) {
        // Find all admin users (would need a getAdmins method, future enhancement)
        // For now, let's just create a notification for the client
        await storage.createNotification({
          userId: project.clientId,
          type: "new_feedback",
          title: "New Feedback Received",
          message: `New feedback received for project "${project.title}"`,
          projectId: project.id,
          metadata: { feedbackId: newFeedback.id }
        });
      }
      
      return res.status(201).json({
        message: "Feedback submitted successfully",
        feedback: newFeedback
      });
    } catch (error) {
      console.error("Error submitting public feedback:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get feedback token info (public, for validating token before showing form)
  app.get("/api/public/feedback/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;
      const feedbackToken = await storage.getFeedbackToken(token);
      
      if (!feedbackToken) {
        return res.status(404).json({
          valid: false,
          message: "Invalid feedback token"
        });
      }
      
      // Check if token is expired
      if (feedbackToken.expiresAt && new Date(feedbackToken.expiresAt) < new Date()) {
        return res.status(200).json({
          valid: false,
          message: "Feedback token has expired"
        });
      }
      
      // Check if token is already used
      if (feedbackToken.isUsed) {
        return res.status(200).json({
          valid: false,
          message: "Feedback token has already been used"
        });
      }
      
      // Get project information
      const project = await storage.getProject(feedbackToken.projectId);
      
      return res.status(200).json({
        valid: true,
        projectId: feedbackToken.projectId,
        projectTitle: project?.title || "Unknown Project",
        expiresAt: feedbackToken.expiresAt
      });
    } catch (error) {
      console.error("Error validating feedback token:", error);
      return res.status(500).json({ 
        valid: false,
        message: "Internal server error" 
      });
    }
  });

  // PayPal endpoints
  
  // 1. Membuat order PayPal baru
  app.post("/api/paypal/create-order", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { invoiceId } = req.body;
      
      if (!invoiceId) {
        return res.status(400).json({ message: "Invoice ID is required" });
      }
      
      const invoice = await storage.getInvoice(parseInt(invoiceId));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Pastikan pengguna adalah client yang memiliki invoice atau admin
      if (req.user.role !== "admin" && invoice.clientId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Buat item untuk order PayPal
      const items = [
        {
          name: invoice.title,
          description: invoice.description.substring(0, 127), // PayPal membatasi deskripsi hingga 127 karakter
          amount: invoice.amount
        }
      ];
      
      // Buat order PayPal
      const order = await createOrder(items, invoice.amount, "USD", invoice.invoiceNumber);
      
      // Update invoice dengan ID order PayPal
      await storage.updateInvoice({
        id: invoice.id,
        paypalOrderId: order.id,
        paypalOrderStatus: order.status
      });
      
      return res.json({
        orderId: order.id,
        status: order.status,
        links: order.links
      });
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      return res.status(500).json({ message: "Failed to create PayPal order" });
    }
  });
  
  // 2. Menangkap pembayaran PayPal setelah disetujui oleh pengguna
  app.post("/api/paypal/capture-payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { orderId, invoiceId } = req.body;
      
      if (!orderId || !invoiceId) {
        return res.status(400).json({ message: "Order ID and Invoice ID are required" });
      }
      
      const invoice = await storage.getInvoice(parseInt(invoiceId));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Pastikan pengguna adalah client yang memiliki invoice atau admin
      if (req.user.role !== "admin" && invoice.clientId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Tangkap pembayaran
      const captureData = await capturePayment(orderId);
      
      // Periksa status pembayaran
      if (captureData.status === 'COMPLETED') {
        // Update invoice menjadi paid
        await storage.updateInvoice({
          id: invoice.id,
          status: "paid",
          paidDate: new Date(),
          paidAmount: invoice.amount,
          paypalOrderStatus: captureData.status,
          metadata: { paypalCaptureData: captureData }
        });
        
        // Tambahkan payment record
        await storage.createPayment({
          invoiceId: invoice.id,
          projectId: invoice.projectId,
          clientId: invoice.clientId,
          amount: invoice.amount,
          method: "paypal",
          status: "success",
          transactionId: captureData.id,
          notes: "Paid via PayPal",
          metadata: captureData
        });
        
        return res.json({
          success: true,
          status: captureData.status,
          transactionId: captureData.id
        });
      } else {
        return res.json({
          success: false,
          status: captureData.status,
          message: "Payment not completed"
        });
      }
    } catch (error) {
      console.error("Error capturing PayPal payment:", error);
      return res.status(500).json({ message: "Failed to capture payment" });
    }
  });
  
  // 3. Mendapatkan status order PayPal
  app.get("/api/paypal/order-status/:orderId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      // Dapatkan detail order
      const orderDetails = await getOrderDetails(orderId);
      
      return res.json({
        status: orderDetails.status,
        details: orderDetails
      });
    } catch (error) {
      console.error("Error getting PayPal order details:", error);
      return res.status(500).json({ message: "Failed to get order details" });
    }
  });
  
  return httpServer;
}
