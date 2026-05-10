const express = require("express");
const cors = require("cors");
const { port, jwtSecret, tokenTtlSeconds } = require("./config");
const { verifyToken } = require("./auth");
const db = require("./db");
const svc = require("./services");

const app = express();
const authConfig = { jwtSecret, tokenTtlSeconds };

app.use(cors());
app.use(express.json());

// ─── Auth middleware ────────────────────────────────────
async function authUser(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.replace("Bearer ", "").trim();
  const result = verifyToken(token, jwtSecret);
  if (!result.valid) return null;
  const res = await db.query("SELECT id, email, created_at FROM users WHERE id = $1", [result.payload.userId]);
  return res.rows[0] || null;
}

function requireAuth(handler) {
  return async (req, res, next) => {
    try {
      const user = await authUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      req.user = user;
      await handler(req, res, next);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || "Internal server error" });
    }
  };
}

function sanitizeUser(data) {
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
    res.status(201).json({ token: result.token, user: sanitizeUser(result) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const result = await svc.login(req.body, authConfig);
    res.json({ token: result.token, user: sanitizeUser(result) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post("/auth/logout", requireAuth(async (_req, res) => {
  res.json({ message: "Logout successful on client side. Remove stored token." });
}));

app.get("/auth/me", requireAuth(async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, createdAt: req.user.created_at } });
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
  const meals = await svc.listMeals(req.user.id, req.query.date);
  res.json({ meals });
}));

// ─── Workout routes ─────────────────────────────────────
app.post("/workouts", requireAuth(async (req, res) => {
  const workout = await svc.addWorkout(req.user.id, req.body);
  res.status(201).json({ workout });
}));

app.get("/workouts", requireAuth(async (req, res) => {
  const workouts = await svc.listWorkouts(req.user.id, req.query.date);
  res.json({ workouts });
}));

// ─── Dashboard ──────────────────────────────────────────
app.get("/dashboard/summary", requireAuth(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const summary = await svc.getDashboardSummary(req.user.id, date);
  res.json({ summary });
}));

// ─── Recommendations ────────────────────────────────────
app.get("/recommendations/daily", requireAuth(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
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

// ─── Social routes ──────────────────────────────────────
app.post("/social/follow", requireAuth(async (req, res) => {
  const result = await svc.followUser(req.user.id, req.body.targetUserId);
  res.json(result);
}));

app.post("/social/unfollow", requireAuth(async (req, res) => {
  const result = await svc.unfollowUser(req.user.id, req.body.targetUserId);
  res.json(result);
}));

app.get("/social/following", requireAuth(async (req, res) => {
  const users = await svc.listFollowing(req.user.id);
  res.json({ users });
}));

app.get("/social/followers", requireAuth(async (req, res) => {
  const users = await svc.listFollowers(req.user.id);
  res.json({ users });
}));

// ─── Food Catalog routes ────────────────────────────────
app.get("/foods/search", requireAuth(async (req, res) => {
  const foods = await svc.searchFoods(req.query.q, req.query.category);
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
  const water = await svc.getWaterToday(req.user.id, req.query.date);
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
  const templates = await svc.listWorkoutTemplates(req.query.category);
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
app.listen(port, () => {
  console.log(`ENS492 backend running on http://localhost:${port}`);
});

