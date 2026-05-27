const test = require("node:test");
const assert = require("node:assert/strict");
const {
  signup,
  updateOnboardingProfile,
  getNutritionTargets,
  addMeal,
  listFoodItems,
  createMealTemplate,
  addMealTemplateToLog,
  addWorkout,
  upsertDailyCheckIn,
  getWorkoutRecommendation,
  getDailyRecommendations,
  getReminderSettings,
  updateReminderSettings,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
} = require("../src/services");
const { parseFoodDescription } = require("../src/fatsecretClient");
const { getSeedFoodItems } = require("../src/demoSeeds");

const authConfig = {
  jwtSecret: "unit-test-secret",
  tokenTtlSeconds: 3600
};
const TEST_DATE = "2026-05-08";

function createDb() {
  return {
    users: [],
    profiles: [],
    meals: [],
    workouts: [],
    reminders: [],
    follows: [],
    foodItems: getSeedFoodItems(),
    mealTemplates: [],
    dailyCheckIns: [],
    counters: {
      user: 1,
      meal: 1,
      workout: 1,
      foodItem: getSeedFoodItems().length + 1,
      mealTemplate: 1,
      dailyCheckIn: 1
    }
  };
}

function findTipByTitle(recommendations, title) {
  return recommendations.tips.find((tip) => tip.title === title);
}

test("reminder settings can be created and updated", () => {
  const db = createDb();
  const user = signup(db, { email: "u1@example.com", password: "StrongPass123", name: "U1" }, authConfig);
  const defaults = getReminderSettings(db, user.userId);
  assert.equal(defaults.enabled, false);
  assert.equal(defaults.reminderTime, "20:00");

  const updated = updateReminderSettings(db, user.userId, {
    enabled: true,
    reminderTime: "08:30",
    frequency: "weekdays"
  });
  assert.equal(updated.enabled, true);
  assert.equal(updated.reminderTime, "08:30");
  assert.equal(updated.frequency, "weekdays");
});

test("fatsecret food descriptions are parsed into meal macros", () => {
  const parsed = parseFoodDescription(
    "Per 100g - Calories: 195kcal | Fat: 7.72g | Carbs: 0.00g | Protein: 29.55g"
  );

  assert.equal(parsed.servingDescription, "Per 100g");
  assert.equal(parsed.calories, 195);
  assert.equal(parsed.protein, 29.55);
  assert.equal(parsed.carbs, 0);
  assert.equal(parsed.fats, 7.72);
});

test("onboarding profile calculates Mifflin-St Jeor TDEE and macro targets", () => {
  const db = createDb();
  const user = signup(db, { email: "targets@example.com", password: "StrongPass123", name: "Targets" }, authConfig);

  const profile = updateOnboardingProfile(db, user.userId, {
    age: 30,
    sex: "male",
    heightCm: 180,
    weightKg: 80,
    activityLevel: "moderately_active",
    goalType: "gain_muscle",
    dietPreference: "balanced",
    privacyPreference: "friends",
    restrictions: ["pork"],
    allergies: ["milk"]
  });
  const targets = getNutritionTargets(db, user.userId);

  assert.equal(profile.bmr, 1780);
  assert.equal(profile.tdee, 2759);
  assert.equal(profile.dailyCalorieTarget, 3059);
  assert.equal(profile.goalCalories, 3059);
  assert.equal(targets.proteinTarget, 144);
  assert.equal(targets.fatTarget, 85);
  assert.equal(targets.carbTarget, 430);
});

test("food item search supports query, category, diet tag, and allergy-safe filters", () => {
  const db = createDb();
  const user = signup(db, { email: "foods@example.com", password: "StrongPass123", name: "Foods" }, authConfig);
  updateOnboardingProfile(db, user.userId, {
    allergies: ["milk"]
  });

  const chicken = listFoodItems(db, user.userId, { query: "chicken" });
  assert.equal(chicken.length, 1);
  assert.equal(chicken[0].name, "Grilled Chicken Breast");

  const vegan = listFoodItems(db, user.userId, { filter: "vegan" });
  assert.ok(vegan.some((item) => item.name === "Lentil Soup"));

  const allergySafe = listFoodItems(db, user.userId, { filter: "allergy_safe" });
  assert.equal(allergySafe.some((item) => item.name === "Greek Yogurt"), false);
});

test("meal templates can be created from food items and added to meal log", () => {
  const db = createDb();
  const user = signup(db, { email: "templates@example.com", password: "StrongPass123", name: "Templates" }, authConfig);

  const template = createMealTemplate(db, user.userId, {
    name: "Chicken rice bowl",
    mealType: "lunch",
    items: [
      { foodItemId: 1, servingMultiplier: 1 },
      { foodItemId: 2, servingMultiplier: 1 }
    ]
  });
  assert.equal(template.totals.calories, 381);
  assert.equal(template.totals.protein, 36);

  const meal = addMealTemplateToLog(db, user.userId, {
    templateId: template.id,
    loggedAt: `${TEST_DATE}T12:30:00.000Z`
  });
  assert.equal(meal.name, "Chicken rice bowl");
  assert.equal(meal.mealType, "lunch");
  assert.equal(meal.calories, 381);
  assert.equal(db.meals.length, 1);
});

test("daily check-in influences workout recommendation", () => {
  const db = createDb();
  const user = signup(db, { email: "checkin@example.com", password: "StrongPass123", name: "Checkin" }, authConfig);
  upsertDailyCheckIn(db, user.userId, {
    date: TEST_DATE,
    energyLevel: 2,
    soreness: 4,
    sleepHours: 5.5
  });

  const recommendation = getWorkoutRecommendation(db, user.userId, TEST_DATE);
  assert.equal(recommendation.workoutType, "recovery");
  assert.equal(recommendation.intensity, "low");
});

test("daily recommendations return non-medical disclaimer and tips", () => {
  const db = createDb();
  const user = signup(db, { email: "u2@example.com", password: "StrongPass123", name: "U2" }, authConfig);
  addMeal(db, user.userId, {
    name: "Oatmeal",
    calories: 350,
    protein: 15,
    carbs: 45,
    fats: 8,
    loggedAt: `${TEST_DATE}T08:30:00.000Z`
  });
  addWorkout(db, user.userId, {
    name: "Walk",
    durationMinutes: 25,
    caloriesBurned: 120,
    loggedAt: `${TEST_DATE}T11:00:00.000Z`
  });

  const recommendations = getDailyRecommendations(db, user.userId, TEST_DATE);
  assert.ok(recommendations.disclaimer.includes("does not provide medical advice"));
  assert.ok(Array.isArray(recommendations.tips));
  assert.ok(recommendations.tips.length > 0);
  assert.ok(recommendations.tips.length <= 4);
  const combinedTipsText = recommendations.tips.map((tip) => `${tip.title} ${tip.message}`).join(" ").toLowerCase();
  for (const blockedWord of ["diagnose", "diagnosis", "medication", "prescribe", "cure", "disease"]) {
    assert.equal(combinedTipsText.includes(blockedWord), false);
  }
});

test("follow and unfollow flow", () => {
  const db = createDb();
  const first = signup(db, { email: "u3@example.com", password: "StrongPass123", name: "U3" }, authConfig);
  const second = signup(db, { email: "u4@example.com", password: "StrongPass123", name: "U4" }, authConfig);

  followUser(db, first.userId, second.userId);
  const following = listFollowing(db, first.userId);
  const followers = listFollowers(db, second.userId);
  assert.equal(following.length, 1);
  assert.equal(followers.length, 1);

  unfollowUser(db, first.userId, second.userId);
  const followingAfter = listFollowing(db, first.userId);
  assert.equal(followingAfter.length, 0);
});

test("recommendations: edge-case matrix for rule boundaries", () => {
  const matrixCases = [
    {
      name: "no logs produce starter and workout prompts",
      seed(db, userId) {},
      expects: ["No activity logs yet today", "No workout logged today"]
    },
    {
      name: "large calorie deficit triggers far-below-goal tip",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "Small snack",
          calories: 200,
          protein: 5,
          carbs: 20,
          fats: 6,
          loggedAt: `${TEST_DATE}T09:00:00.000Z`
        });
      },
      expects: ["Calorie intake is far below goal"]
    },
    {
      name: "moderate calorie deficit triggers below-goal tip",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "Balanced meal",
          calories: 1650,
          protein: 75,
          carbs: 160,
          fats: 50,
          loggedAt: `${TEST_DATE}T12:00:00.000Z`
        });
      },
      expects: ["Calorie intake is below goal"]
    },
    {
      name: "calorie surplus triggers above-goal tip",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "Large meal",
          calories: 2300,
          protein: 80,
          carbs: 250,
          fats: 70,
          loggedAt: `${TEST_DATE}T13:00:00.000Z`
        });
      },
      expects: ["Calorie intake is above goal"]
    },
    {
      name: "large calorie surplus triggers far-above-goal tip",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "Large surplus",
          calories: 2700,
          protein: 110,
          carbs: 300,
          fats: 90,
          loggedAt: `${TEST_DATE}T13:00:00.000Z`
        });
      },
      expects: ["Calorie intake is far above goal"]
    },
    {
      name: "very low protein triggers low-protein alert",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "Mostly carbs",
          calories: 1500,
          protein: 20,
          carbs: 230,
          fats: 35,
          loggedAt: `${TEST_DATE}T10:30:00.000Z`
        });
      },
      expects: ["Protein intake appears low"]
    },
    {
      name: "healthy protein triggers positive protein feedback",
      seed(db, userId) {
        addMeal(db, userId, {
          name: "High protein plan",
          calories: 1900,
          protein: 95,
          carbs: 180,
          fats: 55,
          loggedAt: `${TEST_DATE}T12:00:00.000Z`
        });
      },
      expects: ["Protein balance looks solid"]
    },
    {
      name: "very short workout triggers short-workout tip",
      seed(db, userId) {
        addWorkout(db, userId, {
          name: "Quick walk",
          durationMinutes: 10,
          caloriesBurned: 40,
          loggedAt: `${TEST_DATE}T18:00:00.000Z`
        });
      },
      expects: ["Very short workout day"]
    },
    {
      name: "moderate workout triggers maintenance tip",
      seed(db, userId) {
        addWorkout(db, userId, {
          name: "Jogging",
          durationMinutes: 30,
          caloriesBurned: 200,
          loggedAt: `${TEST_DATE}T18:00:00.000Z`
        });
      },
      expects: ["Workout volume is moderate"]
    },
    {
      name: "long multi-session training adds recovery tip",
      seed(db, userId) {
        addWorkout(db, userId, {
          name: "Morning run",
          durationMinutes: 50,
          caloriesBurned: 420,
          loggedAt: `${TEST_DATE}T06:30:00.000Z`
        });
        addWorkout(db, userId, {
          name: "Evening gym",
          durationMinutes: 45,
          caloriesBurned: 350,
          loggedAt: `${TEST_DATE}T18:00:00.000Z`
        });
      },
      expects: ["Recovery should be prioritized"]
    }
  ];

  for (const matrixCase of matrixCases) {
    const db = createDb();
    const user = signup(
      db,
      { email: `${matrixCase.name.replace(/\s+/g, "-")}@example.com`, password: "StrongPass123", name: "Matrix" },
      authConfig
    );
    matrixCase.seed(db, user.userId);
    const recommendations = getDailyRecommendations(db, user.userId, TEST_DATE);
    for (const expectedTitle of matrixCase.expects) {
      assert.ok(
        findTipByTitle(recommendations, expectedTitle),
        `${matrixCase.name} expected tip "${expectedTitle}" but got ${JSON.stringify(recommendations.tips)}`
      );
    }
  }
});

test("recommendations return 404 for unknown user", () => {
  const db = createDb();
  assert.throws(
    () => getDailyRecommendations(db, 404, TEST_DATE),
    (error) => error && error.status === 404 && error.message === "User not found"
  );
});

test("privacy check: social payloads omit auth secrets and recommendations omit personal identifiers", () => {
  const db = createDb();
  const first = signup(db, { email: "privacy-a@example.com", password: "StrongPass123", name: "A" }, authConfig);
  const second = signup(db, { email: "privacy-b@example.com", password: "StrongPass123", name: "B" }, authConfig);
  followUser(db, first.userId, second.userId);

  const following = listFollowing(db, first.userId);
  const followers = listFollowers(db, second.userId);
  for (const record of [...following, ...followers]) {
    assert.equal("passwordHash" in record, false);
    assert.equal("passwordSalt" in record, false);
  }

  addMeal(db, first.userId, {
    name: "Lunch",
    calories: 700,
    protein: 40,
    carbs: 70,
    fats: 20,
    loggedAt: `${TEST_DATE}T12:00:00.000Z`
  });
  const recommendations = getDailyRecommendations(db, first.userId, TEST_DATE);
  const rendered = JSON.stringify(recommendations);
  assert.equal(rendered.includes("privacy-a@example.com"), false);
  assert.equal(rendered.includes("privacy-b@example.com"), false);
});
