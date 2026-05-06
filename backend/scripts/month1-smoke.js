const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadDb, saveDb } = require("../src/db");
const {
  signup,
  login,
  getProfile,
  updateProfile,
  addMeal,
  addWorkout,
  getDashboardSummary
} = require("../src/services");

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "smoke-secret",
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS || 3600)
};

const dbPath = path.join(__dirname, "..", "data", "db.json");
const resetDb = {
  users: [],
  profiles: [],
  meals: [],
  workouts: [],
  counters: { user: 1, meal: 1, workout: 1 }
};

function run() {
  fs.writeFileSync(dbPath, JSON.stringify(resetDb, null, 2), "utf8");
  const db = loadDb();

  const created = signup(
    db,
    { email: "mvp@example.com", password: "StrongPass123", name: "MVP User" },
    authConfig
  );
  assert.ok(created.token);

  const signedIn = login(db, { email: "mvp@example.com", password: "StrongPass123" }, authConfig);
  assert.ok(signedIn.token);

  const profileBefore = getProfile(db, created.userId);
  assert.equal(profileBefore.goalCalories, 2000);

  const profileAfter = updateProfile(db, created.userId, {
    name: "Updated MVP",
    goalCalories: 2200,
    goalWorkoutsPerWeek: 4
  });
  assert.equal(profileAfter.goalCalories, 2200);
  assert.equal(profileAfter.goalWorkoutsPerWeek, 4);

  const meal = addMeal(db, created.userId, {
    name: "Chicken Bowl",
    calories: 650,
    protein: 45,
    carbs: 50,
    fats: 20
  });
  assert.equal(meal.calories, 650);

  const workout = addWorkout(db, created.userId, {
    name: "Push Day",
    durationMinutes: 60,
    caloriesBurned: 350
  });
  assert.equal(workout.durationMinutes, 60);

  const today = new Date().toISOString().slice(0, 10);
  const summary = getDashboardSummary(db, created.userId, today);
  assert.equal(summary.mealsCount, 1);
  assert.equal(summary.workoutsCount, 1);
  assert.equal(summary.totalCaloriesIn, 650);
  assert.equal(summary.totalCaloriesOut, 350);
  assert.equal(summary.netCalories, 300);

  saveDb(db);
  console.log("Month 1 service-level smoke check passed.");
}

run();

