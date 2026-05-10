import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { port, jwtSecret, tokenTtlSeconds } from "./config";
import { verifyToken } from "./auth";
import * as svc from "./services";
import prisma from "./prisma";
import nodemailer from "nodemailer";

const app = express();
const authConfig = { jwtSecret, tokenTtlSeconds };

app.use(cors());
app.use(express.json());

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ─── Email Setup ─────────────────────────────────────────
let transporter: nodemailer.Transporter | undefined;

async function setupEmail() {
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log("Ethereal Email ready for testing.");
  } catch (err: any) {
    transporter = undefined;
    console.warn(`Email preview setup unavailable: ${err.message || "unknown error"}`);
  }
}
setupEmail();

async function sendTestEmail(to: string, subject: string, text: string) {
  if (!transporter) return;
  const info = await transporter.sendMail({
    from: '"HealthyLife App" <no-reply@healthylife.com>',
    to,
    subject,
    text,
  });
  console.log(`\n📧 Email sent to ${to}: ${subject}`);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

// ─── Auth middleware ────────────────────────────────────
async function authUser(req: Request) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.replace("Bearer ", "").trim();
  const result = verifyToken(token, jwtSecret);
  if (!result.valid) return null;
  const user = await prisma.users.findUnique({ where: { id: result.payload.userId } });
  return user || null;
}

function requireAuth(handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      req.user = user;
      await handler(req, res, next);
    } catch (err: any) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || "Internal server error" });
    }
  };
}

function sanitizeUser(data: any) {
  return { id: data.userId || data.id, email: data.email, createdAt: data.createdAt || data.created_at };
}

// ─── Health ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ens492-month1-backend" });
});

// ─── Auth routes ────────────────────────────────────────
app.post("/auth/signup", async (req, res) => {
  try {
    const result = await svc.signup(req.body, authConfig);
    // Send verification email
    await sendTestEmail(
      result.email, 
      "Verify Your Email", 
      `Welcome to HealthyLifeHappyLife! Your verification code/token is: ${result.verificationToken}\n\nIn a real app, this would be a link to: http://localhost:8081/verify?token=${result.verificationToken}`
    );
    res.status(201).json({ 
      token: result.token, 
      user: sanitizeUser(result), 
      message: "Account created successfully." 
    });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const result = await svc.login(req.body, authConfig);
    res.json({ token: result.token, user: sanitizeUser(result) });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/verify", async (req, res) => {
  try {
    const result = await svc.verifyEmail(req.body.token);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const result = await svc.forgotPassword(req.body.email);
    if (result.resetToken) {
      await sendTestEmail(
        req.body.email,
        "Password Reset Request",
        `You requested a password reset. Your reset token is: ${result.resetToken}`
      );
    }
    res.json({ message: result.message });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  try {
    const result = await svc.resetPassword(req.body.token, req.body.newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/logout", requireAuth(async (_req, res) => {
  res.json({ message: "Logout successful on client side. Remove stored token." });
}));

app.get("/auth/me", requireAuth(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
}));

// ─── Profile routes ─────────────────────────────────────
app.get("/profile", requireAuth(async (req, res) => {
  const profile = await svc.getProfile(req.user.id);
  res.json({ profile });
}));

app.put("/profile", requireAuth(async (req, res) => {
  const profile = await svc.updateProfile(req.user.id, req.body);
  res.json({ profile });
}));

app.post("/profile/onboard", requireAuth(async (req, res) => {
  const profile = await svc.completeOnboarding(req.user.id, req.body);
  res.json({ profile });
}));

// ─── Meal routes ────────────────────────────────────────
app.post("/meals", requireAuth(async (req, res) => {
  const meal = await svc.addMeal(req.user.id, req.body);
  res.status(201).json({ meal });
}));

app.get("/meals", requireAuth(async (req, res) => {
  const meals = await svc.listMeals(req.user.id, req.query.date as string);
  res.json({ meals });
}));

// ─── Workout routes ─────────────────────────────────────
app.post("/workouts", requireAuth(async (req, res) => {
  const workout = await svc.addWorkout(req.user.id, req.body);
  res.status(201).json({ workout });
}));

app.get("/workouts", requireAuth(async (req, res) => {
  const workouts = await svc.listWorkouts(req.user.id, req.query.date as string);
  res.json({ workouts });
}));

// ─── Dashboard ──────────────────────────────────────────
app.get("/dashboard/summary", requireAuth(async (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const summary = await svc.getDashboardSummary(req.user.id, date);
  res.json({ summary });
}));

app.get("/recommendations/daily", requireAuth(async (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const recommendations = await svc.getDailyRecommendations(req.user.id, date);
  res.json({ recommendations });
}));

// ─── Reminders ──────────────────────────────────────────
app.get("/reminders/settings", requireAuth(async (req, res) => {
  const settings = await svc.getReminderSettings(req.user.id);
  res.json({ settings });
}));

app.put("/reminders/settings", requireAuth(async (req, res) => {
  const settings = await svc.updateReminderSettings(req.user.id, req.body);
  res.json({ settings });
}));

// ─── Food Catalog routes ────────────────────────────────
app.get("/foods/search", requireAuth(async (req, res) => {
  const foods = await svc.searchFoods(req.query.q as string, req.query.category as string);
  res.json({ foods });
}));

app.get("/foods/categories", requireAuth(async (req, res) => {
  const categories = await svc.getFoodCategories();
  res.json({ categories });
}));

app.post("/meals/from-catalog", requireAuth(async (req, res) => {
  const meal = await svc.addMealFromCatalog(req.user.id, req.body.foodId, req.body.servings);
  res.status(201).json({ meal });
}));

app.post("/foods/favorite", requireAuth(async (req, res) => {
  const result = await svc.toggleFavorite(req.user.id, req.body.foodId);
  res.json(result);
}));

app.get("/foods/favorites", requireAuth(async (req, res) => {
  const foods = await svc.listFavorites(req.user.id);
  res.json({ foods });
}));

// ─── Water routes ───────────────────────────────────────
app.post("/water", requireAuth(async (req, res) => {
  const log = await svc.addWater(req.user.id, req.body.amountMl);
  res.status(201).json({ log });
}));

app.get("/water", requireAuth(async (req, res) => {
  const water = await svc.getWaterToday(req.user.id, req.query.date as string);
  res.json({ water });
}));

// ─── Body Measurement routes ────────────────────────────
app.post("/measurements", requireAuth(async (req, res) => {
  const m = await svc.addMeasurement(req.user.id, req.body);
  res.status(201).json({ measurement: m });
}));

app.get("/measurements", requireAuth(async (req, res) => {
  const measurements = await svc.listMeasurements(req.user.id);
  res.json({ measurements });
}));

// ─── Workout Template routes ────────────────────────────
app.get("/workout-templates", requireAuth(async (req, res) => {
  const templates = await svc.listWorkoutTemplates(req.query.category as string);
  res.json({ templates });
}));

app.post("/workouts/from-template", requireAuth(async (req, res) => {
  const workout = await svc.logFromTemplate(req.user.id, req.body.templateId);
  res.status(201).json({ workout });
}));

// ─── Weekly & Streak routes ─────────────────────────────
app.get("/dashboard/weekly", requireAuth(async (req, res) => {
  const weekly = await svc.getWeeklySummary(req.user.id);
  res.json({ weekly });
}));

app.get("/dashboard/streak", requireAuth(async (req, res) => {
  const streak = await svc.getStreak(req.user.id);
  res.json(streak);
}));

// ─── Start ──────────────────────────────────────────────
const server = app.listen(port, () => {
  console.log(`ENS492 backend running on http://localhost:${port} with TypeScript & Prisma`);
});

server.on("error", (err) => {
  console.error("Backend server error:", err);
});
