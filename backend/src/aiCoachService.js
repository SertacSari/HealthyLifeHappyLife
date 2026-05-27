const { generateJsonWithOllama } = require("./ollamaClient");

const NON_MEDICAL_DISCLAIMER =
  "General wellness guidance only. This app does not provide medical advice, diagnosis, or treatment.";
const DEFAULT_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const DEFAULT_ITEMS = ["eggs", "oats", "yogurt", "chicken", "rice", "beans", "lentils", "tuna", "greens", "banana"];

const SAFETY_PATTERNS = [
  /\bdiagnos(e|is|ed|ing)\b/i,
  /\btreat(ment|ed|ing)?\b/i,
  /\bcure(d|s|ing)?\b/i,
  /\bprescrib(e|ed|ing)?\b/i,
  /\bmedication(s)?\b/i,
  /\bmedicine(s)?\b/i,
  /\bdisease(s)?\b/i,
  /\bdiabetes\b/i,
  /\bhypertension\b/i,
  /\bcholesterol\b/i,
  /\bsupplement(s)?\b/i,
  /\bfat\s*burner(s)?\b/i,
  /\bdetox\b/i,
  /\bcleanse\b/i,
  /\bfast(ing)?\b/i,
  /\bstarv(e|ing|ation)\b/i,
  /\bno[-\s]?carb(s)?\b/i,
  /\bzero[-\s]?carb(s)?\b/i,
  /\bunder\s*1[,]?200\s*calories\b/i,
  /\blose\s+\d+\s*(kg|kilos|kilograms|lb|lbs|pounds)\s+in\s+\d+\s*(day|days|week|weeks)\b/i
];

function roundNumber(value) {
  return Math.round(Number(value));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function asCleanString(value, maxLength = 220) {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : "";
}

function parseJsonResponse(content) {
  if (content && typeof content === "object") {
    return content;
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    return null;
  }
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return null;
  }
}

function containsUnsafeText(value) {
  if (typeof value !== "string") {
    return false;
  }
  return SAFETY_PATTERNS.some((pattern) => pattern.test(value));
}

function containsUnsafePayload(value) {
  if (typeof value === "string") {
    return containsUnsafeText(value);
  }
  if (Array.isArray(value)) {
    return value.some(containsUnsafePayload);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(containsUnsafePayload);
  }
  return false;
}

function uniqueStrings(values, max = 12) {
  const seen = new Set();
  const result = [];
  for (const value of values || []) {
    const text = typeof value === "string" ? value : value?.name;
    const cleaned = asCleanString(text, 80);
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
    if (result.length >= max) {
      break;
    }
  }
  return result;
}

function getContextItems(context = {}) {
  return uniqueStrings([
    ...(context.availableIngredients || []),
    ...(context.storeItems || []),
    ...(context.inventoryItems || []),
    ...(context.pantryItems || [])
  ]);
}

function normalizeIngredient(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ingredientAllowed(ingredient, allowedItems) {
  if (allowedItems.length === 0) {
    return true;
  }
  const normalizedIngredient = normalizeIngredient(ingredient);
  return allowedItems.some((item) => {
    const normalizedItem = normalizeIngredient(item);
    return normalizedIngredient === normalizedItem || normalizedIngredient.includes(normalizedItem);
  });
}

function validateMacros(macros, calories) {
  if (!macros || typeof macros !== "object") {
    return null;
  }
  const protein = roundNumber(macros.protein);
  const carbs = roundNumber(macros.carbs);
  const fats = roundNumber(macros.fats);
  if (![protein, carbs, fats].every((value) => Number.isInteger(value) && value >= 0)) {
    return null;
  }
  if (protein > 80 || carbs > 150 || fats > 60) {
    return null;
  }
  const macroCalories = protein * 4 + carbs * 4 + fats * 9;
  if (macroCalories < calories * 0.45 || macroCalories > calories * 1.75) {
    return null;
  }
  return { protein, carbs, fats };
}

function validateMealSuggestionPayload(payload, context = {}) {
  const parsed = parseJsonResponse(payload);
  if (!parsed || containsUnsafePayload(parsed)) {
    return null;
  }

  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  const allowedItems = getContextItems(context);
  const sanitized = suggestions
    .map((suggestion, index) => {
      const title = asCleanString(suggestion?.title, 90);
      const mealType = asCleanString(suggestion?.mealType || DEFAULT_MEAL_TYPES[index % DEFAULT_MEAL_TYPES.length], 30)
        .toLowerCase();
      const description = asCleanString(suggestion?.description, 240);
      const calories = roundNumber(suggestion?.calories);
      const macros = validateMacros(suggestion?.macros, calories);
      const ingredients = uniqueStrings(suggestion?.ingredients, 10);
      const rationale = asCleanString(suggestion?.rationale || "Balanced option based on your current context.", 180);

      if (!title || !description || !Number.isInteger(calories) || calories < 150 || calories > 900 || !macros) {
        return null;
      }
      if (ingredients.length === 0 || !ingredients.every((ingredient) => ingredientAllowed(ingredient, allowedItems))) {
        return null;
      }
      return { title, mealType, description, calories, macros, ingredients, rationale };
    })
    .filter(Boolean)
    .slice(0, 4);

  if (sanitized.length === 0) {
    return null;
  }

  return {
    disclaimer: NON_MEDICAL_DISCLAIMER,
    suggestions: sanitized,
    source: parsed.source || "llm"
  };
}

function fallbackMealSuggestions(context = {}) {
  const items = getContextItems(context);
  const selectedItems = (items.length ? items : DEFAULT_ITEMS).slice(0, 8);
  const goalCalories = Number(context?.goals?.goalCalories || context?.goalCalories || 2000);
  const mealCalories = Math.min(750, Math.max(350, Math.round(goalCalories / 4)));
  const suggestions = [0, 1, 2].map((offset) => {
    const first = selectedItems[offset % selectedItems.length];
    const second = selectedItems[(offset + 3) % selectedItems.length] || selectedItems[0];
    const third = selectedItems[(offset + 6) % selectedItems.length] || selectedItems[0];
    const calories = mealCalories + offset * 45;
    return {
      title: `${first} balanced ${DEFAULT_MEAL_TYPES[offset]}`,
      mealType: DEFAULT_MEAL_TYPES[offset],
      description: `Build a simple plate with ${first}, ${second}, and ${third}. Keep portions moderate and adjust seasoning to preference.`,
      calories,
      macros: {
        protein: Math.round(calories * 0.25 / 4),
        carbs: Math.round(calories * 0.45 / 4),
        fats: Math.round(calories * 0.3 / 9)
      },
      ingredients: uniqueStrings([first, second, third], 6),
      rationale: "Uses available foods and keeps the meal balanced without extreme restriction."
    };
  });

  return {
    disclaimer: NON_MEDICAL_DISCLAIMER,
    suggestions,
    source: "fallback"
  };
}

function buildMealPrompt(context) {
  const safeContext = {
    date: context?.date,
    goals: context?.goals || null,
    dietaryConstraints: context?.dietaryConstraints || [],
    allergies: context?.allergies || [],
    availableIngredients: getContextItems(context),
    recentMeals: uniqueStrings(context?.recentMeals || context?.meals || [], 8),
    remainingCalories: context?.remainingCalories
  };
  return [
    "You are the meal suggestion layer for HealthyLifeHappyLife.",
    "Return JSON only. Do not use markdown.",
    "Give non-medical wellness meal ideas only. No diagnosis, treatment, cure, medicine, supplement, detox, fasting, or extreme restriction claims.",
    "If availableIngredients are provided, every ingredient in each suggestion must come from that list.",
    'Required JSON shape: {"suggestions":[{"title":string,"mealType":"breakfast|lunch|dinner|snack","description":string,"calories":number,"macros":{"protein":number,"carbs":number,"fats":number},"ingredients":[string],"rationale":string}]}',
    "Keep each meal between 150 and 900 calories with plausible macros.",
    `Context: ${JSON.stringify(safeContext)}`
  ].join("\n");
}

async function generateMealSuggestions(userContext, options = {}) {
  const fallback = () => fallbackMealSuggestions(userContext);
  try {
    const prompt = buildMealPrompt(userContext || {});
    const llmClient = options.llmClient || generateJsonWithOllama;
    const raw = await llmClient(prompt, options);
    const validated = validateMealSuggestionPayload(raw, userContext || {});
    return validated || fallback();
  } catch (_error) {
    return fallback();
  }
}

function validateStringArray(values, maxItems = 5) {
  if (!Array.isArray(values)) {
    return null;
  }
  const strings = uniqueStrings(values, maxItems);
  if (strings.some(containsUnsafeText)) {
    return null;
  }
  return strings;
}

function validateWeeklySummaryPayload(payload) {
  const parsed = parseJsonResponse(payload);
  if (!parsed || containsUnsafePayload(parsed)) {
    return null;
  }
  const summary = asCleanString(parsed.summary, 420);
  const highlights = validateStringArray(parsed.highlights, 5);
  const risks = validateStringArray(parsed.risks || parsed.watchouts || [], 5);
  const nextWeekFocus = validateStringArray(parsed.nextWeekFocus, 5);
  if (!summary || !highlights || !risks || !nextWeekFocus) {
    return null;
  }

  const metrics = parsed.metrics && typeof parsed.metrics === "object" ? parsed.metrics : {};
  return {
    disclaimer: NON_MEDICAL_DISCLAIMER,
    summary,
    highlights,
    risks,
    nextWeekFocus,
    metrics: {
      avgCalories: isFiniteNumber(metrics.avgCalories) ? roundNumber(metrics.avgCalories) : null,
      workoutMinutes: isFiniteNumber(metrics.workoutMinutes) ? roundNumber(metrics.workoutMinutes) : null,
      workouts: isFiniteNumber(metrics.workouts) ? roundNumber(metrics.workouts) : null,
      proteinAvg: isFiniteNumber(metrics.proteinAvg) ? roundNumber(metrics.proteinAvg) : null
    },
    source: parsed.source || "llm"
  };
}

function fallbackWeeklyProgressSummary(context = {}) {
  const days = Array.isArray(context.days) ? context.days : [];
  const avgCalories = days.length
    ? Math.round(days.reduce((sum, day) => sum + Number(day.calories || day.totalCaloriesIn || 0), 0) / days.length)
    : null;
  const workoutMinutes = days.reduce((sum, day) => sum + Number(day.workoutMinutes || 0), 0);
  const workouts = days.reduce((sum, day) => sum + Number(day.workouts || day.workoutsCount || 0), 0);

  return {
    disclaimer: NON_MEDICAL_DISCLAIMER,
    summary: "This week is summarized from logged meals and workouts. Keep the focus on repeatable meals, realistic activity, and consistent tracking.",
    highlights: [
      days.length ? `${days.length} day(s) of progress data reviewed.` : "No weekly logs were available yet.",
      workouts > 0 ? `${workouts} workout(s) logged this week.` : "Workout consistency can be built with short planned sessions."
    ],
    risks: ["Avoid extreme calorie cuts or all-or-nothing goals when adjusting next week."],
    nextWeekFocus: ["Plan simple balanced meals.", "Schedule realistic workout blocks.", "Keep logging consistently."],
    metrics: {
      avgCalories,
      workoutMinutes,
      workouts,
      proteinAvg: null
    },
    source: "fallback"
  };
}

function buildWeeklyPrompt(context) {
  return [
    "You are the weekly review layer for HealthyLifeHappyLife.",
    "Return JSON only. Do not use markdown.",
    "Give non-medical wellness progress feedback only. No diagnosis, treatment, cure, medicine, supplement, detox, fasting, or extreme restriction claims.",
    'Required JSON shape: {"summary":string,"highlights":[string],"risks":[string],"nextWeekFocus":[string],"metrics":{"avgCalories":number,"workoutMinutes":number,"workouts":number,"proteinAvg":number}}',
    "Keep feedback concise, practical, and focused on sustainable habits.",
    `Context: ${JSON.stringify(context || {})}`
  ].join("\n");
}

async function generateWeeklyProgressSummary(context, options = {}) {
  try {
    const prompt = buildWeeklyPrompt(context || {});
    const llmClient = options.llmClient || generateJsonWithOllama;
    const raw = await llmClient(prompt, options);
    const validated = validateWeeklySummaryPayload(raw);
    return validated || fallbackWeeklyProgressSummary(context);
  } catch (_error) {
    return fallbackWeeklyProgressSummary(context);
  }
}

module.exports = {
  generateMealSuggestions,
  validateMealSuggestionPayload,
  fallbackMealSuggestions,
  generateWeeklyProgressSummary,
  validateWeeklySummaryPayload,
  fallbackWeeklyProgressSummary,
  parseJsonResponse,
  containsUnsafeText
};
