import { db } from "./db";
import { users } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    console.log("Checking if admin already exists...");
    const existingAdmin = await db.select().from(users).where(eq(users.role, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("Admin already exists:", existingAdmin[0].username);
      return;
    }
    
    console.log("Creating admin account...");
    
    const adminData = {
      username: "admin",
      password: await hashPassword("admin123"), // default password, should be changed
      fullName: "System Administrator",
      email: "admin@projectmanager.com",
      role: "admin" as const,
    };
    
    const [admin] = await db.insert(users).values(adminData).returning();
    
    console.log("Admin account created successfully!");
    console.log("Username:", admin.username);
    console.log("Default Password: admin123");
    console.log("IMPORTANT: Please change the default password after first login!");
    
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });