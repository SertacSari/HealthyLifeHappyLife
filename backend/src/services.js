const { createSalt, createToken, hashPassword, verifyPassword } = require("./auth");
const { nextId } = require("./db");
const { recommendationEngineMode } = require("./config");
const { generateRecommendationsWithLlm } = require("./recommendationLlm");
const { calculateNutritionTargets, normalizeSex } = require("./nutritionTargets");
const {
  isEmail,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  normalizeDateOrNow,
  toDateKey,
  isDateKey
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

function assertAllowedKeys(input, allowedKeys) {
  const keys = Object.keys(input || {});
  const invalidKey = keys.find((key) => !allowedKeys.includes(key));
  if (invalidKey) {
    throw createAppError(`Unexpected field: ${invalidKey}`, 400);
  }
}

function ensureCollection(db, key) {
  if (!Array.isArray(db[key])) {
    db[key] = [];
  }
  return db[key];
}

function normalizeStringArray(value, fieldName, maxItems = 20) {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > maxItems) {
    throw createAppError(`Invalid ${fieldName}`, 400);
  }
  return value.map((item) => {
    if (!isNonEmptyString(item, 80)) {
      throw createAppError(`Invalid ${fieldName}`, 400);
    }
    return item.trim().toLowerCase();
  });
}

function validateNumberRange(value, fieldName, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw createAppError(`Invalid ${fieldName}`, 400);
  }
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

function updateOnboardingProfile(db, userId, input) {
  const profile = updateProfile(db, userId, input);
  const allowedActivityLevels = ["sedentary", "lightly_active", "light", "moderately_active", "moderate", "active", "very_active"];
  const allowedGoalTypes = ["lose_weight", "fat_loss", "lose_fat", "maintain", "maintenance", "gain_muscle", "muscle_gain", "gain_weight"];
  const allowedPrivacyPreferences = ["private", "friends", "public"];

  if (input.age !== undefined) {
    validateNumberRange(input.age, "age", 13, 100);
    profile.age = Math.round(input.age);
  }
  if (input.sex !== undefined || input.gender !== undefined) {
    const value = input.sex !== undefined ? input.sex : input.gender;
    if (!isNonEmptyString(value, 40)) {
      throw createAppError("Invalid sex", 400);
    }
    profile.sex = normalizeSex(value);
    profile.gender = profile.sex;
  }
  if (input.heightCm !== undefined) {
    validateNumberRange(input.heightCm, "heightCm", 90, 250);
    profile.heightCm = input.heightCm;
  }
  if (input.weightKg !== undefined) {
    validateNumberRange(input.weightKg, "weightKg", 25, 350);
    profile.weightKg = input.weightKg;
  }
  if (input.activityLevel !== undefined) {
    if (!allowedActivityLevels.includes(input.activityLevel)) {
      throw createAppError("Invalid activityLevel", 400);
    }
    profile.activityLevel = input.activityLevel;
  }
  if (input.goalType !== undefined) {
    if (!allowedGoalTypes.includes(input.goalType)) {
      throw createAppError("Invalid goalType", 400);
    }
    profile.goalType = input.goalType;
  }
  if (input.dietPreference !== undefined) {
    if (!isNonEmptyString(input.dietPreference, 80)) {
      throw createAppError("Invalid dietPreference", 400);
    }
    profile.dietPreference = input.dietPreference.trim().toLowerCase();
  }
  if (input.privacyPreference !== undefined) {
    if (!allowedPrivacyPreferences.includes(input.privacyPreference)) {
      throw createAppError("Invalid privacyPreference", 400);
    }
    profile.privacyPreference = input.privacyPreference;
  }
  const restrictions = normalizeStringArray(input.restrictions, "restrictions");
  if (restrictions !== undefined) {
    profile.restrictions = restrictions;
  }
  const allergies = normalizeStringArray(input.allergies, "allergies");
  if (allergies !== undefined) {
    profile.allergies = allergies;
  }

  if (
    profile.age !== undefined &&
    profile.heightCm !== undefined &&
    profile.weightKg !== undefined &&
    profile.activityLevel !== undefined &&
    (profile.sex !== undefined || profile.gender !== undefined)
  ) {
    const targets = calculateNutritionTargets({
      age: profile.age,
      sex: profile.sex || profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      goalType: profile.goalType || "maintain"
    });
    Object.assign(profile, targets);
    profile.goalCalories = targets.dailyCalorieTarget;
  }
  profile.updatedAt = new Date().toISOString();
  return profile;
}

function getNutritionTargets(db, userId) {
  const profile = getProfile(db, userId);
  return {
    bmr: profile.bmr || null,
    tdee: profile.tdee || null,
    dailyCalorieTarget: profile.dailyCalorieTarget || profile.goalCalories || null,
    proteinTarget: profile.proteinTarget || null,
    carbTarget: profile.carbTarget || null,
    fatTarget: profile.fatTarget || null,
    activityLevel: profile.activityLevel || null,
    goalType: profile.goalType || null
  };
}

function addMeal(db, userId, input) {
  const { name, calories, protein = 0, carbs = 0, fats = 0, loggedAt, mealType, foodItemId, servingMultiplier = 1 } = input;
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
  if (mealType !== undefined && !isNonEmptyString(mealType, 40)) {
    throw createAppError("Invalid mealType", 400);
  }
  if (foodItemId !== undefined && (!Number.isInteger(foodItemId) || foodItemId <= 0)) {
    throw createAppError("Invalid foodItemId", 400);
  }
  if (!isPositiveNumber(servingMultiplier)) {
    throw createAppError("Invalid servingMultiplier", 400);
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
  if (mealType !== undefined) {
    meal.mealType = mealType.trim().toLowerCase();
  }
  if (foodItemId !== undefined) {
    meal.foodItemId = foodItemId;
    meal.servingMultiplier = servingMultiplier;
  }
  db.meals.push(meal);
  return meal;
}

function normalizeFoodItemInput(input, requireAll = true) {
  const item = {};
  for (const field of ["name", "brand", "category", "servingSize"]) {
    if (input[field] !== undefined) {
      if (!isNonEmptyString(input[field], field === "name" ? 140 : 80)) {
        throw createAppError(`Invalid ${field}`, 400);
      }
      item[field] = input[field].trim();
    } else if (requireAll && ["name", "servingSize"].includes(field)) {
      throw createAppError(`Invalid ${field}`, 400);
    }
  }
  for (const field of ["calories", "protein", "carbs", "fats"]) {
    if (input[field] !== undefined) {
      const valid = field === "calories" ? isPositiveNumber(input[field]) : isNonNegativeNumber(input[field]);
      if (!valid) {
        throw createAppError(`Invalid ${field}`, 400);
      }
      item[field] = input[field];
    } else if (requireAll) {
      throw createAppError(`Invalid ${field}`, 400);
    }
  }
  const dietTags = normalizeStringArray(input.dietTags, "dietTags");
  const allergens = normalizeStringArray(input.allergens, "allergens");
  if (dietTags !== undefined) {
    item.dietTags = dietTags;
  }
  if (allergens !== undefined) {
    item.allergens = allergens;
  }
  return item;
}

function listFoodItems(db, userId, options = {}) {
  const items = ensureCollection(db, "foodItems");
  const query = typeof options.query === "string" ? options.query.trim().toLowerCase() : "";
  const filter = typeof options.filter === "string" ? options.filter.trim().toLowerCase() : "";
  const profile = db.profiles.find((item) => item.userId === userId) || {};
  const allergies = new Set(profile.allergies || []);

  return items
    .filter((item) => {
      const text = [item.name, item.brand, item.category, item.servingSize, ...(item.dietTags || [])].join(" ").toLowerCase();
      if (query && !text.includes(query)) {
        return false;
      }
      if (filter === "allergy_safe" && (item.allergens || []).some((allergen) => allergies.has(allergen))) {
        return false;
      }
      if (filter && filter !== "allergy_safe") {
        return item.category === filter || (item.dietTags || []).includes(filter);
      }
      return true;
    })
    .slice(0, 50);
}

function createFoodItem(db, userId, input) {
  const foodItems = ensureCollection(db, "foodItems");
  const now = new Date().toISOString();
  const item = {
    id: nextId(db, "foodItem"),
    ...normalizeFoodItemInput(input),
    brand: input.brand ? input.brand.trim() : "Custom",
    category: input.category ? input.category.trim().toLowerCase() : "custom",
    dietTags: normalizeStringArray(input.dietTags, "dietTags") || [],
    allergens: normalizeStringArray(input.allergens, "allergens") || [],
    source: "user",
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now
  };
  foodItems.push(item);
  return item;
}

function addMealFromFoodItem(db, userId, input) {
  const foodItemId = input.foodItemId;
  if (!Number.isInteger(foodItemId) || foodItemId <= 0) {
    throw createAppError("Invalid foodItemId", 400);
  }
  const servingMultiplier = input.servingMultiplier === undefined ? 1 : input.servingMultiplier;
  if (!isPositiveNumber(servingMultiplier)) {
    throw createAppError("Invalid servingMultiplier", 400);
  }
  const foodItem = ensureCollection(db, "foodItems").find((item) => item.id === foodItemId);
  if (!foodItem) {
    throw createAppError("Food item not found", 404);
  }
  return addMeal(db, userId, {
    name: input.name || foodItem.name,
    calories: Math.round(foodItem.calories * servingMultiplier),
    protein: Number((foodItem.protein * servingMultiplier).toFixed(1)),
    carbs: Number((foodItem.carbs * servingMultiplier).toFixed(1)),
    fats: Number((foodItem.fats * servingMultiplier).toFixed(1)),
    loggedAt: input.loggedAt,
    mealType: input.mealType,
    foodItemId,
    servingMultiplier
  });
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

function normalizeTemplateItems(db, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
    throw createAppError("Invalid items", 400);
  }
  return rawItems.map((rawItem) => {
    const foodItemId = rawItem.foodItemId;
    if (!Number.isInteger(foodItemId) || foodItemId <= 0) {
      throw createAppError("Invalid foodItemId", 400);
    }
    const servingMultiplier = rawItem.servingMultiplier === undefined ? 1 : rawItem.servingMultiplier;
    if (!isPositiveNumber(servingMultiplier)) {
      throw createAppError("Invalid servingMultiplier", 400);
    }
    const foodItem = ensureCollection(db, "foodItems").find((item) => item.id === foodItemId);
    if (!foodItem) {
      throw createAppError("Food item not found", 404);
    }
    return {
      foodItemId,
      name: foodItem.name,
      servingMultiplier,
      calories: Math.round(foodItem.calories * servingMultiplier),
      protein: Number((foodItem.protein * servingMultiplier).toFixed(1)),
      carbs: Number((foodItem.carbs * servingMultiplier).toFixed(1)),
      fats: Number((foodItem.fats * servingMultiplier).toFixed(1))
    };
  });
}

function summarizeTemplateItems(items) {
  return {
    calories: items.reduce((sum, item) => sum + item.calories, 0),
    protein: Number(items.reduce((sum, item) => sum + item.protein, 0).toFixed(1)),
    carbs: Number(items.reduce((sum, item) => sum + item.carbs, 0).toFixed(1)),
    fats: Number(items.reduce((sum, item) => sum + item.fats, 0).toFixed(1))
  };
}

function listMealTemplates(db, userId) {
  return ensureCollection(db, "mealTemplates")
    .filter((template) => template.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function createMealTemplate(db, userId, input) {
  if (!isNonEmptyString(input.name, 120)) {
    throw createAppError("Invalid template name", 400);
  }
  const items = normalizeTemplateItems(db, input.items);
  const totals = summarizeTemplateItems(items);
  const now = new Date().toISOString();
  const template = {
    id: nextId(db, "mealTemplate"),
    userId,
    name: input.name.trim(),
    mealType: isNonEmptyString(input.mealType, 40) ? input.mealType.trim().toLowerCase() : undefined,
    items,
    totals,
    createdAt: now,
    updatedAt: now
  };
  ensureCollection(db, "mealTemplates").push(template);
  return template;
}

function addMealTemplateToLog(db, userId, input) {
  const templateId = input.templateId;
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw createAppError("Invalid templateId", 400);
  }
  const template = ensureCollection(db, "mealTemplates").find((item) => item.id === templateId && item.userId === userId);
  if (!template) {
    throw createAppError("Meal template not found", 404);
  }
  return addMeal(db, userId, {
    name: input.name || template.name,
    calories: template.totals.calories,
    protein: template.totals.protein,
    carbs: template.totals.carbs,
    fats: template.totals.fats,
    loggedAt: input.loggedAt,
    mealType: input.mealType || template.mealType
  });
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

function getDailyCheckIn(db, userId, date) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);
  return ensureCollection(db, "dailyCheckIns").find((item) => item.userId === userId && item.date === selectedDate) || null;
}

function upsertDailyCheckIn(db, userId, input) {
  const selectedDate = input.date || new Date().toISOString().slice(0, 10);
  if (!isDateKey(selectedDate)) {
    throw createAppError("Invalid date. Expected YYYY-MM-DD", 400);
  }
  for (const field of ["energyLevel", "mood", "soreness"]) {
    if (input[field] !== undefined) {
      validateNumberRange(input[field], field, 1, 5);
    }
  }
  if (input.sleepHours !== undefined) {
    validateNumberRange(input.sleepHours, "sleepHours", 0, 16);
  }
  if (input.notes !== undefined && typeof input.notes !== "string") {
    throw createAppError("Invalid notes", 400);
  }
  const checkIns = ensureCollection(db, "dailyCheckIns");
  let checkIn = checkIns.find((item) => item.userId === userId && item.date === selectedDate);
  const now = new Date().toISOString();
  if (!checkIn) {
    checkIn = {
      id: nextId(db, "dailyCheckIn"),
      userId,
      date: selectedDate,
      createdAt: now
    };
    checkIns.push(checkIn);
  }
  for (const field of ["energyLevel", "mood", "soreness", "sleepHours", "notes"]) {
    if (input[field] !== undefined) {
      checkIn[field] = field === "notes" ? input[field].trim().slice(0, 500) : input[field];
    }
  }
  checkIn.updatedAt = now;
  return checkIn;
}

function getWorkoutRecommendation(db, userId, date) {
  const selectedDate = date || new Date().toISOString().slice(0, 10);
  const profile = getProfile(db, userId);
  const checkIn = getDailyCheckIn(db, userId, selectedDate);
  const recentWorkouts = db.workouts.filter((item) => item.userId === userId && toDateKey(item.loggedAt) === selectedDate);
  const minutesToday = recentWorkouts.reduce((sum, item) => sum + item.durationMinutes, 0);
  const lowReadiness =
    checkIn &&
    ((checkIn.energyLevel !== undefined && checkIn.energyLevel <= 2) ||
      (checkIn.soreness !== undefined && checkIn.soreness >= 4) ||
      (checkIn.sleepHours !== undefined && checkIn.sleepHours < 6));

  if (lowReadiness) {
    return {
      date: selectedDate,
      title: "Recovery-focused movement",
      workoutType: "recovery",
      durationMinutes: 20,
      intensity: "low",
      reason: "Daily check-in suggests lower readiness today."
    };
  }
  if (minutesToday > 0) {
    return {
      date: selectedDate,
      title: "Optional mobility finisher",
      workoutType: "mobility",
      durationMinutes: 10,
      intensity: "low",
      reason: "A workout is already logged today."
    };
  }
  const targetDays = profile.goalWorkoutsPerWeek || 3;
  return {
    date: selectedDate,
    title: targetDays >= 4 ? "Full-body strength session" : "Brisk cardio session",
    workoutType: targetDays >= 4 ? "strength" : "cardio",
    durationMinutes: targetDays >= 4 ? 40 : 30,
    intensity: "moderate",
    reason: "Matches the weekly workout goal and today's check-in."
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
  assertAllowedKeys(input, ["enabled", "reminderTime", "frequency"]);
  if (Object.keys(input).length === 0) {
    throw createAppError("At least one reminder setting must be provided", 400);
  }

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
  /\bdisease(s)?\b/i,
  /\bdetox\b/i,
  /\bcleanse\b/i,
  /\bstarv(e|ing|ation)\b/i,
  /\bfat\s*burner(s)?\b/i,
  /\bno[-\s]?carb(s)?\b/i,
  /\bzero[-\s]?carb(s)?\b/i,
  /\bunder\s*1[,]?200\s*calories\b/i
];
const ALLOWED_ACTION_TYPES = new Set(["meal", "workout", "recovery", "habit"]);

function containsBlockedMedicalTerms(text) {
  return SAFETY_BLOCKLIST.some((pattern) => pattern.test(text));
}

function clampNumber(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function cleanRecommendationReason(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || containsBlockedMedicalTerms(text)) {
    return fallback;
  }
  return text.slice(0, 220);
}

function createSafeTip(area, tipOrTitle, message, fallbackTitle, fallbackMessage) {
  const safeArea = ALLOWED_RECOMMENDATION_AREAS.has(area) ? area : "consistency";
  const sourceTip = tipOrTitle && typeof tipOrTitle === "object" ? tipOrTitle : null;
  const rawTitle = sourceTip ? sourceTip.title : tipOrTitle;
  const rawMessage = sourceTip ? sourceTip.message : message;
  const nextTitle = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const nextMessage = typeof rawMessage === "string" ? rawMessage.trim() : "";
  if (!nextTitle || !nextMessage || containsBlockedMedicalTerms(nextTitle) || containsBlockedMedicalTerms(nextMessage)) {
    return {
      area: safeArea,
      title: fallbackTitle,
      message: fallbackMessage,
      reason: "Original recommendation was replaced by the non-medical safety filter.",
      confidence: 0.5,
      priority: 50,
      actionType: "habit"
    };
  }
  const safeTip = {
    area: safeArea,
    title: nextTitle,
    message: nextMessage
  };
  if (sourceTip) {
    safeTip.reason = cleanRecommendationReason(sourceTip.reason, "Based on today's logged nutrition, activity, and readiness context.");
    safeTip.confidence = sourceTip.confidence === undefined ? 0.6 : clampNumber(sourceTip.confidence, 0, 1);
    safeTip.priority = sourceTip.priority === undefined ? 50 : Math.round(clampNumber(sourceTip.priority, 0, 100));
    safeTip.actionType = ALLOWED_ACTION_TYPES.has(sourceTip.actionType) ? sourceTip.actionType : "habit";
  }
  return safeTip;
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
          tip,
          tip.message,
          "Keep building consistency",
          "Small, repeatable healthy actions usually work better than extreme changes."
        )
      )
    : [];

  return {
    date: recommendations.date,
    disclaimer: safeDisclaimer,
    tips: safeTips,
    source: recommendations.source || "rules"
  };
}

function normalizeGoalType(goalType) {
  if (["lose_weight", "fat_loss", "lose_fat"].includes(goalType)) {
    return "lose_fat";
  }
  if (["gain_muscle", "muscle_gain", "gain_weight"].includes(goalType)) {
    return "gain_muscle";
  }
  return "maintain";
}

function recommendationTip({ area, title, message, reason, priority, actionType, confidence }) {
  return {
    area,
    title,
    message,
    reason,
    priority,
    confidence: confidence !== undefined ? confidence : Number((0.55 + priority / 220).toFixed(2)),
    actionType
  };
}

function candidateTip(priority, tip) {
  return {
    priority,
    tip: recommendationTip({ ...tip, priority })
  };
}

function normalizedText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ğ]/g, "g")
    .replace(/[ç]/g, "c");
}

function foodAllowedForProfile(food, profile) {
  const blockedTerms = [
    ...(Array.isArray(profile.restrictions) ? profile.restrictions : []),
    ...(Array.isArray(profile.allergies) ? profile.allergies : [])
  ].map(normalizedText);
  if (blockedTerms.length === 0) {
    return true;
  }
  const searchable = normalizedText([
    food.name,
    food.category,
    food.brand,
    ...(Array.isArray(food.dietTags) ? food.dietTags : []),
    ...(Array.isArray(food.allergens) ? food.allergens : [])
  ].join(" "));
  return !blockedTerms.some((term) => term && searchable.includes(term));
}

function findAvailableFood(db, profile, patterns) {
  const foods = Array.isArray(db.foodItems) ? db.foodItems : [];
  return foods.find((food) => foodAllowedForProfile(food, profile) && patterns.some((pattern) => pattern.test(normalizedText(food.name))));
}

function getMealTiming(meals) {
  const hours = meals
    .map((meal) => {
      const hour = new Date(meal.loggedAt).getUTCHours();
      return Number.isInteger(hour) ? hour : null;
    })
    .filter((hour) => hour !== null)
    .sort((a, b) => a - b);
  return {
    firstHour: hours.length ? hours[0] : null,
    lastHour: hours.length ? hours[hours.length - 1] : null
  };
}

function buildReadinessContext(checkIn) {
  if (!checkIn) {
    return { lowReadiness: false, reasons: [] };
  }
  const reasons = [];
  if (checkIn.energyLevel !== undefined && checkIn.energyLevel <= 2) {
    reasons.push(`energy ${checkIn.energyLevel}/5`);
  }
  if (checkIn.soreness !== undefined && checkIn.soreness >= 4) {
    reasons.push(`soreness ${checkIn.soreness}/5`);
  }
  if (checkIn.sleepHours !== undefined && checkIn.sleepHours < 6) {
    reasons.push(`${checkIn.sleepHours}h sleep`);
  }
  const noteText = normalizedText(checkIn.notes);
  if (noteText && /\b(exam|stress|tired|fatigue|busy|deadline)\b/.test(noteText)) {
    reasons.push("check-in notes suggest a demanding day");
  }
  return { lowReadiness: reasons.length > 0, reasons };
}

function getDailyRecommendations(db, userId, date) {
  const userExists = db.users.some((user) => user.id === userId);
  if (!userExists) {
    throw createAppError("User not found", 404);
  }

  const summary = getDashboardSummary(db, userId, date);
  const selectedDate = summary.date;
  const profile = getProfile(db, userId);
  const goalType = normalizeGoalType(profile.goalType);
  const checkIn = getDailyCheckIn(db, userId, selectedDate);
  const meals = db.meals.filter((meal) => meal.userId === userId && toDateKey(meal.loggedAt) === selectedDate);
  const mealTiming = getMealTiming(meals);
  const readiness = buildReadinessContext(checkIn);
  const calorieTarget = summary.goals?.goalCalories || profile.dailyCalorieTarget || profile.goalCalories || 2000;
  const proteinTarget = profile.proteinTarget || Math.max(60, Math.round(calorieTarget * 0.035));
  const carbTarget = profile.carbTarget || Math.max(0, Math.round((calorieTarget * 0.45) / 4));
  const fatTarget = profile.fatTarget || Math.max(0, Math.round((calorieTarget * 0.25) / 9));
  const calorieGap = calorieTarget - summary.totalCaloriesIn;
  const proteinGap = proteinTarget - summary.macros.protein;
  const candidates = [];

  if (summary.mealsCount === 0 && summary.workoutsCount === 0) {
    candidates.push(
      candidateTip(100, {
        area: "consistency",
        title: "No activity logs yet today",
        message: "Start with one meal log or a short walk to build daily momentum.",
        reason: "No meal or workout logs exist for the selected date, so the engine prioritizes a low-friction first action.",
        actionType: "habit"
      })
    );
  }

  if (readiness.lowReadiness) {
    candidates.push(
      candidateTip(96, {
        area: "recovery",
        title: "Recovery readiness is low",
        message: "Keep training gentle today: easy walking, mobility, or a rest-focused routine fits your check-in.",
        reason: `Daily check-in signals lower readiness (${readiness.reasons.join(", ")}).`,
        actionType: "recovery",
        confidence: 0.92
      })
    );
  }

  if (summary.goals) {
    if (calorieGap >= 700) {
      const gainMuscle = goalType === "gain_muscle";
      candidates.push(
        candidateTip(gainMuscle ? 94 : 90, {
          area: "nutrition",
          title: "Calorie intake is far below goal",
          message: gainMuscle
            ? "Add a full meal with protein and carbs so muscle-gain days are not under-fueled."
            : "Add a balanced meal with protein, complex carbs, and healthy fats.",
          reason: `Logged intake is about ${Math.round(calorieGap)} calories below the ${calorieTarget}-calorie target.`,
          actionType: "meal"
        })
      );
    } else if (calorieGap >= 300) {
      candidates.push(
        candidateTip(80, {
          area: "nutrition",
          title: "Calorie intake is below goal",
          message:
            goalType === "gain_muscle"
              ? "Add a protein-forward snack with carbs to support your muscle-gain target."
              : "Add a light snack with protein and complex carbs to close the gap.",
          reason: `The remaining calorie gap is about ${Math.round(calorieGap)} calories after today's meal logs.`,
          actionType: "meal"
        })
      );
    } else if (calorieGap <= -600) {
      candidates.push(
        candidateTip(85, {
          area: "nutrition",
          title: "Calorie intake is far above goal",
          message:
            goalType === "lose_fat"
              ? "For a fat-loss goal, keep the rest of the day lighter with protein and vegetables rather than skipping meals."
              : "Choose lighter, high-protein meals for the rest of the day.",
          reason: `Logged intake is about ${Math.abs(Math.round(calorieGap))} calories above the ${calorieTarget}-calorie target.`,
          actionType: "meal"
        })
      );
    } else if (calorieGap <= -250) {
      candidates.push(
        candidateTip(75, {
          area: "nutrition",
          title: "Calorie intake is above goal",
          message:
            goalType === "lose_fat"
              ? "Use a smaller portion at the next meal and choose filling protein, soup, or salad sides."
              : "Use smaller portions in your next meal and hydrate before eating.",
          reason: `Today's meal logs are about ${Math.abs(Math.round(calorieGap))} calories above target.`,
          actionType: "meal"
        })
      );
    } else {
      candidates.push(
        candidateTip(50, {
          area: "nutrition",
          title: "Calorie target is on track",
          message: "Keep meal timing and hydration consistent through the day.",
          reason: `Logged calories are within a practical range of the ${calorieTarget}-calorie target.`,
          actionType: "habit",
          confidence: 0.72
        })
      );
    }
  }

  if (summary.mealsCount > 0) {
    if (proteinGap > 35) {
      candidates.push(
        candidateTip(92, {
          area: "nutrition",
          title: "Protein intake appears low",
          message: "Aim to include 25-35g protein in your next meal.",
          reason: `Logged protein is ${Math.round(summary.macros.protein)}g against a target near ${Math.round(proteinTarget)}g.`,
          actionType: "meal",
          confidence: 0.9
        })
      );
    } else if (proteinGap > 15) {
      candidates.push(
        candidateTip(70, {
          area: "nutrition",
          title: "Protein could be improved",
          message: "Add a moderate lean-protein source such as yogurt, eggs, or legumes.",
          reason: `Protein is about ${Math.round(proteinGap)}g below the current target.`,
          actionType: "meal"
        })
      );
    } else {
      candidates.push(
        candidateTip(76, {
          area: "nutrition",
          title: "Protein balance looks solid",
          message: "Maintain similar protein distribution across meals.",
          reason: `Protein is within range for the current target of about ${Math.round(proteinTarget)}g.`,
          actionType: "habit",
          confidence: 0.68
        })
      );
    }
  }

  if (summary.mealsCount > 0) {
    const carbGap = carbTarget - summary.macros.carbs;
    if (summary.macros.fats > fatTarget * 1.35 && calorieGap < 450) {
      candidates.push(
        candidateTip(64, {
          area: "nutrition",
          title: "Fat balance is running high",
          message: "Choose a leaner next plate with protein, vegetables, and a moderate carb portion.",
          reason: `Logged fats are ${Math.round(summary.macros.fats)}g against a target near ${Math.round(fatTarget)}g.`,
          actionType: "meal"
        })
      );
    } else if (carbGap > 80 && summary.workoutMinutes > 20 && calorieGap > 250) {
      candidates.push(
        candidateTip(63, {
          area: "nutrition",
          title: "Carbs can support activity",
          message: "Add a moderate carb source with protein after training, such as rice, bulgur, fruit, or lentils.",
          reason: `Workout activity is logged and carbs are about ${Math.round(carbGap)}g below target.`,
          actionType: "meal"
        })
      );
    }
  }

  if (summary.mealsCount > 0 && mealTiming.lastHour !== null) {
    if (summary.mealsCount < 2 && mealTiming.lastHour >= 12) {
      candidates.push(
        candidateTip(66, {
          area: "nutrition",
          title: "Meal timing is uneven",
          message: "Plan one simple meal or snack later so the day does not depend on one large eating window.",
          reason: `Only ${summary.mealsCount} meal is logged and the latest meal time is around ${mealTiming.lastHour}:00.`,
          actionType: "meal"
        })
      );
    } else if (summary.mealsCount >= 3 && proteinGap > 15) {
      candidates.push(
        candidateTip(58, {
          area: "nutrition",
          title: "Spread protein across meals",
          message: "Your meal count is good; make the next meal protein-forward to improve distribution.",
          reason: `${summary.mealsCount} meals are logged but protein remains below target.`,
          actionType: "meal"
        })
      );
    }
  }

  if (summary.workoutMinutes === 0) {
    candidates.push(
      candidateTip(readiness.lowReadiness ? 68 : 88, {
        area: "workout",
        title: "No workout logged today",
        message: readiness.lowReadiness
          ? "If you move today, keep it easy: a short walk or mobility session is enough."
          : "A 20-30 minute walk or bodyweight session can keep your routine active.",
        reason: readiness.lowReadiness
          ? "No workout is logged, but check-in readiness lowers the suggested intensity."
          : "No workout minutes are logged for the selected date.",
        actionType: readiness.lowReadiness ? "recovery" : "workout"
      })
    );
  } else if (summary.workoutMinutes < 20) {
    candidates.push(
      candidateTip(78, {
        area: "workout",
        title: "Very short workout day",
        message: "If possible, add 10-15 minutes of mobility, cardio, or core work.",
        reason: `Workout time is ${summary.workoutMinutes} minutes, below the 20-minute threshold.`,
        actionType: "workout"
      })
    );
  } else if (summary.workoutMinutes < 45) {
    candidates.push(
      candidateTip(62, {
        area: "workout",
        title: "Workout volume is moderate",
        message: "This is a good maintenance day; continue with steady consistency.",
        reason: `${summary.workoutMinutes} workout minutes are logged today.`,
        actionType: "habit"
      })
    );
  } else {
    candidates.push(
      candidateTip(60, {
        area: "workout",
        title: "Strong activity level today",
        message: "Prioritize hydration and sleep to support tomorrow's recovery.",
        reason: `${summary.workoutMinutes} workout minutes are logged today.`,
        actionType: "recovery"
      })
    );
  }

  if (summary.workoutsCount >= 2 || summary.workoutMinutes >= 90) {
    candidates.push(
      candidateTip(55, {
        area: "recovery",
        title: "Recovery should be prioritized",
        message: "Include light stretching and a consistent bedtime to reduce next-day fatigue.",
        reason: `${summary.workoutsCount} workout(s) and ${summary.workoutMinutes} total minutes are logged.`,
        actionType: "recovery"
      })
    );
  }

  const lahmacun = findAvailableFood(db, profile, [/lahmacun/]);
  const ayran = findAvailableFood(db, profile, [/ayran/]);
  const doner = findAvailableFood(db, profile, [/doner/]);
  const kebap = findAvailableFood(db, profile, [/kebap/, /kebab/]);
  const mercimek = findAvailableFood(db, profile, [/mercimek/, /lentil soup/]);
  if (summary.mealsCount > 0 && (lahmacun || doner || kebap || mercimek)) {
    if (calorieGap <= -250 && mercimek) {
      candidates.push(
        candidateTip(82, {
          area: "nutrition",
          title: "Turkish lighter option available",
          message: `${mercimek.name} is a practical lighter choice for a student meal when calories are already ahead of target.`,
          reason: `The food database includes ${mercimek.name}, and calories are currently above target.`,
          actionType: "meal",
          confidence: 0.86
        })
      );
    } else if (proteinGap > 20 && kebap) {
      candidates.push(
        candidateTip(84, {
          area: "nutrition",
          title: "Turkish high-protein option available",
          message: `${kebap.name} can work as a protein-forward meal; keep sides and sauces moderate.`,
          reason: `The food database includes ${kebap.name}, and protein is about ${Math.round(proteinGap)}g below target.`,
          actionType: "meal"
        })
      );
    } else if (proteinGap > 15 && lahmacun && ayran) {
      candidates.push(
        candidateTip(81, {
          area: "nutrition",
          title: "Balance lahmacun with protein",
          message: `${lahmacun.name} with ${ayran.name} can be more balanced than lahmacun alone; watch portions if calories are tight.`,
          reason: `The food database includes ${lahmacun.name} and ${ayran.name}, while protein remains below target.`,
          actionType: "meal"
        })
      );
    } else if (calorieGap < 300 && doner) {
      candidates.push(
        candidateTip(52, {
          area: "nutrition",
          title: "Doner portion awareness",
          message: `${doner.name} can fit the day better with a smaller bread/rice portion and ayran or salad if available.`,
          reason: `The food database includes ${doner.name}, and remaining calories are limited.`,
          actionType: "meal"
        })
      );
    }
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

async function getDailyRecommendationsHybrid(db, userId, date) {
  const deterministic = getDailyRecommendations(db, userId, date);
  if (!["llm_hybrid", "hybrid"].includes(recommendationEngineMode)) {
    return {
      ...deterministic,
      source: "rules"
    };
  }

  try {
    const llmResult = await generateRecommendationsWithLlm(deterministic);
    return enforceRecommendationSafety(llmResult);
  } catch (_error) {
    return {
      ...deterministic,
      source: "rules"
    };
  }
}

function listUsersByQuery(db, requesterUserId, query) {
  if (!isNonEmptyString(query, 80)) {
    throw createAppError("Invalid query", 400);
  }
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    throw createAppError("Query must be at least 2 characters", 400);
  }

  const matchedUsers = db.users.filter((user) => {
    if (user.id === requesterUserId) {
      return false;
    }
    const profile = db.profiles.find((item) => item.userId === user.id);
    const profileName = profile ? profile.name.toLowerCase() : "";
    return user.email.toLowerCase().includes(normalizedQuery) || profileName.includes(normalizedQuery);
  });

  return matchedUsers.slice(0, 20).map((user) => {
    const profile = db.profiles.find((item) => item.userId === user.id);
    return {
      userId: user.id,
      email: user.email,
      name: profile ? profile.name : "User"
    };
  });
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
  updateOnboardingProfile,
  getNutritionTargets,
  addMeal,
  addMealFromFoodItem,
  listMeals,
  listFoodItems,
  createFoodItem,
  listMealTemplates,
  createMealTemplate,
  addMealTemplateToLog,
  addWorkout,
  listWorkouts,
  getDailyCheckIn,
  upsertDailyCheckIn,
  getWorkoutRecommendation,
  getDashboardSummary,
  getReminderSettings,
  updateReminderSettings,
  getDailyRecommendations,
  getDailyRecommendationsHybrid,
  listUsersByQuery,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
};
