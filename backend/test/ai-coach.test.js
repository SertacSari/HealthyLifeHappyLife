const test = require("node:test");
const assert = require("node:assert/strict");
const {
  generateMealSuggestions,
  validateMealSuggestionPayload,
  fallbackMealSuggestions,
  buildCoachTodayPlan,
  generateWeeklyProgressSummary,
  validateWeeklySummaryPayload
} = require("../src/aiCoachService");

const context = {
  date: "2026-05-25",
  goals: {
    goalCalories: 2200
  },
  availableIngredients: ["oats", "yogurt", "banana", "chicken", "rice", "greens"],
  dietaryConstraints: ["balanced"],
  recentMeals: ["eggs", "lentils"]
};

test("meal suggestions accept valid JSON from injected LLM", async () => {
  const result = await generateMealSuggestions(context, {
    llmClient: async () =>
      JSON.stringify({
        suggestions: [
          {
            title: "Yogurt oat bowl",
            mealType: "breakfast",
            description: "Combine oats, yogurt, and banana for a balanced morning meal.",
            calories: 430,
            macros: { protein: 24, carbs: 58, fats: 12 },
            ingredients: ["oats", "yogurt", "banana"],
            rationale: "Uses available foods and balances protein with carbohydrates."
          }
        ]
      })
  });

  assert.equal(result.source, "llm");
  assert.equal(result.suggestions.length, 1);
  assert.equal(result.suggestions[0].title, "Yogurt oat bowl");
  assert.deepEqual(result.suggestions[0].macros, { protein: 24, carbs: 58, fats: 12 });
});

test("meal suggestions fall back on invalid JSON", async () => {
  const result = await generateMealSuggestions(context, {
    llmClient: async () => "not json"
  });

  assert.equal(result.source, "fallback");
  assert.equal(result.suggestions.length, 3);
  assert.ok(result.suggestions[0].ingredients.every((ingredient) => context.availableIngredients.includes(ingredient)));
});

test("meal suggestions fall back on unsafe medical or extreme text", async () => {
  const result = await generateMealSuggestions(context, {
    llmClient: async () =>
      JSON.stringify({
        suggestions: [
          {
            title: "Detox fasting bowl",
            mealType: "lunch",
            description: "This will treat disease and keep you under 1200 calories.",
            calories: 250,
            macros: { protein: 20, carbs: 25, fats: 7 },
            ingredients: ["chicken", "rice", "greens"],
            rationale: "Extreme restriction works fast."
          }
        ]
      })
  });

  assert.equal(result.source, "fallback");
  assert.equal(JSON.stringify(result).includes("treat disease"), false);
});

test("meal validation rejects ingredients outside constrained context", () => {
  const validShapeUnknownIngredient = {
    suggestions: [
      {
        title: "Salmon rice bowl",
        mealType: "dinner",
        description: "A moderate dinner plate.",
        calories: 520,
        macros: { protein: 35, carbs: 62, fats: 14 },
        ingredients: ["salmon", "rice", "greens"],
        rationale: "Balanced protein and carbs."
      }
    ]
  };

  assert.equal(validateMealSuggestionPayload(validShapeUnknownIngredient, context), null);
});

test("today plan combines targets, summary, mode, and workout reason", () => {
  const plan = buildCoachTodayPlan({
    date: "2026-05-25",
    coachMode: "budget",
    summary: {
      totalCaloriesIn: 700,
      mealsCount: 1,
      workoutsCount: 0,
      macros: { protein: 35 },
      goals: { goalCalories: 2200 }
    },
    targets: {
      dailyCalorieTarget: 2200,
      proteinTarget: 150
    },
    availableIngredients: ["eggs", "rice", "lentils"],
    checkIn: { energyLevel: 2, soreness: 3 },
    workoutRecommendation: {
      title: "Recovery-focused movement",
      workoutType: "recovery",
      durationMinutes: 20,
      intensity: "low",
      reason: "Daily check-in suggests lower readiness today."
    }
  });

  assert.equal(plan.mode, "budget");
  assert.equal(plan.summary.caloriesRemaining, 1500);
  assert.equal(plan.summary.proteinRemaining, 115);
  assert.equal(plan.workout.title, "Recovery-focused movement");
  assert.ok(plan.nextMeal.reason.includes("budget student meal"));
  assert.ok(plan.nextMeal.fitScore >= 0 && plan.nextMeal.fitScore <= 100);
});

test("weekly summary validation accepts safe progress JSON", () => {
  const validated = validateWeeklySummaryPayload({
    summary: "You logged several meals and built a useful baseline for next week.",
    highlights: ["Meals were tracked on most days.", "Workout minutes increased."],
    risks: ["Late meals may make planning harder."],
    nextWeekFocus: ["Prepare two simple lunches.", "Schedule three walks."],
    metrics: {
      avgCalories: 2075.4,
      workoutMinutes: 125,
      workouts: 3,
      proteinAvg: 82.8
    }
  });

  assert.equal(validated.source, "llm");
  assert.equal(validated.metrics.avgCalories, 2075);
  assert.deepEqual(validated.nextWeekFocus, ["Prepare two simple lunches.", "Schedule three walks."]);
});

test("weekly summary falls back when injected LLM is unsafe", async () => {
  const result = await generateWeeklyProgressSummary(
    {
      days: [
        { calories: 2000, workoutMinutes: 30, workouts: 1 },
        { calories: 2200, workoutMinutes: 45, workouts: 1 }
      ]
    },
    {
      llmClient: async () =>
        JSON.stringify({
          summary: "Use supplements to cure fatigue.",
          highlights: ["Fast progress."],
          risks: ["Disease risk."],
          nextWeekFocus: ["Detox."],
          metrics: { avgCalories: 2100, workoutMinutes: 75, workouts: 2, proteinAvg: 80 }
        })
    }
  );

  assert.equal(result.source, "fallback");
  assert.equal(result.metrics.avgCalories, 2100);
  assert.equal(result.metrics.workouts, 2);
});

test("fallback meal suggestions are deterministic", () => {
  assert.deepEqual(fallbackMealSuggestions(context), fallbackMealSuggestions(context));
});
