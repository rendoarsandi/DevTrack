import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { 
  generateVerificationCode, 
  sendVerificationEmail, 
  verifyCode, 
  resendVerificationCode 
} from "./email-verification";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Fungsi untuk membandingkan password yang di-input dengan hash yang tersimpan
async function comparePasswords(supplied: string, stored: string) {
  // Jika password belum di-hash (untuk kasus pengembangan/pengujian)
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // Jika password sudah di-hash dengan format proper
  const [hashedPassword, salt] = stored.split('.');
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return buf.toString('hex') === hashedPassword;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "devtrack-secure-session-secret",
    resave: false,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  // Cache untuk user yang sering di-deserialize
  const userCache = new Map<number, Express.User>();
  const CACHE_TTL = 60 * 1000; // 60 detik cache TTL
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Cek apakah user ada di cache
      if (userCache.has(id)) {
        return done(null, userCache.get(id));
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return done(null, false);
      }
      
      // Simpan user di cache untuk akses cepat
      userCache.set(id, user);
      
      // Hapus dari cache setelah TTL berakhir
      setTimeout(() => {
        userCache.delete(id);
      }, CACHE_TTL);
      
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validasi data
      if (!req.body.username || !req.body.password || !req.body.email || !req.body.fullName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Periksa username yang sudah ada
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Periksa email yang sudah ada
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Buat user baru
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        emailVerified: false
      });

      // Kirim email verifikasi
      await sendVerificationEmail(user.email, user.username);

      // Login user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Hilangkan password dari respons
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          message: "Registration successful. Please check your email for verification."
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res.status(400).json({ message: error.message || "Invalid user data" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session save error:", loginErr);
          return next(loginErr);
        }
        
        // Return user info tanpa password untuk keamanan
        const { password, ...userWithoutPassword } = user as any;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Mengirim data user tanpa password untuk keamanan
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Endpoint untuk memulai verifikasi email
  app.post("/api/verify-email/send", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Pastikan user belum diverifikasi
    if (req.user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Kirim email verifikasi
    const success = await sendVerificationEmail(req.user.email, req.user.username);
    
    if (success) {
      return res.status(200).json({ message: "Verification email sent" });
    } else {
      return res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Endpoint untuk verifikasi kode
  app.post("/api/verify-email/verify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    // Verifikasi kode
    const isValid = verifyCode(req.user.email, code);
    
    if (isValid) {
      // Update status verifikasi email user
      const updatedUser = await storage.updateUserEmailVerification(req.user.id, true);
      
      if (updatedUser) {
        // Update user dalam session
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).json({ message: "Failed to update session" });
          }
          return res.status(200).json({ message: "Email verified successfully", user: updatedUser });
        });
      } else {
        return res.status(500).json({ message: "Failed to update user verification status" });
      }
    } else {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }
  });

  // Endpoint untuk mengirim ulang kode verifikasi
  app.post("/api/verify-email/resend", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Pastikan user belum diverifikasi
    if (req.user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Kirim ulang kode verifikasi
    const success = await resendVerificationCode(req.user.email);
    
    if (success) {
      return res.status(200).json({ message: "Verification code resent" });
    } else {
      return res.status(500).json({ message: "Failed to resend verification code" });
    }
  });
}
