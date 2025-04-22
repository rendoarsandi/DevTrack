import { users, projects, feedback, activities } from "@shared/schema";
import type { User, InsertUser, Project, InsertProject, Feedback, InsertFeedback, Activity, InsertActivity, UpdateProject } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProjects(): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(project: UpdateProject): Promise<Project | undefined>;
  
  // Feedback methods
  getFeedbackByProject(projectId: number): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Activity methods
  getActivitiesByClient(clientId: number): Promise<Activity[]>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private feedbacks: Map<number, Feedback>;
  private activities: Map<number, Activity>;
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentProjectId: number;
  currentFeedbackId: number;
  currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.feedbacks = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentFeedbackId = 1;
    this.currentActivityId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId,
    );
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      status: "awaiting_dp", 
      paymentStatus: 0, 
      progress: 0, 
      createdAt: now 
    };
    this.projects.set(id, project);
    
    // Create an activity for the new project
    await this.createActivity({
      projectId: id,
      type: "quotation",
      content: `Quotation sent for ${insertProject.title}`
    });
    
    return project;
  }

  async updateProject(updateData: UpdateProject): Promise<Project | undefined> {
    const project = this.projects.get(updateData.id);
    if (!project) return undefined;
    
    const updatedProject = { ...project };
    
    if (updateData.status !== undefined) {
      updatedProject.status = updateData.status;
    }
    
    if (updateData.paymentStatus !== undefined) {
      updatedProject.paymentStatus = updateData.paymentStatus;
      
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
      updatedProject.progress = updateData.progress;
    }
    
    this.projects.set(updatedProject.id, updatedProject);
    return updatedProject;
  }

  // Feedback methods
  async getFeedbackByProject(projectId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      (feedback) => feedback.projectId === projectId,
    );
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const now = new Date();
    const feedback: Feedback = { ...insertFeedback, id, createdAt: now };
    this.feedbacks.set(id, feedback);
    
    // Create activity for the feedback
    await this.createActivity({
      projectId: insertFeedback.projectId,
      type: "feedback",
      content: insertFeedback.content
    });
    
    return feedback;
  }

  // Activity methods
  async getActivitiesByClient(clientId: number): Promise<Activity[]> {
    // Get all client projects
    const clientProjects = await this.getProjectsByClient(clientId);
    const projectIds = clientProjects.map(project => project.id);
    
    // Get activities for those projects
    return Array.from(this.activities.values())
      .filter(activity => projectIds.includes(activity.projectId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
