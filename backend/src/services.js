const { createSalt, createToken, hashPassword, verifyPassword } = require("./auth");
const db = require("./db");
const {
  isEmail, isNonEmptyString, isNonNegativeNumber, isPositiveNumber,
  normalizeDateOrNow, toDateKey
} = require("./validation");

function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// ─── Auth ───────────────────────────────────────────────
async function signup(input, authConfig) {
  const { email, password, name } = input;
  if (!isEmail(email)) throw createAppError("Invalid email");
  if (!isNonEmptyString(password, 120) || password.length < 8)
    throw createAppError("Password must be at least 8 characters");
  if (!isNonEmptyString(name, 120)) throw createAppError("Invalid name");

  const exists = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  if (exists.rows.length > 0) throw createAppError("Email already exists", 409);

  const salt = createSalt();
  const hash = hashPassword(password, salt);

  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const userRes = await client.query(
      "INSERT INTO users (email, password_hash, password_salt) VALUES (LOWER($1), $2, $3) RETURNING id, email, created_at",
      [email, hash, salt]
    );
    const user = userRes.rows[0];
    await client.query(
      "INSERT INTO profiles (user_id, name) VALUES ($1, $2)",
      [user.id, name.trim()]
    );
    await client.query("COMMIT");
    const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
    return { token, userId: user.id, email: user.email, createdAt: user.created_at };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function login(input, authConfig) {
  const { email, password } = input;
  if (!isEmail(email) || !isNonEmptyString(password, 120))
    throw createAppError("Invalid credentials", 401);

  const res = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  const user = res.rows[0];
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash))
    throw createAppError("Invalid credentials", 401);

  const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
  return { token, userId: user.id, email: user.email, createdAt: user.created_at };
}

// ─── Profile ────────────────────────────────────────────
async function getProfile(userId) {
  const res = await db.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  if (res.rows.length === 0) throw createAppError("Profile not found", 404);
  const p = res.rows[0];
  return { userId: p.user_id, name: p.name, goalCalories: p.goal_calories, goalWorkoutsPerWeek: p.goal_workouts_per_week, updatedAt: p.updated_at };
}

async function updateProfile(userId, input) {
  const profile = await getProfile(userId);
  const name = input.name !== undefined ? input.name : profile.name;
  const goalCalories = input.goalCalories !== undefined ? input.goalCalories : profile.goalCalories;
  const goalWorkoutsPerWeek = input.goalWorkoutsPerWeek !== undefined ? input.goalWorkoutsPerWeek : profile.goalWorkoutsPerWeek;

  if (!isNonEmptyString(name, 120)) throw createAppError("Invalid name");
  if (!isPositiveNumber(goalCalories)) throw createAppError("Invalid goalCalories");
  if (!isNonNegativeNumber(goalWorkoutsPerWeek)) throw createAppError("Invalid goalWorkoutsPerWeek");

  const res = await db.query(
    "UPDATE profiles SET name=$1, goal_calories=$2, goal_workouts_per_week=$3, updated_at=NOW() WHERE user_id=$4 RETURNING *",
    [name.trim(), goalCalories, goalWorkoutsPerWeek, userId]
  );
  const p = res.rows[0];
  return { userId: p.user_id, name: p.name, goalCalories: p.goal_calories, goalWorkoutsPerWeek: p.goal_workouts_per_week, updatedAt: p.updated_at };
}

// ─── Meals ──────────────────────────────────────────────
async function addMeal(userId, input) {
  const { name, calories, protein = 0, carbs = 0, fats = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) throw createAppError("Invalid meal name");
  if (!isPositiveNumber(calories)) throw createAppError("Invalid calories");
  if (![protein, carbs, fats].every(isNonNegativeNumber)) throw createAppError("Macros must be non-negative numbers");
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) throw createAppError("Invalid loggedAt value");

  const res = await db.query(
    "INSERT INTO meals (user_id, name, calories, protein, carbs, fats, logged_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [userId, name.trim(), calories, protein, carbs, fats, normalizedLoggedAt]
  );
  const m = res.rows[0];
  return { id: m.id, userId: m.user_id, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, loggedAt: m.logged_at };
}

async function listMeals(userId, date) {
  let res;
  if (date) {
    res = await db.query(
      "SELECT * FROM meals WHERE user_id=$1 AND logged_at::date = $2::date ORDER BY logged_at DESC",
      [userId, date]
    );
  } else {
    res = await db.query("SELECT * FROM meals WHERE user_id=$1 ORDER BY logged_at DESC", [userId]);
  }
  return res.rows.map(m => ({ id: m.id, userId: m.user_id, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, loggedAt: m.logged_at }));
}

// ─── Workouts ───────────────────────────────────────────
async function addWorkout(userId, input) {
  const { name, durationMinutes, caloriesBurned = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) throw createAppError("Invalid workout name");
  if (!isPositiveNumber(durationMinutes)) throw createAppError("Invalid durationMinutes");
  if (!isNonNegativeNumber(caloriesBurned)) throw createAppError("Invalid caloriesBurned");
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) throw createAppError("Invalid loggedAt value");

  const res = await db.query(
    "INSERT INTO workouts (user_id, name, duration_minutes, calories_burned, logged_at) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [userId, name.trim(), durationMinutes, caloriesBurned, normalizedLoggedAt]
  );
  const w = res.rows[0];
  return { id: w.id, userId: w.user_id, name: w.name, durationMinutes: w.duration_minutes, caloriesBurned: w.calories_burned, loggedAt: w.logged_at };
}

async function listWorkouts(userId, date) {
  let res;
  if (date) {
    res = await db.query(
      "SELECT * FROM workouts WHERE user_id=$1 AND logged_at::date = $2::date ORDER BY logged_at DESC",
      [userId, date]
    );
  } else {
    res = await db.query("SELECT * FROM workouts WHERE user_id=$1 ORDER BY logged_at DESC", [userId]);
  }
  return res.rows.map(w => ({ id: w.id, userId: w.user_id, name: w.name, durationMinutes: w.duration_minutes, caloriesBurned: w.calories_burned, loggedAt: w.logged_at }));
}

// ─── Dashboard ──────────────────────────────────────────
async function getDashboardSummary(userId, date) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);
  const meals = await listMeals(userId, selectedDate);
  const workouts = await listWorkouts(userId, selectedDate);
  const profile = await getProfile(userId).catch(() => null);

  const totalCaloriesIn = meals.reduce((s, m) => s + m.calories, 0);
  const totalCaloriesOut = workouts.reduce((s, w) => s + w.caloriesBurned, 0);
  const workoutMinutes = workouts.reduce((s, w) => s + w.durationMinutes, 0);
  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const carbs = meals.reduce((s, m) => s + m.carbs, 0);
  const fats = meals.reduce((s, m) => s + m.fats, 0);

  return {
    date: selectedDate, totalCaloriesIn, totalCaloriesOut,
    netCalories: totalCaloriesIn - totalCaloriesOut,
    workoutMinutes, mealsCount: meals.length, workoutsCount: workouts.length,
    macros: { protein, carbs, fats },
    goals: profile ? { goalCalories: profile.goalCalories, goalWorkoutsPerWeek: profile.goalWorkoutsPerWeek } : null
  };
}

// ─── Reminders ──────────────────────────────────────────
async function getReminderSettings(userId) {
  let res = await db.query("SELECT * FROM reminders WHERE user_id = $1", [userId]);
  if (res.rows.length === 0) {
    await db.query("INSERT INTO reminders (user_id) VALUES ($1)", [userId]);
    res = await db.query("SELECT * FROM reminders WHERE user_id = $1", [userId]);
  }
  const r = res.rows[0];
  return { userId: r.user_id, enabled: r.enabled, reminderTime: r.reminder_time, frequency: r.frequency, updatedAt: r.updated_at };
}

async function updateReminderSettings(userId, input) {
  await getReminderSettings(userId); // ensure exists
  const allowedFreqs = ["daily", "weekdays", "custom"];
  const sets = []; const vals = []; let idx = 1;

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") throw createAppError("Invalid enabled value");
    sets.push(`enabled=$${idx++}`); vals.push(input.enabled);
  }
  if (input.reminderTime !== undefined) {
    if (typeof input.reminderTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime))
      throw createAppError("Invalid reminderTime. Expected HH:MM");
    sets.push(`reminder_time=$${idx++}`); vals.push(input.reminderTime);
  }
  if (input.frequency !== undefined) {
    if (!allowedFreqs.includes(input.frequency)) throw createAppError("Invalid frequency");
    sets.push(`frequency=$${idx++}`); vals.push(input.frequency);
  }
  sets.push(`updated_at=NOW()`);
  vals.push(userId);

  const res = await db.query(`UPDATE reminders SET ${sets.join(",")} WHERE user_id=$${idx} RETURNING *`, vals);
  const r = res.rows[0];
  return { userId: r.user_id, enabled: r.enabled, reminderTime: r.reminder_time, frequency: r.frequency, updatedAt: r.updated_at };
}

// ─── Recommendations ────────────────────────────────────
const NON_MEDICAL_DISCLAIMER = "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.";
const SAFETY_BLOCKLIST = [/\bdiagnos(e|is|ed|ing)\b/i, /\btreat(ment|ed|ing)?\b/i, /\bcure(d|s|ing)?\b/i, /\bprescrib(e|ed|ing)?\b/i, /\bmedication(s)?\b/i, /\bdisease(s)?\b/i];

function containsBlockedMedicalTerms(text) { return SAFETY_BLOCKLIST.some(p => p.test(text)); }

function createSafeTip(area, title, message, fbTitle, fbMsg) {
  const allowed = new Set(["nutrition", "workout", "recovery", "consistency"]);
  const safeArea = allowed.has(area) ? area : "consistency";
  const t = typeof title === "string" ? title.trim() : "";
  const m = typeof message === "string" ? message.trim() : "";
  if (!t || !m || containsBlockedMedicalTerms(t) || containsBlockedMedicalTerms(m))
    return { area: safeArea, title: fbTitle, message: fbMsg };
  return { area: safeArea, title: t, message: m };
}

async function getDailyRecommendations(userId, date) {
  const userRes = await db.query("SELECT id FROM users WHERE id=$1", [userId]);
  if (userRes.rows.length === 0) throw createAppError("User not found", 404);

  const summary = await getDashboardSummary(userId, date);
  const candidates = [];

  if (summary.mealsCount === 0 && summary.workoutsCount === 0)
    candidates.push({ priority: 100, tip: { area: "consistency", title: "No activity logs yet today", message: "Start with one meal log or a short walk to build daily momentum." } });

  if (summary.goals) {
    const gap = summary.goals.goalCalories - summary.totalCaloriesIn;
    if (gap >= 700) candidates.push({ priority: 90, tip: { area: "nutrition", title: "Calorie intake is far below goal", message: "Add a balanced meal with protein, complex carbs, and healthy fats." } });
    else if (gap >= 300) candidates.push({ priority: 80, tip: { area: "nutrition", title: "Calorie intake is below goal", message: "Add a light snack with protein and complex carbs to close the gap." } });
    else if (gap <= -600) candidates.push({ priority: 85, tip: { area: "nutrition", title: "Calorie intake is far above goal", message: "Choose lighter, high-protein meals for the rest of the day." } });
    else if (gap <= -250) candidates.push({ priority: 75, tip: { area: "nutrition", title: "Calorie intake is above goal", message: "Use smaller portions in your next meal and hydrate before eating." } });
    else candidates.push({ priority: 50, tip: { area: "nutrition", title: "Calorie target is on track", message: "Keep meal timing and hydration consistent through the day." } });
  }

  if (summary.mealsCount > 0) {
    const target = Math.max(60, Math.round((summary.goals ? summary.goals.goalCalories : 2000) * 0.035));
    const pGap = target - summary.macros.protein;
    if (pGap > 35) candidates.push({ priority: 92, tip: { area: "nutrition", title: "Protein intake appears low", message: "Aim to include 25-35g protein in your next meal." } });
    else if (pGap > 15) candidates.push({ priority: 70, tip: { area: "nutrition", title: "Protein could be improved", message: "Add a moderate lean-protein source such as yogurt, eggs, or legumes." } });
    else candidates.push({ priority: 40, tip: { area: "nutrition", title: "Protein balance looks solid", message: "Maintain similar protein distribution across meals." } });
  }

  if (summary.workoutMinutes === 0) candidates.push({ priority: 88, tip: { area: "workout", title: "No workout logged today", message: "A 20-30 minute walk or bodyweight session can keep your routine active." } });
  else if (summary.workoutMinutes < 20) candidates.push({ priority: 78, tip: { area: "workout", title: "Very short workout day", message: "If possible, add 10-15 minutes of mobility, cardio, or core work." } });
  else if (summary.workoutMinutes < 45) candidates.push({ priority: 62, tip: { area: "workout", title: "Workout volume is moderate", message: "This is a good maintenance day; continue with steady consistency." } });
  else candidates.push({ priority: 60, tip: { area: "workout", title: "Strong activity level today", message: "Prioritize hydration and sleep to support tomorrow's recovery." } });

  if (summary.workoutsCount >= 2 || summary.workoutMinutes >= 90)
    candidates.push({ priority: 55, tip: { area: "recovery", title: "Recovery should be prioritized", message: "Include light stretching and a consistent bedtime to reduce next-day fatigue." } });

  const tips = candidates.sort((a, b) => b.priority - a.priority).slice(0, 4).map(c =>
    createSafeTip(c.tip.area, c.tip.title, c.tip.message, "Keep building consistency", "Small, repeatable healthy actions usually work better than extreme changes.")
  );

  return { date: summary.date, disclaimer: NON_MEDICAL_DISCLAIMER, tips };
}

// ─── Social ─────────────────────────────────────────────
async function followUser(userId, targetUserId) {
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) throw createAppError("Invalid targetUserId");
  if (targetUserId === userId) throw createAppError("You cannot follow yourself");

  const target = await db.query("SELECT id FROM users WHERE id=$1", [targetUserId]);
  if (target.rows.length === 0) throw createAppError("Target user not found", 404);

  await db.query(
    "INSERT INTO follows (follower_user_id, following_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [userId, targetUserId]
  );
  return { followed: true };
}

async function unfollowUser(userId, targetUserId) {
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) throw createAppError("Invalid targetUserId");
  await db.query("DELETE FROM follows WHERE follower_user_id=$1 AND following_user_id=$2", [userId, targetUserId]);
  return { followed: false };
}

async function listFollowing(userId) {
  const res = await db.query(
    `SELECT u.id as "userId", u.email, p.name FROM follows f
     JOIN users u ON u.id = f.following_user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE f.follower_user_id = $1`, [userId]
  );
  return res.rows.map(r => ({ userId: r.userId, email: r.email, name: r.name || "User" }));
}

async function listFollowers(userId) {
  const res = await db.query(
    `SELECT u.id as "userId", u.email, p.name FROM follows f
     JOIN users u ON u.id = f.follower_user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE f.following_user_id = $1`, [userId]
  );
  return res.rows.map(r => ({ userId: r.userId, email: r.email, name: r.name || "User" }));
}

// ─── Food Catalog ───────────────────────────────────────
async function searchFoods(query, category) {
  let sql = "SELECT * FROM food_catalog WHERE 1=1";
  const params = [];
  if (query && query.trim()) {
    params.push(`%${query.trim().toLowerCase()}%`);
    sql += ` AND LOWER(name) LIKE $${params.length}`;
  }
  if (category && category.trim()) {
    params.push(category.trim());
    sql += ` AND category = $${params.length}`;
  }
  sql += " ORDER BY name LIMIT 50";
  const res = await db.query(sql, params);
  return res.rows.map(r => ({ id: r.id, name: r.name, category: r.category, calories: r.calories, protein: Number(r.protein), carbs: Number(r.carbs), fats: Number(r.fats), servingSize: r.serving_size }));
}

async function getFoodCategories() {
  const res = await db.query("SELECT DISTINCT category FROM food_catalog ORDER BY category");
  return res.rows.map(r => r.category);
}

async function addMealFromCatalog(userId, foodId, servings) {
  const s = servings || 1;
  const food = await db.query("SELECT * FROM food_catalog WHERE id=$1", [foodId]);
  if (food.rows.length === 0) throw createAppError("Food not found", 404);
  const f = food.rows[0];
  const meal = await addMeal(userId, {
    name: f.name + (s !== 1 ? ` (x${s})` : ""),
    calories: Math.round(f.calories * s),
    protein: Math.round(Number(f.protein) * s),
    carbs: Math.round(Number(f.carbs) * s),
    fats: Math.round(Number(f.fats) * s),
  });
  return meal;
}

async function toggleFavorite(userId, foodId) {
  const exists = await db.query("SELECT 1 FROM user_favorites WHERE user_id=$1 AND food_id=$2", [userId, foodId]);
  if (exists.rows.length > 0) {
    await db.query("DELETE FROM user_favorites WHERE user_id=$1 AND food_id=$2", [userId, foodId]);
    return { favorited: false };
  }
  await db.query("INSERT INTO user_favorites (user_id, food_id) VALUES ($1,$2)", [userId, foodId]);
  return { favorited: true };
}

async function listFavorites(userId) {
  const res = await db.query(
    `SELECT fc.* FROM user_favorites uf JOIN food_catalog fc ON fc.id = uf.food_id WHERE uf.user_id=$1 ORDER BY fc.name`, [userId]
  );
  return res.rows.map(r => ({ id: r.id, name: r.name, category: r.category, calories: r.calories, protein: Number(r.protein), carbs: Number(r.carbs), fats: Number(r.fats), servingSize: r.serving_size }));
}

// ─── Water Tracking ─────────────────────────────────────
async function addWater(userId, amountMl) {
  if (!isPositiveNumber(amountMl)) throw createAppError("Invalid amount");
  const res = await db.query("INSERT INTO water_logs (user_id, amount_ml) VALUES ($1,$2) RETURNING *", [userId, amountMl]);
  return { id: res.rows[0].id, amountMl: res.rows[0].amount_ml, loggedAt: res.rows[0].logged_at };
}

async function getWaterToday(userId, date) {
  const d = date || new Date().toISOString().slice(0, 10);
  const res = await db.query("SELECT * FROM water_logs WHERE user_id=$1 AND logged_at::date=$2::date ORDER BY logged_at DESC", [userId, d]);
  const logs = res.rows.map(r => ({ id: r.id, amountMl: r.amount_ml, loggedAt: r.logged_at }));
  const total = logs.reduce((s, l) => s + l.amountMl, 0);
  const profile = await db.query("SELECT water_goal_ml FROM profiles WHERE user_id=$1", [userId]);
  const goal = profile.rows[0]?.water_goal_ml || 2500;
  return { date: d, totalMl: total, goalMl: goal, logs };
}

// ─── Body Measurements ──────────────────────────────────
async function addMeasurement(userId, input) {
  const { weightKg, heightCm, note } = input;
  if (weightKg !== undefined && (!isPositiveNumber(weightKg) || weightKg > 500)) throw createAppError("Invalid weight");
  if (heightCm !== undefined && (!isPositiveNumber(heightCm) || heightCm > 300)) throw createAppError("Invalid height");
  if (heightCm) await db.query("UPDATE profiles SET height_cm=$1 WHERE user_id=$2", [heightCm, userId]);
  const res = await db.query(
    "INSERT INTO body_measurements (user_id, weight_kg, height_cm, note) VALUES ($1,$2,$3,$4) RETURNING *",
    [userId, weightKg || null, heightCm || null, note || null]
  );
  const m = res.rows[0];
  const bmi = (weightKg && heightCm) ? Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1)) : null;
  return { id: m.id, weightKg: Number(m.weight_kg), heightCm: Number(m.height_cm), note: m.note, bmi, measuredAt: m.measured_at };
}

async function listMeasurements(userId) {
  const res = await db.query("SELECT * FROM body_measurements WHERE user_id=$1 ORDER BY measured_at DESC LIMIT 30", [userId]);
  return res.rows.map(m => {
    const w = Number(m.weight_kg), h = Number(m.height_cm);
    const bmi = (w && h) ? Number((w / ((h / 100) ** 2)).toFixed(1)) : null;
    return { id: m.id, weightKg: w || null, heightCm: h || null, note: m.note, bmi, measuredAt: m.measured_at };
  });
}

// ─── Workout Templates ──────────────────────────────────
async function listWorkoutTemplates(category) {
  let sql = "SELECT * FROM workout_templates";
  const params = [];
  if (category) { params.push(category); sql += " WHERE category=$1"; }
  sql += " ORDER BY name";
  const res = await db.query(sql, params);
  return res.rows.map(t => ({
    id: t.id, name: t.name, category: t.category, description: t.description,
    exercises: t.exercises, estimatedDuration: t.estimated_duration, estimatedCalories: t.estimated_calories
  }));
}

async function logFromTemplate(userId, templateId) {
  const tRes = await db.query("SELECT * FROM workout_templates WHERE id=$1", [templateId]);
  if (tRes.rows.length === 0) throw createAppError("Template not found", 404);
  const t = tRes.rows[0];
  return addWorkout(userId, { name: t.name, durationMinutes: t.estimated_duration, caloriesBurned: t.estimated_calories });
}

// ─── Weekly Summary ─────────────────────────────────────
async function getWeeklySummary(userId) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const result = [];
  for (const day of days) {
    const mRes = await db.query("SELECT COALESCE(SUM(calories),0) as cal_in FROM meals WHERE user_id=$1 AND logged_at::date=$2::date", [userId, day]);
    const wRes = await db.query("SELECT COALESCE(SUM(calories_burned),0) as cal_out, COALESCE(SUM(duration_minutes),0) as mins FROM workouts WHERE user_id=$1 AND logged_at::date=$2::date", [userId, day]);
    const waterRes = await db.query("SELECT COALESCE(SUM(amount_ml),0) as water FROM water_logs WHERE user_id=$1 AND logged_at::date=$2::date", [userId, day]);
    result.push({
      date: day, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(day).getDay()],
      caloriesIn: Number(mRes.rows[0].cal_in), caloriesOut: Number(wRes.rows[0].cal_out),
      workoutMinutes: Number(wRes.rows[0].mins), waterMl: Number(waterRes.rows[0].water)
    });
  }
  return result;
}

async function getStreak(userId) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const day = d.toISOString().slice(0, 10);
    const res = await db.query(
      "SELECT 1 FROM meals WHERE user_id=$1 AND logged_at::date=$2::date UNION SELECT 1 FROM workouts WHERE user_id=$1 AND logged_at::date=$2::date LIMIT 1",
      [userId, day]
    );
    if (res.rows.length === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return { streak };
}

module.exports = {
  signup, login, getProfile, updateProfile,
  addMeal, listMeals, addWorkout, listWorkouts,
  getDashboardSummary, getReminderSettings, updateReminderSettings,
  getDailyRecommendations, followUser, unfollowUser, listFollowing, listFollowers,
  searchFoods, getFoodCategories, addMealFromCatalog, toggleFavorite, listFavorites,
  addWater, getWaterToday,
  addMeasurement, listMeasurements,
  listWorkoutTemplates, logFromTemplate,
  getWeeklySummary, getStreak
};
