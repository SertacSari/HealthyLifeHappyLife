const test = require("node:test");
const assert = require("node:assert/strict");
const { buildDailyRecommendations } = require("../src/services");

const TEST_DATE = "2026-05-08";

function createSummary(overrides = {}) {
  return {
    date: TEST_DATE,
    totalCaloriesIn: 0,
    totalCaloriesOut: 0,
    netCalories: 0,
    workoutMinutes: 0,
    mealsCount: 0,
    workoutsCount: 0,
    macros: { protein: 0, carbs: 0, fats: 0 },
    goals: { goalCalories: 2000, goalWorkoutsPerWeek: 3 },
    ...overrides
  };
}

function findTipByTitle(recommendations, title) {
  return recommendations.tips.find((tip) => tip.title === title);
}

test("daily recommendations return non-medical disclaimer and tips", () => {
  const recommendations = buildDailyRecommendations(
    createSummary({
      totalCaloriesIn: 350,
      workoutMinutes: 25,
      mealsCount: 1,
      workoutsCount: 1,
      macros: { protein: 15, carbs: 45, fats: 8 }
    })
  );

  assert.ok(recommendations.disclaimer.includes("does not provide medical advice"));
  assert.ok(Array.isArray(recommendations.tips));
  assert.ok(recommendations.tips.length > 0);
  assert.ok(recommendations.tips.length <= 4);

  const combinedTipsText = recommendations.tips.map((tip) => `${tip.title} ${tip.message}`).join(" ").toLowerCase();
  for (const blockedWord of ["diagnose", "diagnosis", "medication", "prescribe", "cure", "disease"]) {
    assert.equal(combinedTipsText.includes(blockedWord), false);
  }
});

test("recommendations cover rule boundaries", () => {
  const matrixCases = [
    {
      name: "no logs produce starter and workout prompts",
      summary: createSummary(),
      expects: ["No activity logs yet today", "No workout logged today"]
    },
    {
      name: "large calorie deficit triggers far-below-goal tip",
      summary: createSummary({ totalCaloriesIn: 200, mealsCount: 1, macros: { protein: 5, carbs: 20, fats: 6 } }),
      expects: ["Calorie intake is far below goal"]
    },
    {
      name: "moderate calorie deficit triggers below-goal tip",
      summary: createSummary({ totalCaloriesIn: 1650, mealsCount: 1, macros: { protein: 75, carbs: 160, fats: 50 } }),
      expects: ["Calorie intake is below goal"]
    },
    {
      name: "calorie surplus triggers above-goal tip",
      summary: createSummary({ totalCaloriesIn: 2300, mealsCount: 1, macros: { protein: 80, carbs: 250, fats: 70 } }),
      expects: ["Calorie intake is above goal"]
    },
    {
      name: "large calorie surplus triggers far-above-goal tip",
      summary: createSummary({ totalCaloriesIn: 2700, mealsCount: 1, macros: { protein: 110, carbs: 300, fats: 90 } }),
      expects: ["Calorie intake is far above goal"]
    },
    {
      name: "very low protein triggers low-protein alert",
      summary: createSummary({ totalCaloriesIn: 1500, mealsCount: 1, macros: { protein: 20, carbs: 230, fats: 35 } }),
      expects: ["Protein intake appears low"]
    },
    {
      name: "healthy protein triggers positive protein feedback",
      summary: createSummary({ totalCaloriesIn: 1900, mealsCount: 1, macros: { protein: 95, carbs: 180, fats: 55 } }),
      expects: ["Protein balance looks solid"]
    },
    {
      name: "very short workout triggers short-workout tip",
      summary: createSummary({ workoutMinutes: 10, workoutsCount: 1 }),
      expects: ["Very short workout day"]
    },
    {
      name: "moderate workout triggers maintenance tip",
      summary: createSummary({ workoutMinutes: 30, workoutsCount: 1 }),
      expects: ["Workout volume is moderate"]
    },
    {
      name: "long training adds recovery tip",
      summary: createSummary({ workoutMinutes: 95, workoutsCount: 2 }),
      expects: ["Recovery should be prioritized"]
    }
  ];

  for (const matrixCase of matrixCases) {
    const recommendations = buildDailyRecommendations(matrixCase.summary);
    for (const expectedTitle of matrixCase.expects) {
      assert.ok(
        findTipByTitle(recommendations, expectedTitle),
        `${matrixCase.name} expected tip "${expectedTitle}" but got ${JSON.stringify(recommendations.tips)}`
      );
    }
  }
});

test("recommendations omit personal identifiers", () => {
  const recommendations = buildDailyRecommendations(
    createSummary({
      totalCaloriesIn: 700,
      mealsCount: 1,
      macros: { protein: 40, carbs: 70, fats: 20 }
    })
  );

  const rendered = JSON.stringify(recommendations);
  assert.equal(rendered.includes("privacy-a@example.com"), false);
  assert.equal(rendered.includes("privacy-b@example.com"), false);
});
