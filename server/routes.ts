import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProjectSchema, updateProjectSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

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

  const httpServer = createServer(app);
  return httpServer;
}
