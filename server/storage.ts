import { users, projects, feedback, activities, milestones, notifications } from "@shared/schema";
import type { 
  User, InsertUser, 
  Project, InsertProject, UpdateProject,
  Feedback, InsertFeedback, 
  Activity, InsertActivity,
  Milestone, InsertMilestone, UpdateMilestone,
  Notification, InsertNotification, UpdateNotification
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, inArray, and, asc, count } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
