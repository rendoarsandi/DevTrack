import type { Express } from "express";
import { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUpload } from "./upload";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertProjectSchema, updateProjectSchema, 
  insertFeedbackSchema, insertMilestoneSchema, 
  updateMilestoneSchema,
  projects, activities, insertActivitySchema
} from "@shared/schema";
import { z } from "zod";
import { parse } from "url";


// Middleware to ensure user is an admin
function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup file upload routes
  setupFileUpload(app);
  
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
      ws.on('message', (messageData) => {
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
            storage.createFeedback({
              projectId,
              content: `CHAT: ${user.username} (${user.role}): ${parsedData.content}`
            }).catch(err => console.error('Error storing chat message:', err));
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
  
  return httpServer;
}
