const http = require("node:http");
const { port, jwtSecret, tokenTtlSeconds, dbProvider } = require("./config");
const { verifyToken } = require("./auth");
const { loadDb, saveDb } = require("./db");
const { sendJson, sendNotFound, sendMethodNotAllowed, parseUrl, readJsonBody } = require("./http");
const { isDateKey } = require("./validation");
const { searchFoods } = require("./fatsecretClient");
const {
  generateMealSuggestions,
  buildCoachTodayPlan,
  generateWeeklyProgressSummary
} = require("./aiCoachService");
const {
  createMealPost,
  listVisibleFeed,
  likePost,
  commentOnPost,
  copyMealPostToLog
} = require("./socialFeedService");
const {
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
  getDailyRecommendationsHybrid,
  listUsersByQuery,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
} = require("./services");

const authConfig = { jwtSecret, tokenTtlSeconds };

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS,DELETE");
}

function authUser(req, db) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.replace("Bearer ", "").trim();
  const result = verifyToken(token, jwtSecret);
  if (!result.valid) {
    return null;
  }
  return db.users.find((u) => u.id === result.payload.userId) || null;
}

function sendServiceError(res, error) {
  const status = error && Number.isInteger(error.status) ? error.status : 500;
  const message = error && error.message ? error.message : "Internal server error";
  return sendJson(res, status, { error: message });
}

function sanitizeUser(user) {
  return {
    id: user.userId,
    email: user.email,
    createdAt: user.createdAt
  };
}

function sanitizeDbUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function getValidatedDateQuery(url, fieldName = "date") {
  const selectedDate = url.searchParams.get(fieldName);
  if (!selectedDate) {
    return new Date().toISOString().slice(0, 10);
  }
  if (!isDateKey(selectedDate)) {
    const error = new Error(`Invalid ${fieldName}. Expected YYYY-MM-DD`);
    error.status = 400;
    throw error;
  }
  return selectedDate;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function mealName(meal) {
  return meal && meal.name ? meal.name : "";
}

function buildMealSuggestionContext(db, userId, body) {
  const date = getTodayKey();
  const profile = getProfile(db, userId);
  const summary = getDashboardSummary(db, userId, date);
  const meals = listMeals(db, userId, date);
  const foodItems = listFoodItems(db, userId, {});
  const request = body || {};
  const availableIngredients = Array.isArray(request.availableIngredients) ? request.availableIngredients : [];

  return {
    date,
    profile,
    goals: summary.goals,
    summary,
    meals,
    recentMeals: meals.map(mealName),
    availableIngredients,
    storeItems: foodItems.map((item) => item.name),
    foodItems,
    remainingCalories: summary.goals ? summary.goals.goalCalories - summary.totalCaloriesIn : null,
    dietaryConstraints: profile.restrictions || [],
    allergies: profile.allergies || [],
    timeAvailableMinutes: request.timeAvailableMinutes,
    hungerLevel: request.hungerLevel,
    budgetPreference: request.budgetPreference,
    coachMode: request.coachMode || request.mode
  };
}

function buildTodayPlanContext(db, userId, date, mode) {
  const profile = getProfile(db, userId);
  const summary = getDashboardSummary(db, userId, date);
  const targets = getNutritionTargets(db, userId);
  const meals = listMeals(db, userId, date);
  const foodItems = listFoodItems(db, userId, {});
  const checkIn = getDailyCheckIn(db, userId, date);
  const workoutRecommendation = getWorkoutRecommendation(db, userId, date);
  return {
    date,
    mode,
    coachMode: mode,
    profile,
    summary,
    targets,
    meals,
    recentMeals: meals.map(mealName),
    foodItems,
    storeItems: foodItems.map((item) => item.name),
    availableIngredients: foodItems.slice(0, 12).map((item) => item.name),
    dietaryConstraints: profile.restrictions || [],
    allergies: profile.allergies || [],
    checkIn,
    workoutRecommendation
  };
}

function buildWeeklyReviewContext(db, userId, weekStart) {
  const startDate = weekStart || addDays(getTodayKey(), -6);
  const profile = getProfile(db, userId);
  const days = Array.from({ length: 7 }, (_item, index) => {
    const date = addDays(startDate, index);
    const summary = getDashboardSummary(db, userId, date);
    const checkIn = getDailyCheckIn(db, userId, date);
    return {
      date,
      calories: summary.totalCaloriesIn,
      totalCaloriesIn: summary.totalCaloriesIn,
      totalCaloriesOut: summary.totalCaloriesOut,
      workoutMinutes: summary.workoutMinutes,
      mealsCount: summary.mealsCount,
      workouts: summary.workoutsCount,
      workoutsCount: summary.workoutsCount,
      macros: summary.macros,
      checkIn
    };
  });

  return {
    weekStart: startDate,
    weekEnd: addDays(startDate, 6),
    profile,
    goals: {
      goalCalories: profile.goalCalories,
      goalWorkoutsPerWeek: profile.goalWorkoutsPerWeek
    },
    days
  };
}

function templateMealPayload(db, userId, templateId, overrides = {}) {
  if (!Number.isInteger(templateId) || templateId <= 0) {
    const error = new Error("Invalid templateId");
    error.status = 400;
    throw error;
  }
  const template = listMealTemplates(db, userId).find((item) => item.id === templateId);
  if (!template) {
    const error = new Error("Meal template not found");
    error.status = 404;
    throw error;
  }
  return {
    name: overrides.name || template.name,
    calories: template.totals.calories,
    protein: template.totals.protein,
    carbs: template.totals.carbs,
    fats: template.totals.fats,
    loggedAt: overrides.loggedAt,
    mealType: overrides.mealType || template.mealType
  };
}

function buildSocialPostPayload(db, userId, body) {
  const payload = body || {};
  const next = {
    caption: payload.caption,
    visibility: payload.visibility,
    privacy: payload.privacy
  };

  if (Number.isInteger(payload.mealId)) {
    next.mealId = payload.mealId;
    return next;
  }
  if (Number.isInteger(payload.templateId) || Number.isInteger(payload.mealTemplateId)) {
    next.meal = templateMealPayload(db, userId, payload.templateId || payload.mealTemplateId, payload);
    return next;
  }
  if (payload.meal && typeof payload.meal === "object") {
    next.meal = payload.meal;
    return next;
  }
  next.meal = {
    name: payload.name,
    calories: payload.calories,
    protein: payload.protein,
    carbs: payload.carbs,
    fats: payload.fats,
    loggedAt: payload.loggedAt,
    mealType: payload.mealType
  };
  return next;
}

async function handleSignup(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const created = signup(db, body, authConfig);
    await saveDb(db);
    return sendJson(res, 201, {
      token: created.token,
      user: sanitizeUser(created)
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleMealSuggestions(req, res, options) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const context = buildMealSuggestionContext(db, user.id, body);
    const suggestions = await generateMealSuggestions(context, options.aiCoachOptions || {});
    return sendJson(res, 200, { suggestions });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleTodayPlan(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const selectedDate = getValidatedDateQuery(url);
    const mode = url.searchParams.get("mode") || "balanced";
    const context = buildTodayPlanContext(db, user.id, selectedDate, mode);
    context.recommendations = await getDailyRecommendationsHybrid(db, user.id, selectedDate);
    const plan = buildCoachTodayPlan(context);
    return sendJson(res, 200, { plan });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleWeeklyReview(req, res, url, options) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const weekStart = url.searchParams.get("weekStart");
    if (weekStart && !isDateKey(weekStart)) {
      return sendJson(res, 400, { error: "Invalid weekStart. Expected YYYY-MM-DD" });
    }
    const context = buildWeeklyReviewContext(db, user.id, weekStart || null);
    const review = await generateWeeklyProgressSummary(context, options.aiCoachOptions || {});
    return sendJson(res, 200, { review });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateSocialPost(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const post = createMealPost(db, user.id, buildSocialPostPayload(db, user.id, body));
    await saveDb(db);
    return sendJson(res, 201, { post });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleSocialFeed(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const posts = listVisibleFeed(db, user.id);
    return sendJson(res, 200, { posts });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleLikeSocialPost(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const result = likePost(db, user.id, body.postId);
    await saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCommentSocialPost(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const result = commentOnPost(db, user.id, body.postId, body.text);
    await saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCopySocialPostToLog(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const meal = copyMealPostToLog(db, user.id, body.postId);
    if (body.mealType !== undefined) {
      if (typeof body.mealType !== "string" || body.mealType.trim().length === 0 || body.mealType.length > 40) {
        return sendJson(res, 400, { error: "Invalid mealType" });
      }
      meal.mealType = body.mealType.trim().toLowerCase();
    }
    await saveDb(db);
    return sendJson(res, 201, { meal });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const signedIn = login(db, body, authConfig);
    return sendJson(res, 200, {
      token: signedIn.token,
      user: sanitizeUser(signedIn)
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleLogout(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    return sendJson(res, 200, {
      message: "Logout successful on client side. Remove stored token."
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleAuthMe(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    return sendJson(res, 200, { user: sanitizeDbUser(user) });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetProfile(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const profile = getProfile(db, user.id);
    return sendJson(res, 200, { profile });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpdateProfile(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const profile = updateProfile(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 200, { profile });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpdateOnboardingProfile(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const profile = updateOnboardingProfile(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 200, { profile });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetNutritionTargets(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    return sendJson(res, 200, { targets: getNutritionTargets(db, user.id) });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateMeal(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const meal = addMeal(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { meal });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetMeals(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const date = url.searchParams.get("date");
    if (date && !isDateKey(date)) {
      return sendJson(res, 400, { error: "Invalid date. Expected YYYY-MM-DD" });
    }
    const meals = listMeals(db, user.id, date);
    return sendJson(res, 200, { meals });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateMealFromFoodItem(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const meal = addMealFromFoodItem(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { meal });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleListFoodItems(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const foodItems = listFoodItems(db, user.id, {
      query: url.searchParams.get("query") || "",
      filter: url.searchParams.get("filter") || ""
    });
    return sendJson(res, 200, { foodItems });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateFoodItem(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const foodItem = createFoodItem(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { foodItem });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleListMealTemplates(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    return sendJson(res, 200, { mealTemplates: listMealTemplates(db, user.id) });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateMealTemplate(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const mealTemplate = createMealTemplate(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { mealTemplate });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleAddMealTemplateToLog(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const meal = addMealTemplateToLog(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { meal });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateWorkout(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const workout = addWorkout(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 201, { workout });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetWorkouts(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const date = url.searchParams.get("date");
    if (date && !isDateKey(date)) {
      return sendJson(res, 400, { error: "Invalid date. Expected YYYY-MM-DD" });
    }
    const workouts = listWorkouts(db, user.id, date);
    return sendJson(res, 200, { workouts });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleDashboardSummary(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const selectedDate = getValidatedDateQuery(url);
    const summary = getDashboardSummary(db, user.id, selectedDate);
    return sendJson(res, 200, { summary });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetRecommendations(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const selectedDate = getValidatedDateQuery(url);
    const recommendations = await getDailyRecommendationsHybrid(db, user.id, selectedDate);
    return sendJson(res, 200, { recommendations });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetDailyCheckIn(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const selectedDate = getValidatedDateQuery(url);
    const checkIn = getDailyCheckIn(db, user.id, selectedDate);
    return sendJson(res, 200, { checkIn });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpsertDailyCheckIn(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    if (body.date && !isDateKey(body.date)) {
      return sendJson(res, 400, { error: "Invalid date. Expected YYYY-MM-DD" });
    }
    const checkIn = upsertDailyCheckIn(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 200, { checkIn });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleWorkoutRecommendation(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const selectedDate = getValidatedDateQuery(url);
    const recommendation = getWorkoutRecommendation(db, user.id, selectedDate);
    return sendJson(res, 200, { recommendation });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleSearchNutritionFoods(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const query = url.searchParams.get("query");
    if (query === null) {
      return sendJson(res, 400, { error: "Missing query parameter: query" });
    }
    const result = await searchFoods(query, {
      pageNumber: url.searchParams.get("page"),
      maxResults: url.searchParams.get("limit")
    });
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleGetReminderSettings(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const settings = getReminderSettings(db, user.id);
    await saveDb(db);
    return sendJson(res, 200, { settings });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpdateReminderSettings(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const settings = updateReminderSettings(db, user.id, body);
    await saveDb(db);
    return sendJson(res, 200, { settings });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleFollow(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const result = followUser(db, user.id, body.targetUserId);
    await saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUnfollow(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const result = unfollowUser(db, user.id, body.targetUserId);
    await saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleListFollowing(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const users = listFollowing(db, user.id);
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleListFollowers(req, res) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const users = listFollowers(db, user.id);
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleSearchUsers(req, res, url) {
  try {
    const db = await loadDb();
    const user = authUser(req, db);
    if (!user) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    const query = url.searchParams.get("query");
    if (query === null) {
      return sendJson(res, 400, { error: "Missing query parameter: query" });
    }
    const users = listUsersByQuery(db, user.id, query);
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function createServer(options = {}) {
  return http.createServer(async (req, res) => {
    try {
      withCors(res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }

      const url = parseUrl(req);
      const path = url.pathname;

      if (req.method === "GET" && path === "/health") {
        return sendJson(res, 200, {
          status: "ok",
          service: "ens492-month1-backend",
          dbProvider
        });
      }

      if (path === "/auth/signup") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleSignup(req, res);
      }
      if (path === "/auth/login") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleLogin(req, res);
      }
      if (path === "/auth/logout") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleLogout(req, res);
      }
      if (path === "/auth/me") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleAuthMe(req, res);
      }
      if (path === "/profile") {
        if (req.method === "GET") {
          return handleGetProfile(req, res);
        }
        if (req.method === "PUT") {
          return handleUpdateProfile(req, res);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/profile/onboarding") {
        if (req.method !== "PUT") {
          return sendMethodNotAllowed(res);
        }
        return handleUpdateOnboardingProfile(req, res);
      }
      if (path === "/nutrition/targets") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleGetNutritionTargets(req, res);
      }
      if (path === "/food-items") {
        if (req.method === "GET") {
          return handleListFoodItems(req, res, url);
        }
        if (req.method === "POST") {
          return handleCreateFoodItem(req, res);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/meals") {
        if (req.method === "POST") {
          return handleCreateMeal(req, res);
        }
        if (req.method === "GET") {
          return handleGetMeals(req, res, url);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/meals/from-food-item") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleCreateMealFromFoodItem(req, res);
      }
      if (path === "/meal-templates") {
        if (req.method === "GET") {
          return handleListMealTemplates(req, res);
        }
        if (req.method === "POST") {
          return handleCreateMealTemplate(req, res);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/meal-templates/add-to-log") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleAddMealTemplateToLog(req, res);
      }
      if (path === "/workouts") {
        if (req.method === "POST") {
          return handleCreateWorkout(req, res);
        }
        if (req.method === "GET") {
          return handleGetWorkouts(req, res, url);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/workouts/recommendation") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleWorkoutRecommendation(req, res, url);
      }
      if (path === "/dashboard/summary") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleDashboardSummary(req, res, url);
      }
      if (path === "/recommendations/daily") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleGetRecommendations(req, res, url);
      }
      if (path === "/coach/meal-suggestions") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleMealSuggestions(req, res, options);
      }
      if (path === "/coach/today-plan") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleTodayPlan(req, res, url);
      }
      if (path === "/coach/weekly-review") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleWeeklyReview(req, res, url, options);
      }
      if (path === "/check-ins/daily") {
        if (req.method === "GET") {
          return handleGetDailyCheckIn(req, res, url);
        }
        if (req.method === "POST") {
          return handleUpsertDailyCheckIn(req, res);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/nutrition/foods/search") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleSearchNutritionFoods(req, res, url);
      }
      if (path === "/reminders/settings") {
        if (req.method === "GET") {
          return handleGetReminderSettings(req, res);
        }
        if (req.method === "PUT") {
          return handleUpdateReminderSettings(req, res);
        }
        return sendMethodNotAllowed(res);
      }
      if (path === "/social/follow") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleFollow(req, res);
      }
      if (path === "/social/unfollow") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleUnfollow(req, res);
      }
      if (path === "/social/following") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleListFollowing(req, res);
      }
      if (path === "/social/followers") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleListFollowers(req, res);
      }
      if (path === "/social/posts") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleCreateSocialPost(req, res);
      }
      if (path === "/social/feed") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleSocialFeed(req, res);
      }
      if (path === "/social/posts/like") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleLikeSocialPost(req, res);
      }
      if (path === "/social/posts/comment") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleCommentSocialPost(req, res);
      }
      if (path === "/social/posts/copy-to-log") {
        if (req.method !== "POST") {
          return sendMethodNotAllowed(res);
        }
        return handleCopySocialPostToLog(req, res);
      }
      if (path === "/users") {
        if (req.method !== "GET") {
          return sendMethodNotAllowed(res);
        }
        return handleSearchUsers(req, res, url);
      }

      return sendNotFound(res);
    } catch (error) {
      return sendServiceError(res, error);
    }
  });
}

function startServer() {
  const server = createServer();
  server.listen(port, () => {
    console.log(`ENS492 Month1 backend running on http://localhost:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer
};
