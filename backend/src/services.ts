import { createSalt, createToken, hashPassword, verifyPassword } from "./auth";
import prisma from "./prisma";
import { isEmail, isNonEmptyString, isNonNegativeNumber, isPositiveNumber, normalizeDateOrNow, toDateKey } from "./validation";
import * as crypto from "node:crypto";

export function createAppError(message: string, status = 400) {
  const error = new Error(message) as any;
  error.status = status;
  return error;
}

// ─── Auth ───────────────────────────────────────────────
export async function signup(input: any, authConfig: any) {
  const { email, password, name } = input;
  if (!isEmail(email)) throw createAppError("Invalid email");
  if (!isNonEmptyString(password, 120) || password.length < 8)
    throw createAppError("Password must be at least 8 characters");
  if (!isNonEmptyString(name, 120)) throw createAppError("Invalid name");

  const existingUser = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) throw createAppError("Email already exists", 409);

  const salt = createSalt();
  const hash = hashPassword(password, salt);

  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.$transaction(async (tx: any) => {
    const newUser = await tx.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: hash,
        password_salt: salt,
        is_verified: true,
        verification_token: verificationToken
      }
    });
    await tx.profiles.create({
      data: { user_id: newUser.id, name: name.trim() }
    });
    return newUser;
  });

  const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
  return { token, userId: user.id, email: user.email, createdAt: user.created_at, verificationToken };
}

export async function login(input: any, authConfig: any) {
  const { email, password } = input;
  if (!isEmail(email) || !isNonEmptyString(password, 120))
    throw createAppError("Invalid credentials", 401);

  const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash))
    throw createAppError("Invalid credentials", 401);

  if (!user.is_verified) {
    throw createAppError("Email is not verified", 403);
  }

  const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
  return { token, userId: user.id, email: user.email, createdAt: user.created_at };
}

// Auth Security Endpoints
export async function verifyEmail(token: string) {
  const user = await prisma.users.findFirst({ where: { verification_token: token } });
  if (!user) throw createAppError("Invalid verification token", 400);

  await prisma.users.update({
    where: { id: user.id },
    data: { is_verified: true, verification_token: null }
  });
  return { verified: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return { message: "If an account exists, a reset email will be sent." }; // Generic message for security

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date();
  resetExpiry.setHours(resetExpiry.getHours() + 1);

  await prisma.users.update({
    where: { id: user.id },
    data: { reset_token: resetToken, reset_expiry: resetExpiry }
  });

  return { resetToken, message: "If an account exists, a reset email will be sent." };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!isNonEmptyString(newPassword, 120) || newPassword.length < 8)
    throw createAppError("Password must be at least 8 characters");

  const user = await prisma.users.findFirst({
    where: {
      reset_token: token,
      reset_expiry: { gte: new Date() }
    }
  });

  if (!user) throw createAppError("Invalid or expired reset token", 400);

  const salt = createSalt();
  const hash = hashPassword(newPassword, salt);

  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: hash, password_salt: salt, reset_token: null, reset_expiry: null }
  });

  return { success: true };
}

// Gamification Badges
export async function awardBadge(userId: number, badgeKey: string) {
  const existing = await prisma.user_badges.findUnique({
    where: { user_id_badge_key: { user_id: userId, badge_key: badgeKey } }
  });
  if (existing) return false;
  await prisma.user_badges.create({ data: { user_id: userId, badge_key: badgeKey } });
  return true;
}

// ─── Profile ────────────────────────────────────────────
export async function getProfile(userId: number) {
  const p = await prisma.profiles.findUnique({ where: { user_id: userId } });
  if (!p) throw createAppError("Profile not found", 404);
  const badges = await prisma.user_badges.findMany({ where: { user_id: userId } });
  
  return { 
    userId: p.user_id, name: p.name, goalCalories: p.goal_calories, 
    goalWorkoutsPerWeek: p.goal_workouts_per_week, updatedAt: p.updated_at,
    waterGoalMl: p.water_goal_ml, heightCm: Number(p.height_cm),
    onboardingCompleted: p.onboarding_completed,
    birthYear: p.birth_year, gender: p.gender, activityLevel: p.activity_level,
    badges: badges.map((b: any) => b.badge_key)
  };
}

export async function updateProfile(userId: number, input: any) {
  const profile = await getProfile(userId);
  const name = input.name !== undefined ? input.name : profile.name;
  const goalCalories = input.goalCalories !== undefined ? input.goalCalories : profile.goalCalories;
  const goalWorkoutsPerWeek = input.goalWorkoutsPerWeek !== undefined ? input.goalWorkoutsPerWeek : profile.goalWorkoutsPerWeek;

  if (!isNonEmptyString(name, 120)) throw createAppError("Invalid name");
  if (!isPositiveNumber(goalCalories)) throw createAppError("Invalid goalCalories");
  if (!isNonNegativeNumber(goalWorkoutsPerWeek)) throw createAppError("Invalid goalWorkoutsPerWeek");

  const p = await prisma.profiles.update({
    where: { user_id: userId },
    data: { name: name.trim(), goal_calories: goalCalories, goal_workouts_per_week: goalWorkoutsPerWeek, updated_at: new Date() }
  });

  return { 
    userId: p.user_id, name: p.name, goalCalories: p.goal_calories, 
    goalWorkoutsPerWeek: p.goal_workouts_per_week, updatedAt: p.updated_at,
    onboardingCompleted: p.onboarding_completed 
  };
}

export async function completeOnboarding(userId: number, input: any) {
  const { birthYear, gender, activityLevel, goal, weightKg, heightCm } = input;
  if (!birthYear || !gender || !activityLevel || !goal || !weightKg || !heightCm) {
    throw createAppError("Missing required onboarding fields");
  }

  const age = new Date().getFullYear() - birthYear;
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === "male") bmr += 5;
  else bmr -= 161;

  let multiplier = 1.2;
  if (activityLevel === "light") multiplier = 1.375;
  if (activityLevel === "moderate") multiplier = 1.55;
  if (activityLevel === "active") multiplier = 1.725;
  
  let tdee = Math.round(bmr * multiplier);
  let goalCal = tdee;
  if (goal === "lose") goalCal = tdee - 500;
  if (goal === "gain") goalCal = tdee + 500;
  if (goalCal < 1200) goalCal = 1200;

  const waterGoal = weightKg * 35; // 35ml per kg

  await prisma.body_measurements.create({
    data: { user_id: userId, weight_kg: weightKg, height_cm: heightCm }
  });

  await prisma.profiles.update({
    where: { user_id: userId },
    data: {
      onboarding_completed: true, birth_year: birthYear, gender, activity_level: activityLevel,
      height_cm: heightCm, goal_calories: goalCal, water_goal_ml: waterGoal, updated_at: new Date()
    }
  });

  await awardBadge(userId, "FIRST_STEPS");

  return getProfile(userId);
}

// ─── Meals ──────────────────────────────────────────────
export async function addMeal(userId: number, input: any) {
  const { name, calories, protein = 0, carbs = 0, fats = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) throw createAppError("Invalid meal name");
  if (!isPositiveNumber(calories)) throw createAppError("Invalid calories");
  if (![protein, carbs, fats].every(isNonNegativeNumber)) throw createAppError("Macros must be non-negative numbers");
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) throw createAppError("Invalid loggedAt value");

  const m = await prisma.meals.create({
    data: { user_id: userId, name: name.trim(), calories, protein, carbs, fats, logged_at: normalizedLoggedAt }
  });

  return { id: m.id, userId: m.user_id, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, loggedAt: m.logged_at };
}

export async function listMeals(userId: number, date?: string) {
  let where: any = { user_id: userId };
  if (date) {
    const d = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.logged_at = { gte: d, lt: end };
  }
  const res = await prisma.meals.findMany({ where, orderBy: { logged_at: 'desc' } });
  return res.map((m: any) => ({ id: m.id, userId: m.user_id, name: m.name, calories: m.calories, protein: m.protein, carbs: m.carbs, fats: m.fats, loggedAt: m.logged_at }));
}

// ─── Workouts ───────────────────────────────────────────
export async function addWorkout(userId: number, input: any) {
  const { name, durationMinutes, caloriesBurned = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) throw createAppError("Invalid workout name");
  if (!isPositiveNumber(durationMinutes)) throw createAppError("Invalid durationMinutes");
  if (!isNonNegativeNumber(caloriesBurned)) throw createAppError("Invalid caloriesBurned");
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) throw createAppError("Invalid loggedAt value");

  const w = await prisma.workouts.create({
    data: { user_id: userId, name: name.trim(), duration_minutes: durationMinutes, calories_burned: caloriesBurned, logged_at: normalizedLoggedAt }
  });
  return { id: w.id, userId: w.user_id, name: w.name, durationMinutes: w.duration_minutes, caloriesBurned: w.calories_burned, loggedAt: w.logged_at };
}

export async function listWorkouts(userId: number, date?: string) {
  let where: any = { user_id: userId };
  if (date) {
    const d = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.logged_at = { gte: d, lt: end };
  }
  const res = await prisma.workouts.findMany({ where, orderBy: { logged_at: 'desc' } });
  return res.map((w: any) => ({ id: w.id, userId: w.user_id, name: w.name, durationMinutes: w.duration_minutes, caloriesBurned: w.calories_burned, loggedAt: w.logged_at }));
}

// ─── Dashboard ──────────────────────────────────────────
export async function getDashboardSummary(userId: number, date?: string) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);
  const meals = await listMeals(userId, selectedDate);
  const workouts = await listWorkouts(userId, selectedDate);
  const profile = await getProfile(userId).catch(() => null);

  const totalCaloriesIn = meals.reduce((s: number, m: any) => s + m.calories, 0);
  const totalCaloriesOut = workouts.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
  const workoutMinutes = workouts.reduce((s: number, w: any) => s + w.durationMinutes, 0);
  const protein = meals.reduce((s: number, m: any) => s + (m.protein || 0), 0);
  const carbs = meals.reduce((s: number, m: any) => s + (m.carbs || 0), 0);
  const fats = meals.reduce((s: number, m: any) => s + (m.fats || 0), 0);

  return {
    date: selectedDate, totalCaloriesIn, totalCaloriesOut,
    netCalories: totalCaloriesIn - totalCaloriesOut,
    workoutMinutes, mealsCount: meals.length, workoutsCount: workouts.length,
    macros: { protein, carbs, fats },
    goals: profile ? { goalCalories: profile.goalCalories, goalWorkoutsPerWeek: profile.goalWorkoutsPerWeek } : null
  };
}

type RecommendationTip = {
  area: "nutrition" | "workout" | "recovery" | "consistency";
  title: string;
  message: string;
};

const recommendationDisclaimer =
  "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.";

function sanitizeTips(tips: RecommendationTip[]) {
  const blockedTerms = ["diagnose", "diagnosis", "medication", "prescribe", "cure", "disease"];
  return tips.filter((tip) => {
    const rendered = `${tip.title} ${tip.message}`.toLowerCase();
    return !blockedTerms.some((term) => rendered.includes(term));
  });
}

export function buildDailyRecommendations(summary: any) {
  const tips: RecommendationTip[] = [];
  const goalCalories = summary.goals?.goalCalories || 2000;
  const totalCaloriesIn = summary.totalCaloriesIn || 0;
  const workoutMinutes = summary.workoutMinutes || 0;
  const protein = summary.macros?.protein || 0;

  if (summary.mealsCount === 0 && summary.workoutsCount === 0) {
    tips.push({
      area: "consistency",
      title: "No activity logs yet today",
      message: "Start with one meal log or a short walk to build daily momentum."
    });
  }

  if (totalCaloriesIn < goalCalories * 0.35) {
    tips.push({
      area: "nutrition",
      title: "Calorie intake is far below goal",
      message: "Add a balanced meal with protein, complex carbs, and healthy fats."
    });
  } else if (totalCaloriesIn < goalCalories * 0.9) {
    tips.push({
      area: "nutrition",
      title: "Calorie intake is below goal",
      message: "Plan one more balanced meal or snack if you still feel hungry."
    });
  } else if (totalCaloriesIn > goalCalories * 1.25) {
    tips.push({
      area: "nutrition",
      title: "Calorie intake is far above goal",
      message: "Keep the next meal lighter and prioritize water, vegetables, and lean protein."
    });
  } else if (totalCaloriesIn > goalCalories * 1.05) {
    tips.push({
      area: "nutrition",
      title: "Calorie intake is above goal",
      message: "A lighter dinner or a walk can help balance the day."
    });
  }

  if (protein > 0 && protein < 50) {
    tips.push({
      area: "nutrition",
      title: "Protein intake appears low",
      message: "Aim to include 25-35g protein in your next meal."
    });
  } else if (protein >= 80) {
    tips.push({
      area: "nutrition",
      title: "Protein balance looks solid",
      message: "Keep distributing protein across meals for steady energy."
    });
  }

  if (summary.workoutsCount === 0) {
    tips.push({
      area: "workout",
      title: "No workout logged today",
      message: "A 20-30 minute walk or bodyweight session can keep your routine active."
    });
  } else if (workoutMinutes < 20) {
    tips.push({
      area: "workout",
      title: "Very short workout day",
      message: "If you have time, add a few mobility or core minutes."
    });
  } else if (workoutMinutes >= 90) {
    tips.push({
      area: "recovery",
      title: "Recovery should be prioritized",
      message: "Give yourself enough sleep, hydration, and a calmer next session."
    });
  } else {
    tips.push({
      area: "workout",
      title: "Workout volume is moderate",
      message: "Good consistency today. Keep the next session focused and manageable."
    });
  }

  return {
    date: summary.date,
    disclaimer: recommendationDisclaimer,
    tips: sanitizeTips(tips).slice(0, 4)
  };
}

export async function getDailyRecommendations(userId: number, date?: string) {
  await getProfile(userId);
  const summary = await getDashboardSummary(userId, date);
  return buildDailyRecommendations(summary);
}

// ─── Reminders ──────────────────────────────────────────
function formatReminderTime(value: any) {
  if (!value) return "20:00";
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  if (typeof value === "string") {
    return value.slice(0, 5);
  }
  return "20:00";
}

function parseReminderTime(value: any) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export async function getReminderSettings(userId: number) {
  let r = await prisma.reminders.findUnique({ where: { user_id: userId } });
  if (!r) {
    r = await prisma.reminders.create({ data: { user_id: userId } });
  }
  return { userId: r.user_id, enabled: r.enabled, reminderTime: formatReminderTime(r.reminder_time), frequency: r.frequency, updatedAt: r.updated_at };
}

export async function updateReminderSettings(userId: number, input: any) {
  await getReminderSettings(userId); // ensure exists
  const allowedFreqs = ["daily", "weekdays", "custom"];
  let data: any = { updated_at: new Date() };

  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.frequency !== undefined && allowedFreqs.includes(input.frequency)) data.frequency = input.frequency;
  if (input.reminderTime !== undefined) {
    const reminderTime = parseReminderTime(input.reminderTime);
    if (!reminderTime) throw createAppError("Invalid reminderTime");
    data.reminder_time = reminderTime;
  }

  const r = await prisma.reminders.update({ where: { user_id: userId }, data });
  return { userId: r.user_id, enabled: r.enabled, reminderTime: formatReminderTime(r.reminder_time), frequency: r.frequency, updatedAt: r.updated_at };
}

// ─── Food Catalog ───────────────────────────────────────
export async function searchFoods(query?: string, category?: string) {
  let where: any = {};
  if (query) where.name = { contains: query, mode: "insensitive" };
  if (category) where.category = category;
  const res = await prisma.food_catalog.findMany({ where, orderBy: { name: 'asc' }, take: 50 });
  return res.map((r: any) => ({ id: r.id, name: r.name, category: r.category, calories: r.calories, protein: Number(r.protein), carbs: Number(r.carbs), fats: Number(r.fats), servingSize: r.serving_size }));
}

export async function getFoodCategories() {
  const res = await prisma.food_catalog.findMany({ select: { category: true }, distinct: ['category'] });
  return res.map((r: any) => r.category);
}

export async function addMealFromCatalog(userId: number, foodId: number, servings?: number) {
  const s = servings || 1;
  const f = await prisma.food_catalog.findUnique({ where: { id: foodId } });
  if (!f) throw createAppError("Food not found", 404);
  const meal = await addMeal(userId, {
    name: f.name + (s !== 1 ? ` (x${s})` : ""),
    calories: Math.round(f.calories * s),
    protein: Math.round(Number(f.protein) * s),
    carbs: Math.round(Number(f.carbs) * s),
    fats: Math.round(Number(f.fats) * s),
  });
  return meal;
}

export async function toggleFavorite(userId: number, foodId: number) {
  const exists = await prisma.user_favorites.findUnique({ where: { user_id_food_id: { user_id: userId, food_id: foodId } } });
  if (exists) {
    await prisma.user_favorites.delete({ where: { user_id_food_id: { user_id: userId, food_id: foodId } } });
    return { favorited: false };
  }
  await prisma.user_favorites.create({ data: { user_id: userId, food_id: foodId } });
  return { favorited: true };
}

export async function listFavorites(userId: number) {
  const favs = await prisma.user_favorites.findMany({
    where: { user_id: userId },
    include: { food_catalog: true }
  });
  return favs.map((f: any) => f.food_catalog).map((r: any) => ({ id: r.id, name: r.name, category: r.category, calories: r.calories, protein: Number(r.protein), carbs: Number(r.carbs), fats: Number(r.fats), servingSize: r.serving_size }));
}

// ─── Water Tracking ─────────────────────────────────────
export async function addWater(userId: number, amountMl: number) {
  if (!isPositiveNumber(amountMl)) throw createAppError("Invalid amount");
  const res = await prisma.water_logs.create({ data: { user_id: userId, amount_ml: amountMl } });
  return { id: res.id, amountMl: res.amount_ml, loggedAt: res.logged_at };
}

export async function getWaterToday(userId: number, date?: string) {
  const d = date || new Date().toISOString().slice(0, 10);
  const startDate = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 1);

  const res = await prisma.water_logs.findMany({
    where: { user_id: userId, logged_at: { gte: startDate, lt: end } },
    orderBy: { logged_at: 'desc' }
  });
  
  const logs = res.map((r: any) => ({ id: r.id, amountMl: r.amount_ml, loggedAt: r.logged_at }));
  const total = logs.reduce((s: number, l: any) => s + l.amountMl, 0);
  
  const profile = await prisma.profiles.findUnique({ where: { user_id: userId } });
  const goal = profile?.water_goal_ml || 2500;
  
  return { date: d, totalMl: total, goalMl: goal, logs };
}

// ─── Body Measurements ──────────────────────────────────
export async function addMeasurement(userId: number, input: any) {
  const { weightKg, heightCm, note } = input;
  if (weightKg !== undefined && (!isPositiveNumber(weightKg) || weightKg > 500)) throw createAppError("Invalid weight");
  if (heightCm !== undefined && (!isPositiveNumber(heightCm) || heightCm > 300)) throw createAppError("Invalid height");
  
  if (heightCm) {
    await prisma.profiles.update({ where: { user_id: userId }, data: { height_cm: heightCm } });
  }
  
  const m = await prisma.body_measurements.create({
    data: { user_id: userId, weight_kg: weightKg, height_cm: heightCm, note }
  });
  
  const bmi = (weightKg && heightCm) ? Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1)) : null;
  return { id: m.id, weightKg: Number(m.weight_kg), heightCm: Number(m.height_cm), note: m.note, bmi, measuredAt: m.measured_at };
}

export async function listMeasurements(userId: number) {
  const res = await prisma.body_measurements.findMany({
    where: { user_id: userId },
    orderBy: { measured_at: 'desc' },
    take: 30
  });
  return res.map((m: any) => {
    const w = Number(m.weight_kg), h = Number(m.height_cm);
    const bmi = (w && h) ? Number((w / ((h / 100) ** 2)).toFixed(1)) : null;
    return { id: m.id, weightKg: w || null, heightCm: h || null, note: m.note, bmi, measuredAt: m.measured_at };
  });
}

// ─── Workout Templates ──────────────────────────────────
export async function listWorkoutTemplates(category?: string) {
  let where: any = {};
  if (category) where.category = category;
  const res = await prisma.workout_templates.findMany({ where, orderBy: { name: 'asc' } });
  return res.map((t: any) => ({
    id: t.id, name: t.name, category: t.category, description: t.description,
    exercises: t.exercises, estimatedDuration: t.estimated_duration, estimatedCalories: t.estimated_calories
  }));
}

export async function logFromTemplate(userId: number, templateId: number) {
  const t = await prisma.workout_templates.findUnique({ where: { id: templateId } });
  if (!t) throw createAppError("Template not found", 404);
  return addWorkout(userId, { name: t.name, durationMinutes: t.estimated_duration, caloriesBurned: t.estimated_calories });
}

// ─── Weekly Summary ─────────────────────────────────────
export async function getWeeklySummary(userId: number) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const result = [];
  for (const day of days) {
    const start = new Date(day);
    const end = new Date(day); end.setDate(end.getDate() + 1);
    
    const meals = await prisma.meals.findMany({ where: { user_id: userId, logged_at: { gte: start, lt: end } } });
    const workouts = await prisma.workouts.findMany({ where: { user_id: userId, logged_at: { gte: start, lt: end } } });
    const water = await prisma.water_logs.findMany({ where: { user_id: userId, logged_at: { gte: start, lt: end } } });
    
    const calIn = meals.reduce((s: number, m: any) => s + m.calories, 0);
    const calOut = workouts.reduce((s: number, w: any) => s + (w.calories_burned || 0), 0);
    const mins = workouts.reduce((s: number, w: any) => s + w.duration_minutes, 0);
    const wtr = water.reduce((s: number, w: any) => s + w.amount_ml, 0);

    result.push({
      date: day, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(day).getDay()],
      caloriesIn: calIn, caloriesOut: calOut,
      workoutMinutes: mins, waterMl: wtr
    });
  }
  return result;
}

export async function getStreak(userId: number) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const day = d.toISOString().slice(0, 10);
    const start = new Date(day);
    const end = new Date(day); end.setDate(end.getDate() + 1);
    
    const m = await prisma.meals.findFirst({ where: { user_id: userId, logged_at: { gte: start, lt: end } } });
    const w = await prisma.workouts.findFirst({ where: { user_id: userId, logged_at: { gte: start, lt: end } } });
    
    if (!m && !w) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  
  if (streak >= 7) {
    await awardBadge(userId, "WEEKLY_STREAK");
  }
  
  return { streak };
}
