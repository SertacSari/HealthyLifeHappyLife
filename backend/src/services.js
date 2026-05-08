const { createSalt, createToken, hashPassword, verifyPassword } = require("./auth");
const { nextId } = require("./db");
const {
  isEmail,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  normalizeDateOrNow,
  toDateKey
} = require("./validation");

function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function isValidTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function signup(db, input, authConfig) {
  const { email, password, name } = input;
  if (!isEmail(email)) {
    throw createAppError("Invalid email", 400);
  }
  if (!isNonEmptyString(password, 120) || password.length < 8) {
    throw createAppError("Password must be at least 8 characters", 400);
  }
  if (!isNonEmptyString(name, 120)) {
    throw createAppError("Invalid name", 400);
  }
  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw createAppError("Email already exists", 409);
  }

  const salt = createSalt();
  const user = {
    id: nextId(db, "user"),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  db.profiles.push({
    userId: user.id,
    name: name.trim(),
    goalCalories: 2000,
    goalWorkoutsPerWeek: 3,
    updatedAt: new Date().toISOString()
  });
  const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
  return { token, userId: user.id, email: user.email, createdAt: user.createdAt };
}

function login(db, input, authConfig) {
  const { email, password } = input;
  if (!isEmail(email) || !isNonEmptyString(password, 120)) {
    throw createAppError("Invalid credentials", 401);
  }
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw createAppError("Invalid credentials", 401);
  }
  const token = createToken({ userId: user.id }, authConfig.jwtSecret, authConfig.tokenTtlSeconds);
  return { token, userId: user.id, email: user.email, createdAt: user.createdAt };
}

function getProfile(db, userId) {
  const profile = db.profiles.find((p) => p.userId === userId);
  if (!profile) {
    throw createAppError("Profile not found", 404);
  }
  return profile;
}

function updateProfile(db, userId, input) {
  const profile = getProfile(db, userId);
  if (input.name !== undefined) {
    if (!isNonEmptyString(input.name, 120)) {
      throw createAppError("Invalid name", 400);
    }
    profile.name = input.name.trim();
  }
  if (input.goalCalories !== undefined) {
    if (!isPositiveNumber(input.goalCalories)) {
      throw createAppError("Invalid goalCalories", 400);
    }
    profile.goalCalories = input.goalCalories;
  }
  if (input.goalWorkoutsPerWeek !== undefined) {
    if (!isNonNegativeNumber(input.goalWorkoutsPerWeek)) {
      throw createAppError("Invalid goalWorkoutsPerWeek", 400);
    }
    profile.goalWorkoutsPerWeek = input.goalWorkoutsPerWeek;
  }
  profile.updatedAt = new Date().toISOString();
  return profile;
}

function addMeal(db, userId, input) {
  const { name, calories, protein = 0, carbs = 0, fats = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) {
    throw createAppError("Invalid meal name", 400);
  }
  if (!isPositiveNumber(calories)) {
    throw createAppError("Invalid calories", 400);
  }
  if (![protein, carbs, fats].every(isNonNegativeNumber)) {
    throw createAppError("Macros must be non-negative numbers", 400);
  }
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) {
    throw createAppError("Invalid loggedAt value", 400);
  }
  const meal = {
    id: nextId(db, "meal"),
    userId,
    name: name.trim(),
    calories,
    protein,
    carbs,
    fats,
    loggedAt: normalizedLoggedAt
  };
  db.meals.push(meal);
  return meal;
}

function listMeals(db, userId, date) {
  let meals = db.meals.filter((m) => m.userId === userId);
  if (date) {
    meals = meals.filter((m) => toDateKey(m.loggedAt) === date);
  }
  meals.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  return meals;
}

function addWorkout(db, userId, input) {
  const { name, durationMinutes, caloriesBurned = 0, loggedAt } = input;
  if (!isNonEmptyString(name, 140)) {
    throw createAppError("Invalid workout name", 400);
  }
  if (!isPositiveNumber(durationMinutes)) {
    throw createAppError("Invalid durationMinutes", 400);
  }
  if (!isNonNegativeNumber(caloriesBurned)) {
    throw createAppError("Invalid caloriesBurned", 400);
  }
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) {
    throw createAppError("Invalid loggedAt value", 400);
  }
  const workout = {
    id: nextId(db, "workout"),
    userId,
    name: name.trim(),
    durationMinutes,
    caloriesBurned,
    loggedAt: normalizedLoggedAt
  };
  db.workouts.push(workout);
  return workout;
}

function listWorkouts(db, userId, date) {
  let workouts = db.workouts.filter((w) => w.userId === userId);
  if (date) {
    workouts = workouts.filter((w) => toDateKey(w.loggedAt) === date);
  }
  workouts.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  return workouts;
}

function getDashboardSummary(db, userId, date) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);
  const meals = db.meals.filter((m) => m.userId === userId && toDateKey(m.loggedAt) === selectedDate);
  const workouts = db.workouts.filter((w) => w.userId === userId && toDateKey(w.loggedAt) === selectedDate);
  const profile = db.profiles.find((p) => p.userId === userId);

  const totalCaloriesIn = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalCaloriesOut = workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);
  const workoutMinutes = workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fats = meals.reduce((sum, meal) => sum + meal.fats, 0);

  return {
    date: selectedDate,
    totalCaloriesIn,
    totalCaloriesOut,
    netCalories: totalCaloriesIn - totalCaloriesOut,
    workoutMinutes,
    mealsCount: meals.length,
    workoutsCount: workouts.length,
    macros: { protein, carbs, fats },
    goals: profile
      ? {
          goalCalories: profile.goalCalories,
          goalWorkoutsPerWeek: profile.goalWorkoutsPerWeek
        }
      : null
  };
}

function getReminderSettings(db, userId) {
  const existing = db.reminders.find((item) => item.userId === userId);
  if (existing) {
    return existing;
  }
  const created = {
    userId,
    enabled: false,
    reminderTime: "20:00",
    frequency: "daily",
    updatedAt: new Date().toISOString()
  };
  db.reminders.push(created);
  return created;
}

function updateReminderSettings(db, userId, input) {
  const settings = getReminderSettings(db, userId);
  const allowedFrequencies = ["daily", "weekdays", "custom"];

  if (input.enabled !== undefined) {
    if (!isBoolean(input.enabled)) {
      throw createAppError("Invalid enabled value", 400);
    }
    settings.enabled = input.enabled;
  }
  if (input.reminderTime !== undefined) {
    if (!isValidTime(input.reminderTime)) {
      throw createAppError("Invalid reminderTime. Expected HH:MM", 400);
    }
    settings.reminderTime = input.reminderTime;
  }
  if (input.frequency !== undefined) {
    if (!allowedFrequencies.includes(input.frequency)) {
      throw createAppError("Invalid frequency", 400);
    }
    settings.frequency = input.frequency;
  }
  settings.updatedAt = new Date().toISOString();
  return settings;
}

const NON_MEDICAL_DISCLAIMER =
  "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.";
const ALLOWED_RECOMMENDATION_AREAS = new Set(["nutrition", "workout", "recovery", "consistency"]);
const SAFETY_BLOCKLIST = [
  /\bdiagnos(e|is|ed|ing)\b/i,
  /\btreat(ment|ed|ing)?\b/i,
  /\bcure(d|s|ing)?\b/i,
  /\bprescrib(e|ed|ing)?\b/i,
  /\bmedication(s)?\b/i,
  /\bdisease(s)?\b/i
];

function containsBlockedMedicalTerms(text) {
  return SAFETY_BLOCKLIST.some((pattern) => pattern.test(text));
}

function createSafeTip(area, title, message, fallbackTitle, fallbackMessage) {
  const safeArea = ALLOWED_RECOMMENDATION_AREAS.has(area) ? area : "consistency";
  const nextTitle = typeof title === "string" ? title.trim() : "";
  const nextMessage = typeof message === "string" ? message.trim() : "";
  if (!nextTitle || !nextMessage || containsBlockedMedicalTerms(nextTitle) || containsBlockedMedicalTerms(nextMessage)) {
    return {
      area: safeArea,
      title: fallbackTitle,
      message: fallbackMessage
    };
  }
  return {
    area: safeArea,
    title: nextTitle,
    message: nextMessage
  };
}

function enforceRecommendationSafety(recommendations) {
  const fallbackDisclaimer = NON_MEDICAL_DISCLAIMER;
  const disclaimer =
    typeof recommendations.disclaimer === "string" && recommendations.disclaimer.trim().length > 0
      ? recommendations.disclaimer.trim()
      : fallbackDisclaimer;
  const safeDisclaimer = containsBlockedMedicalTerms(disclaimer) ? fallbackDisclaimer : disclaimer;

  const safeTips = Array.isArray(recommendations.tips)
    ? recommendations.tips.map((tip) =>
        createSafeTip(
          tip.area,
          tip.title,
          tip.message,
          "Keep building consistency",
          "Small, repeatable healthy actions usually work better than extreme changes."
        )
      )
    : [];

  return {
    date: recommendations.date,
    disclaimer: safeDisclaimer,
    tips: safeTips
  };
}

function getDailyRecommendations(db, userId, date) {
  const userExists = db.users.some((user) => user.id === userId);
  if (!userExists) {
    throw createAppError("User not found", 404);
  }

  const summary = getDashboardSummary(db, userId, date);
  const candidates = [];

  if (summary.mealsCount === 0 && summary.workoutsCount === 0) {
    candidates.push({
      priority: 100,
      tip: {
        area: "consistency",
        title: "No activity logs yet today",
        message: "Start with one meal log or a short walk to build daily momentum."
      }
    });
  }

  if (summary.goals) {
    const calorieGap = summary.goals.goalCalories - summary.totalCaloriesIn;
    if (calorieGap >= 700) {
      candidates.push({
        priority: 90,
        tip: {
          area: "nutrition",
          title: "Calorie intake is far below goal",
          message: "Add a balanced meal with protein, complex carbs, and healthy fats."
        }
      });
    } else if (calorieGap >= 300) {
      candidates.push({
        priority: 80,
        tip: {
          area: "nutrition",
          title: "Calorie intake is below goal",
          message: "Add a light snack with protein and complex carbs to close the gap."
        }
      });
    } else if (calorieGap <= -600) {
      candidates.push({
        priority: 85,
        tip: {
          area: "nutrition",
          title: "Calorie intake is far above goal",
          message: "Choose lighter, high-protein meals for the rest of the day."
        }
      });
    } else if (calorieGap <= -250) {
      candidates.push({
        priority: 75,
        tip: {
          area: "nutrition",
          title: "Calorie intake is above goal",
          message: "Use smaller portions in your next meal and hydrate before eating."
        }
      });
    } else {
      candidates.push({
        priority: 50,
        tip: {
          area: "nutrition",
          title: "Calorie target is on track",
          message: "Keep meal timing and hydration consistent through the day."
        }
      });
    }
  }

  if (summary.mealsCount > 0) {
    const estimatedProteinTarget = Math.max(60, Math.round((summary.goals ? summary.goals.goalCalories : 2000) * 0.035));
    const proteinGap = estimatedProteinTarget - summary.macros.protein;
    if (proteinGap > 35) {
      candidates.push({
        priority: 92,
        tip: {
          area: "nutrition",
          title: "Protein intake appears low",
          message: "Aim to include 25-35g protein in your next meal."
        }
      });
    } else if (proteinGap > 15) {
      candidates.push({
        priority: 70,
        tip: {
          area: "nutrition",
          title: "Protein could be improved",
          message: "Add a moderate lean-protein source such as yogurt, eggs, or legumes."
        }
      });
    } else {
      candidates.push({
        priority: 40,
        tip: {
          area: "nutrition",
          title: "Protein balance looks solid",
          message: "Maintain similar protein distribution across meals."
        }
      });
    }
  }

  if (summary.workoutMinutes === 0) {
    candidates.push({
      priority: 88,
      tip: {
        area: "workout",
        title: "No workout logged today",
        message: "A 20-30 minute walk or bodyweight session can keep your routine active."
      }
    });
  } else if (summary.workoutMinutes < 20) {
    candidates.push({
      priority: 78,
      tip: {
        area: "workout",
        title: "Very short workout day",
        message: "If possible, add 10-15 minutes of mobility, cardio, or core work."
      }
    });
  } else if (summary.workoutMinutes < 45) {
    candidates.push({
      priority: 62,
      tip: {
        area: "workout",
        title: "Workout volume is moderate",
        message: "This is a good maintenance day; continue with steady consistency."
      }
    });
  } else {
    candidates.push({
      priority: 60,
      tip: {
        area: "workout",
        title: "Strong activity level today",
        message: "Prioritize hydration and sleep to support tomorrow's recovery."
      }
    });
  }

  if (summary.workoutsCount >= 2 || summary.workoutMinutes >= 90) {
    candidates.push({
      priority: 55,
      tip: {
        area: "recovery",
        title: "Recovery should be prioritized",
        message: "Include light stretching and a consistent bedtime to reduce next-day fatigue."
      }
    });
  }

  const selectedTips = candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map((candidate) => candidate.tip);

  const recommendations = {
    date: summary.date,
    disclaimer: NON_MEDICAL_DISCLAIMER,
    tips: selectedTips
  };

  return enforceRecommendationSafety(recommendations);
}

function followUser(db, userId, targetUserId) {
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw createAppError("Invalid targetUserId", 400);
  }
  if (targetUserId === userId) {
    throw createAppError("You cannot follow yourself", 400);
  }
  const target = db.users.find((u) => u.id === targetUserId);
  if (!target) {
    throw createAppError("Target user not found", 404);
  }
  const exists = db.follows.some((item) => item.followerUserId === userId && item.followingUserId === targetUserId);
  if (exists) {
    return { followed: true };
  }
  db.follows.push({
    followerUserId: userId,
    followingUserId: targetUserId,
    createdAt: new Date().toISOString()
  });
  return { followed: true };
}

function unfollowUser(db, userId, targetUserId) {
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    throw createAppError("Invalid targetUserId", 400);
  }
  db.follows = db.follows.filter(
    (item) => !(item.followerUserId === userId && item.followingUserId === targetUserId)
  );
  return { followed: false };
}

function listFollowing(db, userId) {
  const ids = db.follows.filter((item) => item.followerUserId === userId).map((item) => item.followingUserId);
  return db.users
    .filter((user) => ids.includes(user.id))
    .map((user) => {
      const profile = db.profiles.find((p) => p.userId === user.id);
      return {
        userId: user.id,
        email: user.email,
        name: profile ? profile.name : "User"
      };
    });
}

function listFollowers(db, userId) {
  const ids = db.follows.filter((item) => item.followingUserId === userId).map((item) => item.followerUserId);
  return db.users
    .filter((user) => ids.includes(user.id))
    .map((user) => {
      const profile = db.profiles.find((p) => p.userId === user.id);
      return {
        userId: user.id,
        email: user.email,
        name: profile ? profile.name : "User"
      };
    });
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  addMeal,
  listMeals,
  addWorkout,
  listWorkouts,
  getDashboardSummary,
  getReminderSettings,
  updateReminderSettings,
  getDailyRecommendations,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
};
