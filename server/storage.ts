import { users, projects, feedback, activities } from "@shared/schema";
import type { User, InsertUser, Project, InsertProject, Feedback, InsertFeedback, Activity, InsertActivity, UpdateProject } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
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

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
        status: "awaiting_dp",
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
}

export const storage = new DatabaseStorage();
