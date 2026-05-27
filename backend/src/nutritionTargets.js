const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  light: 1.375,
  moderately_active: 1.55,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const GOAL_CALORIE_ADJUSTMENTS = {
  lose_weight: -500,
  fat_loss: -500,
  lose_fat: -500,
  maintain: 0,
  maintenance: 0,
  gain_muscle: 300,
  muscle_gain: 300,
  gain_weight: 300
};

function normalizeSex(value) {
  if (typeof value !== "string") {
    return "unspecified";
  }
  const normalized = value.trim().toLowerCase();
  if (["male", "man", "m"].includes(normalized)) {
    return "male";
  }
  if (["female", "woman", "f"].includes(normalized)) {
    return "female";
  }
  return normalized || "unspecified";
}

function calculateBmr({ age, sex, gender, heightCm, weightKg }) {
  const sexValue = normalizeSex(sex || gender);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sexValue === "male") {
    return Math.round(base + 5);
  }
  if (sexValue === "female") {
    return Math.round(base - 161);
  }
  return Math.round(base - 78);
}

function calculateNutritionTargets(input) {
  const bmr = calculateBmr(input);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] || ACTIVITY_MULTIPLIERS.sedentary;
  const tdee = Math.round(bmr * multiplier);
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[input.goalType] ?? 0;
  const dailyCalorieTarget = Math.max(1200, Math.round(tdee + adjustment));
  const goalType = input.goalType || "maintain";
  const proteinMultiplier = ["gain_muscle", "muscle_gain", "gain_weight"].includes(goalType) ? 1.8 : 1.6;
  const proteinTarget = Math.round(input.weightKg * proteinMultiplier);
  const fatTarget = Math.round((dailyCalorieTarget * 0.25) / 9);
  const carbTarget = Math.max(0, Math.round((dailyCalorieTarget - proteinTarget * 4 - fatTarget * 9) / 4));

  return {
    bmr,
    tdee,
    dailyCalorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget
  };
}

module.exports = {
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_ADJUSTMENTS,
  calculateBmr,
  calculateNutritionTargets,
  normalizeSex
};
