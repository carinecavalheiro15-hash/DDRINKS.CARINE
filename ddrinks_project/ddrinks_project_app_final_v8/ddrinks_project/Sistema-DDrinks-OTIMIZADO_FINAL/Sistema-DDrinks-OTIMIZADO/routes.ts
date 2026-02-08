import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { postgresStorage as storage } from "./postgres-storage";
import { insertUserSchema, insertEventSchema } from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      (req.session as any).userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEvents((req.session as any).userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event || event.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      console.log("Received event data:", JSON.stringify(req.body, null, 2));
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...eventData,
        userId: (req.session as any).userId,
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Event validation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ 
          message: "Invalid event data", 
          details: error.message 
        });
      } else {
        res.status(400).json({ message: "Invalid event data" });
      }
    }
  });

  app.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event || event.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Event not found" });
      }

      const updatedEvent = await storage.updateEvent(req.params.id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event || event.userId !== (req.session as any).userId) {
        return res.status(404).json({ message: "Event not found" });
      }

      const deleted = await storage.deleteEvent(req.params.id);
      if (deleted) {
        res.json({ message: "Event deleted successfully" });
      } else {
        res.status(404).json({ message: "Event not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getEventStats((req.session as any).userId);
      
      // Calculate conversion rate and growth (mock data for growth)
      const conversionRate = stats.totalEvents > 0 
        ? Math.round((stats.acceptedEvents / stats.totalEvents) * 100) 
        : 0;
      
      res.json({
        ...stats,
        conversionRate,
        growth: 12, // Mock growth percentage
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/charts", requireAuth, async (req, res) => {
    try {
      const monthlyEvents = await storage.getMonthlyEventCounts((req.session as any).userId);
      const stats = await storage.getEventStats((req.session as any).userId);
      
      res.json({
        monthlyEvents,
        statusCounts: {
          accepted: stats.acceptedEvents,
          pending: stats.pendingEvents,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
