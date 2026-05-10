export type User = {
  id: number;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Profile = {
  userId: number;
  name: string;
  goalCalories: number;
  goalWorkoutsPerWeek: number;
  waterGoalMl: number;
  heightCm: number;
  onboardingCompleted: boolean;
  birthYear: number;
  gender: string;
  activityLevel: string;
  updatedAt: string;
};

export type Meal = {
  id: number;
  userId: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  loggedAt: string;
};

export type Workout = {
  id: number;
  userId: number;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  loggedAt: string;
};

export type DashboardSummary = {
  date: string;
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  netCalories: number;
  workoutMinutes: number;
  mealsCount: number;
  workoutsCount: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  goals: {
    goalCalories: number;
    goalWorkoutsPerWeek: number;
  } | null;
};

export type LogoutResponse = {
  message: string;
};

export type ReminderSettings = {
  userId: number;
  enabled: boolean;
  reminderTime: string;
  frequency: "daily" | "weekdays" | "custom";
  updatedAt: string;
};

export type RecommendationTip = {
  area: "nutrition" | "workout";
  title: string;
  message: string;
};

export type DailyRecommendations = {
  date: string;
  disclaimer: string;
  tips: RecommendationTip[];
};
