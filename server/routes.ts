import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUpload } from "./upload";
import { 
  insertProjectSchema, updateProjectSchema, 
  insertFeedbackSchema, insertMilestoneSchema, 
  updateMilestoneSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Setup file upload routes
  setupFileUpload(app);

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
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
    try {
      const validatedData = updateProjectSchema.parse({
        ...req.body,
        id, // Ensure the ID is set correctly
      });
      
      const updatedProject = await storage.updateProject(validatedData);
      return res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Feedback Routes
  app.get("/api/projects/:id/feedback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });
    
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
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
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
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
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
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
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
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
    if (project.clientId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    
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
  return httpServer;
}
