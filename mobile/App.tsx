import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  API_URL,
  addMealTemplateToLog,
  checkBackend as pingBackend,
  createMeal,
  createMealFromFoodItem,
  createMealTemplate,
  createSocialPost,
  getDailyRecommendations,
  getCoachMealSuggestions,
  getCoachWeeklyReview,
  getDailyCheckIn,
  getNutritionTargets,
  getWorkoutRecommendation,
  createWorkout,
  getProfile,
  getReminderSettings,
  getMe,
  getSummary,
  getSocialFeed,
  copySocialPostToLog,
  likeSocialPost,
  listFoodItems,
  listMealTemplates,
  listMeals,
  listWorkouts,
  login,
  logout,
  searchNutritionFoods,
  signup,
  updateOnboardingProfile,
  updateReminderSettings,
  updateProfile,
  upsertDailyCheckIn
} from "./src/api";
import type {
  ActivityLevel,
  CoachWeeklyReview,
  DailyRecommendations,
  DashboardSummary,
  FoodItem,
  GoalType,
  Meal,
  MealTemplate,
  NutritionFood,
  NutritionTargets,
  PrivacyPreference,
  Profile,
  ReminderSettings,
  SocialPost,
  Workout,
  WorkoutRecommendation
} from "./src/types";

type Tab = "dashboard" | "meals" | "library" | "templates" | "workouts" | "profile" | "coach" | "social" | "weekly";
type ReminderFrequency = ReminderSettings["frequency"];
type OnboardingData = {
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  activityLevel: string;
  goalType: string;
  dietPreference: string;
  privacyPreference: string;
  restrictions: string;
};
type CoachSuggestion = {
  title: string;
  body: string;
  reason: string;
  source: "rules" | "llm" | "fallback" | "local";
  action: "meal" | "workout" | "save";
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
};

const REMINDER_FREQUENCIES: ReminderFrequency[] = ["daily", "weekdays", "custom"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not"];
const ACTIVITY_LEVELS = ["Low", "Moderate", "High"];
const GOAL_TYPES = ["Lose fat", "Maintain", "Gain muscle"];
const DIET_PREFERENCES = ["Balanced", "High protein", "Vegetarian", "Low carb"];
const PRIVACY_PREFERENCES = ["Private", "Friends", "Public"];
const LIBRARY_FILTERS = ["All", "High protein", "Lower calorie", "Carb source"];
const HUNGER_LEVELS = ["Low", "Medium", "High"];
const ENERGY_LEVELS = ["Low", "Ok", "High"];
const SORENESS_LEVELS = ["None", "Light", "Sore"];
const ONBOARDING_STEPS = ["Basics", "Goals", "Privacy"];
const QUICK_HEIGHTS = ["160", "170", "180", "190"];
const QUICK_WEIGHTS = ["60", "70", "80", "90"];
const QUICK_CALORIE_TARGETS = ["1800", "2200", "2600", "3000"];
const QUICK_SLEEP_HOURS = ["5", "6", "7", "8"];
const QUICK_WORKOUT_DURATIONS = ["20", "30", "45", "60"];
const QUICK_WORKOUT_CALORIES = ["150", "250", "350", "500"];
const QUICK_COACH_TIMES = ["10", "20", "30", "45"];
const COACH_BUDGETS = ["Low", "Medium", "Flexible"];
const INGREDIENT_CHIPS = ["eggs", "yogurt", "chicken", "rice", "spinach", "beans", "tuna", "oats"];
const WORKOUT_EXERCISES = [
  { name: "Squat", emoji: "🏋️", type: "Strength", cue: "Rooted strength", defaultKg: "40", defaultReps: "8", defaultTries: "3" },
  { name: "Bench Press", emoji: "💪", type: "Strength", cue: "Strong push", defaultKg: "30", defaultReps: "8", defaultTries: "3" },
  { name: "Deadlift", emoji: "⛰️", type: "Strength", cue: "Mountain pull", defaultKg: "50", defaultReps: "5", defaultTries: "3" },
  { name: "Row", emoji: "🚣", type: "Strength", cue: "Bosphorus rhythm", defaultKg: "25", defaultReps: "10", defaultTries: "3" },
  { name: "Hill Walk", emoji: "🌿", type: "Recovery", cue: "Yayla tempo", defaultKg: "0", defaultReps: "30", defaultTries: "1" },
  { name: "Plank", emoji: "🧘", type: "Core", cue: "Quiet focus", defaultKg: "0", defaultReps: "45", defaultTries: "3" }
];
const QUICK_MEALS = [
  { name: "Chicken Bowl", calories: "650", protein: "45", carbs: "50", fats: "20" },
  { name: "Greek Yogurt Bowl", calories: "380", protein: "32", carbs: "42", fats: "8" },
  { name: "Menemen", calories: "420", protein: "24", carbs: "18", fats: "28" },
  { name: "Mercimek Corbasi", calories: "260", protein: "14", carbs: "38", fats: "6" },
  { name: "Tavuk Sis", calories: "520", protein: "48", carbs: "35", fats: "18" },
  { name: "Bulgur Pilavi", calories: "330", protein: "9", carbs: "62", fats: "6" }
];
const DEMO_EMAIL = "mvp@example.com";
const DEMO_PASSWORD = "StrongPass123";
const DEMO_NAME = "MVP User";
const PRIMARY_NAV: Array<{ value: Tab; label: string; icon: string }> = [
  { value: "dashboard", label: "Home", icon: "H" },
  { value: "meals", label: "Meals", icon: "M" },
  { value: "workouts", label: "Workout", icon: "W" },
  { value: "coach", label: "Coach", icon: "C" },
  { value: "profile", label: "Profile", icon: "P" }
];
const SECONDARY_NAV: Array<{ value: Tab; label: string }> = [
  { value: "library", label: "Library" },
  { value: "templates", label: "Templates" },
  { value: "social", label: "Social" },
  { value: "weekly", label: "Weekly" }
];

const DEFAULT_ONBOARDING: OnboardingData = {
  age: "",
  gender: "Prefer not",
  heightCm: "",
  weightKg: "",
  activityLevel: "Moderate",
  goalType: "Maintain",
  dietPreference: "Balanced",
  privacyPreference: "Private",
  restrictions: ""
};

function formatReminderFrequency(value: ReminderFrequency) {
  if (value === "weekdays") {
    return "Weekdays";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loggedAtForDate(date: string) {
  return `${date}T12:00:00.000Z`;
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function formatMetric(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }
  return `${Math.round(value)}${suffix}`;
}

function formatSourceLabel(value?: string) {
  if (!value) {
    return "Rules";
  }
  if (value === "llm") {
    return "AI Coach";
  }
  if (value === "fallback") {
    return "Fallback";
  }
  if (value === "local") {
    return "On-device";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isOnboardingComplete(data: OnboardingData) {
  return Boolean(data.age && data.heightCm && data.weightKg && data.activityLevel && data.goalType);
}

function mapActivityLevel(value: string): ActivityLevel {
  if (value === "High") {
    return "active";
  }
  if (value === "Low") {
    return "lightly_active";
  }
  return "moderately_active";
}

function mapGoalType(value: string): GoalType {
  if (value === "Lose fat") {
    return "lose_fat";
  }
  if (value === "Gain muscle") {
    return "gain_muscle";
  }
  return "maintain";
}

function mapGender(value: string): Profile["gender"] {
  if (value === "Female") {
    return "female";
  }
  if (value === "Male") {
    return "male";
  }
  return "other";
}

function mapPrivacyPreference(value: string): PrivacyPreference {
  if (value === "Friends") {
    return "friends";
  }
  if (value === "Public") {
    return "public";
  }
  return "private";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function energyLabelToNumber(value: string) {
  if (value === "Low") {
    return 2;
  }
  if (value === "High") {
    return 4;
  }
  return 3;
}

function energyNumberToLabel(value?: number) {
  if (value === undefined) {
    return "Ok";
  }
  if (value <= 2) {
    return "Low";
  }
  if (value >= 4) {
    return "High";
  }
  return "Ok";
}

function sorenessLabelToNumber(value: string) {
  if (value === "Sore") {
    return 4;
  }
  if (value === "Light") {
    return 2;
  }
  return 1;
}

function sorenessNumberToLabel(value?: number) {
  if (value === undefined) {
    return "Light";
  }
  if (value >= 4) {
    return "Sore";
  }
  if (value <= 1) {
    return "None";
  }
  return "Light";
}

function estimateNutritionTargets(
  profile: Profile | null,
  summary: DashboardSummary | null,
  onboarding: OnboardingData,
  nutritionTargets: NutritionTargets | null
) {
  if (
    nutritionTargets?.dailyCalorieTarget ||
    nutritionTargets?.proteinTarget ||
    nutritionTargets?.carbTarget ||
    nutritionTargets?.fatTarget
  ) {
    return {
      calories: nutritionTargets.dailyCalorieTarget || summary?.goals?.goalCalories || profile?.goalCalories || 0,
      protein: nutritionTargets.proteinTarget || 0,
      carbs: nutritionTargets.carbTarget || 0,
      fats: nutritionTargets.fatTarget || 0,
      workouts: summary?.goals?.goalWorkoutsPerWeek || profile?.goalWorkoutsPerWeek || 0,
      source: "API"
    };
  }

  const goalCalories = summary?.goals?.goalCalories || profile?.goalCalories || 0;
  if (!goalCalories) {
    return null;
  }

  const weightKg = toNumber(onboarding.weightKg, 75);
  const proteinMultiplier = onboarding.goalType === "Gain muscle" ? 1.8 : onboarding.goalType === "Lose fat" ? 1.6 : 1.4;
  const protein = Math.round(weightKg * proteinMultiplier);
  const fats = Math.round((goalCalories * 0.28) / 9);
  const carbs = Math.max(0, Math.round((goalCalories - protein * 4 - fats * 9) / 4));

  return {
    calories: goalCalories,
    protein,
    carbs,
    fats,
    workouts: summary?.goals?.goalWorkoutsPerWeek || profile?.goalWorkoutsPerWeek || 0,
    source: "Local estimate"
  };
}

export default function App() {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [name, setName] = useState(DEMO_NAME);

  const [token, setToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState("Ready");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [activeDate, setActiveDate] = useState(todayKey());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recommendations, setRecommendations] = useState<DailyRecommendations | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [workoutRecommendation, setWorkoutRecommendation] = useState<WorkoutRecommendation | null>(null);

  const [mealName, setMealName] = useState("Chicken Bowl");
  const [mealCalories, setMealCalories] = useState("650");
  const [mealProtein, setMealProtein] = useState("45");
  const [mealCarbs, setMealCarbs] = useState("50");
  const [mealFats, setMealFats] = useState("20");
  const [foodSearchQuery, setFoodSearchQuery] = useState("chicken breast");
  const [foodSearchResults, setFoodSearchResults] = useState<NutritionFood[]>([]);
  const [libraryQuery, setLibraryQuery] = useState("greek yogurt");
  const [libraryFilter, setLibraryFilter] = useState("All");
  const [libraryFoods, setLibraryFoods] = useState<FoodItem[]>([]);

  const [workoutName, setWorkoutName] = useState("Squat");
  const [workoutKg, setWorkoutKg] = useState("40");
  const [workoutReps, setWorkoutReps] = useState("8");
  const [workoutTries, setWorkoutTries] = useState("3");
  const [workoutDuration, setWorkoutDuration] = useState("60");
  const [workoutCalories, setWorkoutCalories] = useState("350");

  const [profileName, setProfileName] = useState("");
  const [goalCalories, setGoalCalories] = useState("2200");
  const [goalWorkouts, setGoalWorkouts] = useState("4");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>("daily");
  const [onboarding, setOnboarding] = useState<OnboardingData>(DEFAULT_ONBOARDING);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [checkInEnergy, setCheckInEnergy] = useState("Ok");
  const [checkInSoreness, setCheckInSoreness] = useState("Light");
  const [checkInSleep, setCheckInSleep] = useState("7");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInSaved, setCheckInSaved] = useState(false);
  const [coachTimeAvailable, setCoachTimeAvailable] = useState("20");
  const [coachHunger, setCoachHunger] = useState("Medium");
  const [coachBudget, setCoachBudget] = useState("Medium");
  const [coachIngredients, setCoachIngredients] = useState("eggs, spinach, rice");
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestion[]>([]);
  const [savedCoachPlan, setSavedCoachPlan] = useState("");
  const [weeklyReview, setWeeklyReview] = useState<CoachWeeklyReview | null>(null);
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [templateName, setTemplateName] = useState("Demo Protein Meal");
  const [templateMealType, setTemplateMealType] = useState("lunch");

  async function checkBackend() {
    try {
      setStatus("Checking backend...");
      const health = await pingBackend();
      setStatus(
        `Backend reachable: ${health.service}${health.dbProvider ? ` (db: ${health.dbProvider})` : ""}`
      );
    } catch (error) {
      const message = String(error);
      setStatus(message);
      Alert.alert("Backend Connection Problem", message);
    }
  }

  function useDemoAccount() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setName(DEMO_NAME);
    setStatus("Demo account filled. Tap Login.");
  }

  async function hydrateApp(nextToken: string, nextDate = activeDate) {
    setStatus("Loading app data...");
    const [
      nextUser,
      nextProfile,
      nextSummary,
      nextMeals,
      nextWorkouts,
      nextRecommendations,
      nextReminderSettings,
      nextNutritionTargets,
      nextDailyCheckIn,
      nextWorkoutRecommendation
    ] =
      await Promise.all([
      getMe(nextToken),
      getProfile(nextToken),
      getSummary(nextToken, nextDate),
      listMeals(nextToken, nextDate),
      listWorkouts(nextToken, nextDate),
      getDailyRecommendations(nextToken, nextDate),
      getReminderSettings(nextToken),
      getNutritionTargets(nextToken).catch(() => null),
      getDailyCheckIn(nextToken, nextDate).catch(() => null),
      getWorkoutRecommendation(nextToken, nextDate).catch(() => null)
    ]);

    setUserEmail(nextUser.email);
    setProfile(nextProfile);
    setProfileName(nextProfile.name);
    setGoalCalories(String(nextProfile.goalCalories));
    setGoalWorkouts(String(nextProfile.goalWorkoutsPerWeek));
    setSummary(nextSummary);
    setMeals(nextMeals);
    setWorkouts(nextWorkouts);
    setRecommendations(nextRecommendations);
    setReminderSettings(nextReminderSettings);
    setNutritionTargets(nextNutritionTargets);
    setWorkoutRecommendation(nextWorkoutRecommendation);
    setReminderEnabled(nextReminderSettings.enabled);
    setReminderTime(nextReminderSettings.reminderTime);
    setReminderFrequency(nextReminderSettings.frequency);
    if (nextDailyCheckIn) {
      setCheckInEnergy(energyNumberToLabel(nextDailyCheckIn.energyLevel));
      setCheckInSoreness(sorenessNumberToLabel(nextDailyCheckIn.soreness));
      setCheckInSleep(nextDailyCheckIn.sleepHours !== undefined ? String(nextDailyCheckIn.sleepHours) : "7");
      setCheckInNote(nextDailyCheckIn.notes || "");
      setCheckInSaved(true);
    } else {
      setCheckInSaved(false);
    }
    setStatus("Data loaded");
  }

  async function runSignup() {
    try {
      setStatus("Signing up...");
      const data = await signup(email, password, name);
      setToken(data.token);
      setUserEmail(data.user.email);
      await hydrateApp(data.token);
      setTab("profile");
      setShowOnboarding(true);
      setStatus("Signup successful. Complete onboarding next.");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function runLogin() {
    try {
      setStatus("Logging in...");
      const data = await login(email, password);
      setToken(data.token);
      setUserEmail(data.user.email);
      await hydrateApp(data.token);
      setStatus("Login successful");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function runLogout() {
    if (!token) {
      return;
    }
    try {
      await logout(token);
    } catch (_error) {
      // Client-side cleanup still clears state even if logout call fails.
    }
    setToken("");
    setUserEmail("");
    setProfile(null);
    setSummary(null);
    setMeals([]);
    setWorkouts([]);
    setRecommendations(null);
    setReminderSettings(null);
    setNutritionTargets(null);
    setWorkoutRecommendation(null);
    setWeeklyReview(null);
    setSocialFeed([]);
    setStatus("Logged out");
  }

  async function refreshAll() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      await hydrateApp(token);
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function addMealAndRefresh() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Saving meal...");
      await createMeal(token, {
        name: mealName,
        calories: toNumber(mealCalories),
        protein: toNumber(mealProtein),
        carbs: toNumber(mealCarbs),
        fats: toNumber(mealFats),
        loggedAt: loggedAtForDate(activeDate)
      });
      await hydrateApp(token);
      setStatus("Meal saved");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function searchFoodsForMeal() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Searching FatSecret foods...");
      const results = await searchNutritionFoods(token, foodSearchQuery);
      setFoodSearchResults(results.foods);
      setStatus(`Found ${results.totalResults} FatSecret matches`);
    } catch (error) {
      setStatus(String(error));
    }
  }

  function useFoodForMeal(food: NutritionFood) {
    setMealName(food.brandName ? `${food.brandName} ${food.name}` : food.name);
    if (food.calories !== null) {
      setMealCalories(String(food.calories));
    }
    if (food.protein !== null) {
      setMealProtein(String(food.protein));
    }
    if (food.carbs !== null) {
      setMealCarbs(String(food.carbs));
    }
    if (food.fats !== null) {
      setMealFats(String(food.fats));
    }
    setStatus(`Selected ${food.name}`);
  }

  async function addFoodToLog(food: NutritionFood) {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Adding food to log...");
      await createMeal(token, {
        name: food.brandName ? `${food.brandName} ${food.name}` : food.name,
        calories: food.calories ?? 0,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fats: food.fats ?? 0,
        loggedAt: loggedAtForDate(activeDate)
      });
      await hydrateApp(token);
      setStatus("Food added to meal log");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function searchFoodLibrary() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Searching food library...");
      const results = await listFoodItems(token, { query: libraryQuery });
      setLibraryFoods(results);
      setStatus(`Food library found ${results.length} saved foods`);
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function addFoodItemToLog(food: FoodItem) {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Adding food item to log...");
      await createMealFromFoodItem(token, {
        foodItemId: food.id,
        loggedAt: loggedAtForDate(activeDate)
      });
      await hydrateApp(token);
      setStatus("Food item added to meal log");
    } catch (error) {
      setStatus(`Food item add failed. Use manual entry fallback: ${String(error)}`);
    }
  }

  async function addWorkoutAndRefresh() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Saving workout...");
      await createWorkout(token, {
        name: buildWorkoutLogName(),
        durationMinutes: toNumber(workoutDuration),
        caloriesBurned: toNumber(workoutCalories),
        loggedAt: loggedAtForDate(activeDate)
      });
      await hydrateApp(token);
      setStatus("Workout saved");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function saveProfile() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Updating profile...");
      const updated = await updateProfile(token, {
        name: profileName || name,
        goalCalories: toNumber(goalCalories, 2200),
        goalWorkoutsPerWeek: toNumber(goalWorkouts, 4)
      });
      setProfile(updated);
      await hydrateApp(token);
      setStatus("Profile updated");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function saveOnboarding() {
    const complete = isOnboardingComplete(onboarding);
    if (!complete) {
      setStatus("Add age, height, weight, activity, and goal to complete onboarding.");
      return;
    }

    const weightKg = toNumber(onboarding.weightKg, 75);
    const activityMultiplier =
      onboarding.activityLevel === "High" ? 34 : onboarding.activityLevel === "Low" ? 26 : 30;
    const goalAdjustment =
      onboarding.goalType === "Lose fat" ? -350 : onboarding.goalType === "Gain muscle" ? 250 : 0;
    const nextCalories = Math.max(1200, Math.round(weightKg * activityMultiplier + goalAdjustment));
    const nextWorkouts = onboarding.activityLevel === "High" ? 5 : onboarding.activityLevel === "Low" ? 3 : 4;

    setGoalCalories(String(nextCalories));
    setGoalWorkouts(String(nextWorkouts));
    setShowOnboarding(false);
    setStatus("Onboarding saved locally. Syncing profile goals...");

    if (!token) {
      return;
    }

    try {
      const updated = await updateOnboardingProfile(token, {
        name: profileName || name,
        goalCalories: nextCalories,
        goalWorkoutsPerWeek: nextWorkouts,
        age: toNumber(onboarding.age),
        gender: mapGender(onboarding.gender),
        sex: mapGender(onboarding.gender),
        heightCm: toNumber(onboarding.heightCm),
        weightKg,
        activityLevel: mapActivityLevel(onboarding.activityLevel),
        goalType: mapGoalType(onboarding.goalType),
        dietPreference: onboarding.dietPreference,
        privacyPreference: mapPrivacyPreference(onboarding.privacyPreference),
        restrictions: splitList(onboarding.restrictions)
      });
      setProfile(updated);
      await hydrateApp(token);
      setStatus("Onboarding complete and nutrition targets updated");
    } catch (error) {
      setStatus(`Onboarding saved locally. Profile sync unavailable: ${String(error)}`);
    }
  }

  async function saveReminders() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Saving reminder settings...");
      const updated = await updateReminderSettings(token, {
        enabled: reminderEnabled,
        reminderTime,
        frequency: reminderFrequency
      });
      setReminderSettings(updated);
      setStatus("Reminder settings updated");
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function saveDailyCheckIn() {
    setCheckInSaved(true);
    if (!token) {
      setStatus("Daily check-in saved locally. Login to sync.");
      return;
    }
    try {
      setStatus("Saving daily check-in...");
      await upsertDailyCheckIn(token, {
        date: activeDate,
        energyLevel: energyLabelToNumber(checkInEnergy),
        soreness: sorenessLabelToNumber(checkInSoreness),
        sleepHours: toNumber(checkInSleep, 7),
        notes: checkInNote
      });
      const nextRecommendation = await getWorkoutRecommendation(token, activeDate).catch(() => null);
      setWorkoutRecommendation(nextRecommendation);
      setStatus("Daily check-in saved");
    } catch (error) {
      setStatus(`Daily check-in saved locally. Sync unavailable: ${String(error)}`);
    }
  }

  function buildAdaptiveWorkout() {
    if (workoutRecommendation) {
      return {
        title: workoutRecommendation.title,
        body: `${workoutRecommendation.durationMinutes} min ${workoutRecommendation.workoutType} at ${workoutRecommendation.intensity} intensity. ${workoutRecommendation.reason}`
      };
    }

    const time = toNumber(coachTimeAvailable, 20);
    const sleep = toNumber(checkInSleep, 7);
    if (checkInEnergy === "Low" || checkInSoreness === "Sore" || sleep < 6) {
      return {
        title: "Recovery session",
        body: `${Math.min(time, 25)} min mobility walk, easy core, and stretching. Keep intensity conversational.`
      };
    }
    if (time < 25) {
      return {
        title: "Efficient strength circuit",
        body: `${time} min circuit: squats, pushups, rows, hip hinges, and plank intervals.`
      };
    }
    return {
      title: "Progressive full-body workout",
      body: `${time} min full-body strength with a short finisher. Add load only if form stays clean.`
    };
  }

  function buildLocalCoachSuggestions() {
    const adaptiveWorkout = buildAdaptiveWorkout();
    const ingredients = coachIngredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const ingredientCopy = ingredients.length > 0 ? ingredients.slice(0, 3).join(", ") : "your available foods";
    const hungerCopy =
      coachHunger === "High"
        ? "Use a larger protein serving and fiber-rich side."
        : coachHunger === "Low"
          ? "Keep it light and easy to digest."
          : "Use a balanced plate.";

    return [
      {
        title: `${coachTimeAvailable || "15"} min meal idea`,
        body: `Build a ${onboarding.dietPreference.toLowerCase()} plate with ${ingredientCopy}. ${hungerCopy}`,
        reason: `Based on ${coachTimeAvailable || "15"} minutes available, ${coachHunger.toLowerCase()} hunger, ${coachBudget.toLowerCase()} budget, and ingredients on hand.`,
        source: "local" as const,
        action: "meal" as const,
        calories: coachHunger === "High" ? 550 : 350,
        protein: 30,
        carbs: 35,
        fats: 14
      },
      {
        title: adaptiveWorkout.title,
        body: adaptiveWorkout.body,
        reason: workoutRecommendation
          ? workoutRecommendation.reason
          : `Adapted from today's energy (${checkInEnergy}), soreness (${checkInSoreness}), and sleep (${checkInSleep || "0"}h).`,
        source: workoutRecommendation ? ("rules" as const) : ("local" as const),
        action: "workout" as const
      },
      {
        title: "Coach note",
        body: recommendations?.tips[0]?.message || "Backend coach tips are unavailable, so this suggestion is generated locally.",
        reason: recommendations?.tips[0]
          ? `Pulled from today's ${recommendations.tips[0].area} recommendation.`
          : "No daily recommendation was loaded, so the app used the local coach fallback.",
        source: recommendations?.source || ("fallback" as const),
        action: "save" as const
      }
    ];
  }

  async function generateCoachSuggestions() {
    const localSuggestions = buildLocalCoachSuggestions();
    if (!token) {
      setCoachSuggestions(localSuggestions);
      setStatus("Coach suggestions generated locally. Login to sync.");
      return;
    }

    try {
      setStatus("Loading coach meal suggestions...");
      const ingredients = coachIngredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const mealSuggestions = await getCoachMealSuggestions(token, {
        availableIngredients: ingredients,
        timeAvailableMinutes: toNumber(coachTimeAvailable, 20),
        hungerLevel: coachHunger,
        budgetPreference: coachBudget
      });
      const adaptiveWorkout = buildAdaptiveWorkout();
      setCoachSuggestions([
        ...mealSuggestions.suggestions.slice(0, 2).map((suggestion) => ({
          title: suggestion.title,
          body: `${suggestion.description} ${suggestion.rationale}`,
          reason: suggestion.rationale || `Matched to ${coachHunger.toLowerCase()} hunger and available ingredients.`,
          source: mealSuggestions.source === "llm" ? ("llm" as const) : ("fallback" as const),
          action: "meal" as const,
          calories: suggestion.calories,
          protein: suggestion.macros.protein,
          carbs: suggestion.macros.carbs,
          fats: suggestion.macros.fats
        })),
        {
          title: adaptiveWorkout.title,
          body: adaptiveWorkout.body,
          reason: workoutRecommendation
            ? workoutRecommendation.reason
            : `Adapted from today's energy (${checkInEnergy}), soreness (${checkInSoreness}), and sleep (${checkInSleep || "0"}h).`,
          source: workoutRecommendation ? ("rules" as const) : ("local" as const),
          action: "workout" as const
        },
        {
          title: "Coach note",
          body: mealSuggestions.disclaimer,
          reason: "Safety note returned with the coach meal suggestion response.",
          source: mealSuggestions.source === "llm" ? ("llm" as const) : ("fallback" as const),
          action: "save" as const
        }
      ]);
      setStatus(`Coach meal suggestions loaded (${mealSuggestions.source})`);
    } catch (error) {
      setCoachSuggestions(localSuggestions);
      setStatus(`Coach API unavailable. Generated local suggestions: ${String(error)}`);
    }
  }

  async function applyCoachSuggestion(suggestion: CoachSuggestion) {
    if (suggestion.action === "save") {
      setSavedCoachPlan(suggestion.body);
      setStatus("Coach note saved locally");
      return;
    }
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      if (suggestion.action === "meal") {
        await createMeal(token, {
          name: suggestion.title,
          calories: suggestion.calories ?? (coachHunger === "High" ? 550 : 350),
          protein: suggestion.protein ?? 30,
          carbs: suggestion.carbs ?? 35,
          fats: suggestion.fats ?? 14,
          loggedAt: loggedAtForDate(activeDate)
        });
        await hydrateApp(token);
        setStatus("Coach meal added to log");
      } else {
        await createWorkout(token, {
          name: suggestion.title,
          durationMinutes: toNumber(coachTimeAvailable, 20),
          caloriesBurned: Math.round(toNumber(coachTimeAvailable, 20) * 6),
          loggedAt: loggedAtForDate(activeDate)
        });
        await hydrateApp(token);
        setStatus("Coach workout added to log");
      }
    } catch (error) {
      setStatus(String(error));
    }
  }

  async function loadWeeklyReview() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Loading weekly review...");
      const review = await getCoachWeeklyReview(token);
      setWeeklyReview(review);
      setStatus(`Weekly review loaded (${review.source})`);
    } catch (error) {
      setStatus(`Weekly review unavailable: ${String(error)}`);
    }
  }

  async function loadSocialFeed() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Loading social feed...");
      const posts = await getSocialFeed(token);
      setSocialFeed(posts.slice(0, 3));
      setStatus(`Loaded ${posts.length} shared meals`);
    } catch (error) {
      setStatus(`Social feed unavailable: ${String(error)}`);
    }
  }

  async function copySharedMeal(post: SocialPost) {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Copying shared meal...");
      await copySocialPostToLog(token, post.id);
      await hydrateApp(token);
      setStatus("Shared meal copied to log");
    } catch (error) {
      setStatus(`Copy unavailable: ${String(error)}`);
    }
  }

  async function loadMealTemplates() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Loading meal templates...");
      const templates = await listMealTemplates(token);
      setMealTemplates(templates);
      setStatus(`Loaded ${templates.length} meal templates`);
    } catch (error) {
      setStatus(`Meal templates unavailable: ${String(error)}`);
    }
  }

  async function createTemplateFromFirstFood() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    const firstFood = libraryFoods[0];
    if (!firstFood) {
      setStatus("Search the Food Library first, then create a template from a saved food.");
      setTab("library");
      return;
    }
    try {
      setStatus("Creating meal template...");
      await createMealTemplate(token, {
        name: templateName || `${firstFood.name} Template`,
        mealType: templateMealType,
        items: [{ foodItemId: firstFood.id, servingMultiplier: 1 }]
      });
      await loadMealTemplates();
      setStatus("Meal template created");
    } catch (error) {
      setStatus(`Template create unavailable: ${String(error)}`);
    }
  }

  async function addTemplateToToday(template: MealTemplate) {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      setStatus("Adding template to log...");
      await addMealTemplateToLog(token, {
        templateId: template.id,
        mealType: template.mealType || "lunch",
        loggedAt: loggedAtForDate(activeDate)
      });
      await hydrateApp(token);
      setStatus("Meal template added to today's log");
    } catch (error) {
      setStatus(`Template add unavailable: ${String(error)}`);
    }
  }

  async function shareLatestMeal() {
    if (!token) {
      setStatus("Login first");
      return;
    }
    const latestMeal = meals[0];
    if (!latestMeal) {
      setStatus("Add or copy a meal first, then share it.");
      setTab("meals");
      return;
    }
    try {
      setStatus("Sharing meal...");
      await createSocialPost(token, {
        meal: {
          name: latestMeal.name,
          calories: latestMeal.calories,
          protein: latestMeal.protein,
          carbs: latestMeal.carbs,
          fats: latestMeal.fats,
          loggedAt: latestMeal.loggedAt
        },
        caption: "Demo meal share",
        visibility: "public",
        privacy: { hideCalories: false, hideMeasurements: true }
      });
      await loadSocialFeed();
      setStatus("Meal shared to feed");
    } catch (error) {
      setStatus(`Share unavailable: ${String(error)}`);
    }
  }

  async function likeSharedMeal(post: SocialPost) {
    if (!token) {
      setStatus("Login first");
      return;
    }
    try {
      await likeSocialPost(token, post.id);
      await loadSocialFeed();
      setStatus("Shared meal liked");
    } catch (error) {
      setStatus(`Like unavailable: ${String(error)}`);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }
    hydrateApp(token, activeDate).catch((error) => setStatus(String(error)));
  }, [activeDate]);

  function updateOnboardingField<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setOnboarding((current) => ({ ...current, [key]: value }));
  }

  function updateNumericText(value: string, delta: number, onChange: (nextValue: string) => void, min = 0, max = 9999) {
    const currentValue = toNumber(value, min);
    const nextValue = Math.max(min, Math.min(max, currentValue + delta));
    onChange(String(nextValue));
  }

  function setExactNumber(value: string, onChange: (nextValue: string) => void, min: number, max: number) {
    const nextValue = Math.max(min, Math.min(max, Math.round(toNumber(value, min))));
    onChange(String(nextValue));
  }

  function updateNumberDigit(
    value: string,
    digitIndex: number,
    direction: 1 | -1,
    onChange: (nextValue: string) => void,
    min: number,
    max: number,
    digits: number
  ) {
    const current = Math.max(min, Math.min(max, Math.round(toNumber(value, min))));
    const chars = String(current).padStart(digits, "0").slice(-digits).split("");
    const nextDigit = (Number(chars[digitIndex]) + direction + 10) % 10;
    chars[digitIndex] = String(nextDigit);
    const nextValue = Math.max(min, Math.min(max, Number(chars.join(""))));
    onChange(String(nextValue));
  }

  function selectWorkoutExercise(exercise: (typeof WORKOUT_EXERCISES)[number]) {
    setWorkoutName(exercise.name);
    setWorkoutKg(exercise.defaultKg);
    setWorkoutReps(exercise.defaultReps);
    setWorkoutTries(exercise.defaultTries);
    if (exercise.name === "Hill Walk") {
      setWorkoutDuration(exercise.defaultReps);
      setWorkoutCalories("120");
    }
  }

  function buildWorkoutLogName() {
    const exercise = WORKOUT_EXERCISES.find((item) => item.name === workoutName);
    const prefix = exercise ? `${exercise.emoji} ${exercise.name}` : workoutName || "Workout";
    const kg = toNumber(workoutKg);
    const reps = toNumber(workoutReps);
    const tries = toNumber(workoutTries, 1);
    if (kg > 0) {
      return `${prefix} - ${kg} kg x ${reps} reps x ${tries} tries`;
    }
    return `${prefix} - ${reps} ${workoutName === "Hill Walk" ? "min" : "reps"} x ${tries} tries`;
  }

  function applyQuickMeal(meal: (typeof QUICK_MEALS)[number]) {
    setMealName(meal.name);
    setMealCalories(meal.calories);
    setMealProtein(meal.protein);
    setMealCarbs(meal.carbs);
    setMealFats(meal.fats);
    setStatus(`Selected ${meal.name}`);
  }

  function toggleCoachIngredient(ingredient: string) {
    const ingredients = coachIngredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const hasIngredient = ingredients.some((item) => item.toLowerCase() === ingredient.toLowerCase());
    const nextIngredients = hasIngredient
      ? ingredients.filter((item) => item.toLowerCase() !== ingredient.toLowerCase())
      : [...ingredients, ingredient];
    setCoachIngredients(nextIngredients.join(", "));
  }

  function renderChoiceRow(options: string[], value: string, onChange: (nextValue: string) => void) {
    return <View style={styles.segmentWrap}>{options.map((option) => renderChoiceButton(option, value, onChange))}</View>;
  }

  function renderChoiceButton(option: string, value: string, onChange: (nextValue: string) => void) {
    const isActive = option === value;
    return (
      <TouchableOpacity
        key={option}
        style={[styles.pillButton, isActive ? styles.pillButtonActive : null]}
        onPress={() => onChange(option)}
      >
        <Text style={[styles.pillText, isActive ? styles.pillTextActive : null]}>{option}</Text>
      </TouchableOpacity>
    );
  }

  function renderQuickValueRow(options: string[], value: string, onChange: (nextValue: string) => void, suffix = "") {
    return (
      <View style={styles.quickValueRow}>
        {options.map((option) => {
          const isActive = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.quickValueButton, isActive ? styles.quickValueButtonActive : null]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.quickValueText, isActive ? styles.quickValueTextActive : null]}>
                {option}
                {suffix}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderStepper(
    label: string,
    value: string,
    onChange: (nextValue: string) => void,
    step: number,
    min: number,
    max: number,
    suffix = ""
  ) {
    return (
      <View style={styles.stepper}>
        <View style={styles.stepperCopy}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.stepperValue}>
            {value || String(min)}
            {suffix}
          </Text>
        </View>
        <View style={styles.stepperControls}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateNumericText(value, -step, onChange, min, max)}
          >
            <Text style={styles.stepperButtonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateNumericText(value, step, onChange, min, max)}
          >
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDigitPicker(
    label: string,
    value: string,
    onChange: (nextValue: string) => void,
    min: number,
    max: number,
    digits: number,
    suffix = ""
  ) {
    const displayValue = String(Math.max(min, Math.min(max, Math.round(toNumber(value, min)))))
      .padStart(digits, "0")
      .slice(-digits);
    return (
      <View style={styles.digitPicker}>
        <View style={styles.headerRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.digitPickerValue}>
            {Number(displayValue)}
            {suffix}
          </Text>
        </View>
        <View style={styles.digitRow}>
          {displayValue.split("").map((digit, index) => (
            <View style={styles.digitColumn} key={`${label}-${index}`}>
              <TouchableOpacity
                style={styles.digitButton}
                onPress={() => updateNumberDigit(value, index, 1, onChange, min, max, digits)}
              >
                <Text style={styles.digitButtonText}>⌃</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.digitInput}
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(nextDigit) => {
                  const cleaned = nextDigit.replace(/\D/g, "").slice(-1);
                  if (!cleaned) {
                    return;
                  }
                  const chars = displayValue.split("");
                  chars[index] = cleaned;
                  setExactNumber(chars.join(""), onChange, min, max);
                }}
              />
              <TouchableOpacity
                style={styles.digitButton}
                onPress={() => updateNumberDigit(value, index, -1, onChange, min, max, digits)}
              >
                <Text style={styles.digitButtonText}>⌄</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  }

  function renderAuthView() {
    return (
      <View style={styles.authScreen}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>HL</Text>
        </View>
        <Text style={styles.authTitle}>Healthy Life, Happy Life</Text>
        <Text style={styles.authSubtitle}>Your personal fitness companion</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 8 chars)"
          secureTextEntry
        />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
        <TouchableOpacity style={styles.fullButton} onPress={runLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={runSignup}>
          <Text style={styles.linkButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={useDemoAccount}>
          <Text style={styles.smallButtonText}>Use Demo Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={checkBackend}>
          <Text style={styles.small}>Check backend connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTabButton(value: Tab, label: string) {
    const isActive = value === tab;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
        onPress={() => setTab(value)}
      >
        <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function renderScreenHeader(title: string, subtitle: string, icon: string, action?: () => void) {
    return (
      <View style={styles.screenHeader}>
        <View style={styles.screenTitleBlock}>
          <Text style={styles.screenTitle}>{title}</Text>
          <Text style={styles.screenSubtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.headerIconButton} onPress={action || refreshAll}>
          <Text style={styles.headerIconButtonText}>{icon}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderBottomNav() {
    return (
      <View style={styles.bottomNav}>
        {PRIMARY_NAV.map((item) => {
          const isActive = tab === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={styles.bottomNavItem}
              onPress={() => setTab(item.value)}
            >
              <Text style={[styles.bottomNavIcon, isActive ? styles.bottomNavIconActive : null]}>{item.icon}</Text>
              <Text style={[styles.bottomNavLabel, isActive ? styles.bottomNavLabelActive : null]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderMoreScreens() {
    return (
      <View style={styles.moreRow}>
        {SECONDARY_NAV.map((item) => renderTabButton(item.value, item.label))}
      </View>
    );
  }

  function renderProgressCard(label: string, current: number, target: number, suffix = "") {
    const progress = target > 0 ? clampProgress(current / target) : 0;
    const percent = Math.round(progress * 100);
    return (
      <View style={styles.progressCard}>
        <View style={styles.headerRow}>
          <Text style={styles.itemTitle}>{label}</Text>
          <Text style={styles.progressValue}>
            {formatMetric(current, suffix)} / {target > 0 ? formatMetric(target, suffix) : "--"}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.small}>{target > 0 ? `${percent}% of target` : "Target not set"}</Text>
      </View>
    );
  }

  function renderDashboard() {
    const targets = estimateNutritionTargets(profile, summary, onboarding, nutritionTargets);
    const onboardingComplete = isOnboardingComplete(onboarding);
    const adaptiveWorkout = buildAdaptiveWorkout();
    const caloriesRemaining =
      targets && summary ? Math.max(0, targets.calories - summary.totalCaloriesIn) : null;
    const primaryCoachTip = recommendations?.tips[0];
    return (
      <>
        {renderScreenHeader("Today", `${activeDate} plan and progress`, "P", () => setTab("profile"))}

        <View style={styles.heroCard}>
          <View style={styles.headerRow}>
            <View style={styles.screenTitleBlock}>
              <Text style={styles.heroEyebrow}>Daily dashboard</Text>
              <Text style={styles.heroMetric}>
                {caloriesRemaining !== null ? `${caloriesRemaining}` : "--"}
              </Text>
              <Text style={styles.heroLabel}>calories left today</Text>
            </View>
            <TextInput
              style={styles.compactDateInput}
              value={activeDate}
              onChangeText={setActiveDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.quickAction} onPress={() => setTab("meals")}>
              <Text style={styles.quickActionTitle}>Log meal</Text>
              <Text style={styles.small}>{summary?.mealsCount || 0} today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => setTab("workouts")}>
              <Text style={styles.quickActionTitle}>Log workout</Text>
              <Text style={styles.small}>{summary?.workoutMinutes || 0} min</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => setTab("coach")}>
              <Text style={styles.quickActionTitle}>Ask coach</Text>
              <Text style={styles.small}>{formatSourceLabel(recommendations?.source)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          {targets ? (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.section}>Nutrition</Text>
                <Text style={styles.sourcePill}>{targets.source}</Text>
              </View>
              {summary ? renderProgressCard("Calories", summary.totalCaloriesIn, targets.calories, "") : null}
              <View style={styles.targetGrid}>
                <View style={styles.metricTile}>
                  <Text style={styles.metricValue}>{summary?.macros.protein || 0}g / {targets.protein}g</Text>
                  <Text style={styles.metricLabel}>Protein</Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricValue}>{summary?.macros.carbs || 0}g / {targets.carbs}g</Text>
                  <Text style={styles.metricLabel}>Carbs</Text>
                </View>
                <View style={styles.metricTile}>
                  <Text style={styles.metricValue}>{summary?.macros.fats || 0}g / {targets.fats}g</Text>
                  <Text style={styles.metricLabel}>Fats</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>Complete onboarding</Text>
              <Text style={styles.small}>
                Nutrition targets need profile goals or onboarding data. These estimates are general wellness guidance,
                not medical advice.
              </Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setTab("profile")}>
                <Text style={styles.secondaryButtonText}>Open Onboarding</Text>
              </TouchableOpacity>
            </View>
          )}
          {!onboardingComplete ? (
            <Text style={styles.small}>Personalized macro targets improve after onboarding is complete.</Text>
          ) : null}
          {summary ? (
            <View style={styles.statsBlock}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryTile}>
                  <Text style={styles.metricValue}>{summary.netCalories}</Text>
                  <Text style={styles.metricLabel}>Net calories</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.metricValue}>{summary.workoutMinutes}</Text>
                  <Text style={styles.metricLabel}>Workout min</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.metricValue}>{summary.mealsCount}</Text>
                  <Text style={styles.metricLabel}>Meals</Text>
                </View>
                <View style={styles.summaryTile}>
                  <Text style={styles.metricValue}>{summary.workoutsCount}</Text>
                  <Text style={styles.metricLabel}>Workouts</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.small}>No summary loaded yet.</Text>
          )}
        </View>

        {targets ? (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.section}>Workout Goal</Text>
              <Text style={styles.headerIconText}>W</Text>
            </View>
            {renderProgressCard("Workouts", summary?.workoutsCount || 0, targets.workouts || 1, "")}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>Daily Check-in</Text>
          <Text style={styles.small}>A quick check-in makes workout and coach recommendations more relevant.</Text>
          <Text style={styles.fieldLabel}>Energy</Text>
          {renderChoiceRow(ENERGY_LEVELS, checkInEnergy, setCheckInEnergy)}
          <Text style={styles.fieldLabel}>Soreness</Text>
          {renderChoiceRow(SORENESS_LEVELS, checkInSoreness, setCheckInSoreness)}
          <Text style={styles.fieldLabel}>Sleep</Text>
          {renderQuickValueRow(QUICK_SLEEP_HOURS, checkInSleep, setCheckInSleep, "h")}
          {renderStepper("Sleep hours", checkInSleep, setCheckInSleep, 0.5, 0, 14, "h")}
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={checkInNote}
            onChangeText={setCheckInNote}
            placeholder="Short note"
            multiline
          />
          <TouchableOpacity style={styles.fullButton} onPress={saveDailyCheckIn}>
            <Text style={styles.buttonText}>{checkInSaved ? "Update Check-in" : "Save Check-in"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Coach Preview</Text>
            <Text style={styles.sourcePill}>{workoutRecommendation ? "Rules" : "On-device"}</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>{adaptiveWorkout.title}</Text>
            <Text style={styles.small}>{adaptiveWorkout.body}</Text>
          </View>
          <View style={styles.coachReasonBox}>
            <Text style={styles.fieldLabel}>Why this</Text>
            <Text style={styles.small}>
              {workoutRecommendation
                ? workoutRecommendation.reason
                : `Based on energy ${checkInEnergy.toLowerCase()}, soreness ${checkInSoreness.toLowerCase()}, and ${checkInSleep || "0"}h sleep.`}
            </Text>
          </View>
          {primaryCoachTip ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setTab("coach")}>
              <Text style={styles.secondaryButtonText}>Open Smart Coach: {primaryCoachTip.title}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setTab("coach")}>
              <Text style={styles.secondaryButtonText}>Open Smart Coach</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  }

  function renderMeals() {
    return (
      <>
        {renderScreenHeader("Meals", "Log food and build reusable meals", "M", () => setTab("library"))}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Today's Meals</Text>
            <TouchableOpacity style={styles.smallButton} onPress={() => setTab("library")}>
              <Text style={styles.smallButtonText}>Find foods</Text>
            </TouchableOpacity>
          </View>
          {meals.length === 0 ? (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>No meals logged for {activeDate}</Text>
              <Text style={styles.small}>Start with a quick manual entry, search FatSecret, or open the food library.</Text>
            </View>
          ) : (
            meals.map((item) => (
              <View style={styles.mealCard} key={item.id}>
                <View style={styles.headerRow}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.calories} kcal</Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>Protein</Text>
                    <Text style={styles.itemTitle}>{item.protein}g</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>Carbs</Text>
                    <Text style={styles.itemTitle}>{item.carbs}g</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>Fats</Text>
                    <Text style={styles.itemTitle}>{item.fats}g</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Quick Add</Text>
          <Text style={styles.fieldLabel}>Common meals</Text>
          <View style={styles.quickMealGrid}>
            {QUICK_MEALS.map((meal) => (
              <TouchableOpacity
                key={meal.name}
                style={[styles.quickMealChip, mealName === meal.name ? styles.quickMealChipActive : null]}
                onPress={() => applyQuickMeal(meal)}
              >
                <Text style={[styles.quickMealTitle, mealName === meal.name ? styles.quickMealTitleActive : null]}>
                  {meal.name}
                </Text>
                <Text style={[styles.small, mealName === meal.name ? styles.quickMealMetaActive : null]}>
                  {meal.calories} kcal
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={mealName} onChangeText={setMealName} placeholder="Meal name" />
          <Text style={styles.fieldLabel}>Calories</Text>
          {renderQuickValueRow(["250", "400", "650", "850"], mealCalories, setMealCalories, " kcal")}
          {renderDigitPicker("Calories", mealCalories, setMealCalories, 0, 3000, 4, " kcal")}
          <View style={styles.row}>
            {renderDigitPicker("Protein", mealProtein, setMealProtein, 0, 250, 3, "g")}
            {renderDigitPicker("Carbs", mealCarbs, setMealCarbs, 0, 400, 3, "g")}
          </View>
          {renderDigitPicker("Fats", mealFats, setMealFats, 0, 200, 3, "g")}
          <TouchableOpacity style={styles.fullButton} onPress={addMealAndRefresh}>
            <Text style={styles.buttonText}>Save Meal</Text>
          </TouchableOpacity>
          <Text style={styles.subsection}>Search Nutrition Database</Text>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.searchInput]} value={foodSearchQuery} onChangeText={setFoodSearchQuery} placeholder="Search foods" />
            <TouchableOpacity style={styles.compactButton} onPress={searchFoodsForMeal}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {foodSearchResults.map((item) => (
            <View style={styles.listItem} key={item.foodId}>
              <Text style={styles.itemTitle}>{item.brandName ? `${item.brandName} ${item.name}` : item.name}</Text>
              <Text style={styles.small}>kcal {item.calories ?? "-"} | P/C/F {item.protein ?? "-"}/{item.carbs ?? "-"}/{item.fats ?? "-"}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={() => useFoodForMeal(item)}>
                  <Text style={styles.buttonText}>Prefill</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => addFoodToLog(item)}>
                  <Text style={styles.buttonText}>Add now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  function foodItemPassesLibraryFilter(food: FoodItem) {
    if (libraryFilter === "High protein") {
      return food.protein >= 15;
    }
    if (libraryFilter === "Lower calorie") {
      return food.calories <= 250;
    }
    if (libraryFilter === "Carb source") {
      return food.carbs >= 20;
    }
    return true;
  }

  function useFoodItemForMeal(food: FoodItem) {
    setMealName(food.brand ? `${food.brand} ${food.name}` : food.name);
    setMealCalories(String(food.calories));
    setMealProtein(String(food.protein));
    setMealCarbs(String(food.carbs));
    setMealFats(String(food.fats));
    setStatus(`Selected ${food.name}`);
  }

  function renderFoodLibrary() {
    const visibleFoods = libraryFoods.filter(foodItemPassesLibraryFilter);
    return (
      <>
      {renderScreenHeader("Food Library", "Search saved foods and add them fast", "R", () => setTab("meals"))}
      <View style={styles.card}>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            value={libraryQuery}
            onChangeText={setLibraryQuery}
            placeholder="Search foods"
          />
          <TouchableOpacity style={styles.compactButton} onPress={searchFoodLibrary}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.fieldLabel}>Filter</Text>
        {renderChoiceRow(LIBRARY_FILTERS, libraryFilter, setLibraryFilter)}
        {visibleFoods.length === 0 ? (
          <View style={styles.noticeBox}>
            <Text style={styles.itemTitle}>Ready for food search</Text>
            <Text style={styles.small}>
              Search your saved food library. For broader nutrition database search or manual entry, use the Meals tab.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsBlock}>
            {visibleFoods.map((item) => (
              <View style={styles.mealCard} key={`library-${item.id}`}>
                <Text style={styles.itemTitle}>{item.brand ? `${item.brand} ${item.name}` : item.name}</Text>
                <Text style={styles.small}>
                  {item.servingSize || item.category} | kcal {item.calories} | P/C/F {item.protein}/
                  {item.carbs}/{item.fats}
                </Text>
                <View style={styles.macroRow}>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>kcal</Text>
                    <Text style={styles.itemTitle}>{item.calories}</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>Protein</Text>
                    <Text style={styles.itemTitle}>{item.protein}g</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={styles.metricLabel}>Carbs</Text>
                    <Text style={styles.itemTitle}>{item.carbs}g</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.button} onPress={() => useFoodItemForMeal(item)}>
                    <Text style={styles.buttonText}>Use in form</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={() => addFoodItemToLog(item)}>
                    <Text style={styles.buttonText}>Add today</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      </>
    );
  }

  function renderTemplates() {
    return (
      <>
        {renderScreenHeader("Templates", "Save meals you repeat often", "T", loadMealTemplates)}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Meal Templates</Text>
            <TouchableOpacity style={styles.smallButton} onPress={loadMealTemplates}>
              <Text style={styles.smallButtonText}>Load</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="Template name"
          />
          <TextInput
            style={styles.input}
            value={templateMealType}
            onChangeText={setTemplateMealType}
            placeholder="breakfast | lunch | dinner | snack"
          />
          <TouchableOpacity style={styles.fullButton} onPress={createTemplateFromFirstFood}>
            <Text style={styles.buttonText}>Create From First Library Food</Text>
          </TouchableOpacity>
          <Text style={styles.small}>
            Search the Food Library first, then create a reusable template from the top result.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Saved Templates ({mealTemplates.length})</Text>
          {mealTemplates.length === 0 ? (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>No templates loaded</Text>
              <Text style={styles.small}>Load templates or create one from a library food item.</Text>
            </View>
          ) : (
            <View style={styles.resultsBlock}>
              {mealTemplates.map((template) => (
                <View style={styles.listItem} key={`template-${template.id}`}>
                  <Text style={styles.itemTitle}>{template.name}</Text>
                  <Text style={styles.small}>
                    {template.mealType || "meal"} | kcal {template.totals.calories} | P/C/F{" "}
                    {template.totals.protein}/{template.totals.carbs}/{template.totals.fats}
                  </Text>
                  <Text style={styles.small}>
                    Items: {template.items.map((item) => item.name).join(", ") || "No items"}
                  </Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addTemplateToToday(template)}>
                    <Text style={styles.secondaryButtonText}>Add to Today</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </>
    );
  }

  function renderWeekly() {
    return (
      <>
      {renderScreenHeader("Weekly", "Review progress and next focus", "W", loadWeeklyReview)}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.section}>Coach Review</Text>
          <TouchableOpacity style={styles.smallButton} onPress={loadWeeklyReview}>
            <Text style={styles.smallButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {weeklyReview ? (
          <>
            <Text style={styles.small}>{weeklyReview.summary}</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryTile}>
                <Text style={styles.metricValue}>{formatMetric(weeklyReview.metrics.avgCalories)}</Text>
                <Text style={styles.metricLabel}>Avg cal</Text>
              </View>
              <View style={styles.summaryTile}>
                <Text style={styles.metricValue}>{formatMetric(weeklyReview.metrics.proteinAvg, "g")}</Text>
                <Text style={styles.metricLabel}>Protein avg</Text>
              </View>
              <View style={styles.summaryTile}>
                <Text style={styles.metricValue}>{formatMetric(weeklyReview.metrics.workoutMinutes)}</Text>
                <Text style={styles.metricLabel}>Workout min</Text>
              </View>
              <View style={styles.summaryTile}>
                <Text style={styles.metricValue}>{formatMetric(weeklyReview.metrics.workouts)}</Text>
                <Text style={styles.metricLabel}>Workouts</Text>
              </View>
            </View>
            <Text style={styles.subsection}>Wins</Text>
            {weeklyReview.highlights.slice(0, 3).map((item) => (
              <View style={styles.listItem} key={`weekly-win-${item}`}>
                <Text style={styles.small}>{item}</Text>
              </View>
            ))}
            <Text style={styles.subsection}>Next Focus</Text>
            {weeklyReview.nextWeekFocus.slice(0, 3).map((item) => (
              <View style={styles.listItem} key={`weekly-focus-${item}`}>
                <Text style={styles.small}>{item}</Text>
              </View>
            ))}
            <Text style={styles.sourcePill}>Source: {formatSourceLabel(weeklyReview.source)}</Text>
          </>
        ) : (
          <View style={styles.noticeBox}>
            <Text style={styles.itemTitle}>Weekly coach ready</Text>
            <Text style={styles.small}>Load a concise review of logged meals, workouts, wins, and next week's focus.</Text>
          </View>
        )}
      </View>
      </>
    );
  }

  function renderSocial() {
    return (
      <>
        {renderScreenHeader("Social", "Share meals with privacy controls", "S", loadSocialFeed)}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Share</Text>
            <TouchableOpacity style={styles.smallButton} onPress={loadSocialFeed}>
              <Text style={styles.smallButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.fullButton} onPress={shareLatestMeal}>
            <Text style={styles.buttonText}>Share Latest Meal</Text>
          </TouchableOpacity>
          <Text style={styles.small}>
            Shared meals respect visibility and privacy controls. Copying adds the meal to your own log.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Shared Meals ({socialFeed.length})</Text>
          {socialFeed.length > 0 ? (
            <View style={styles.resultsBlock}>
              {socialFeed.map((post) => (
                <View style={styles.listItem} key={`social-${post.id}`}>
                  <Text style={styles.itemTitle}>{post.meal.name}</Text>
                  <Text style={styles.small}>
                    {post.author.name} | {post.visibility} | {post.likeCount} likes | {post.commentCount} comments
                  </Text>
                  {post.caption ? <Text style={styles.small}>{post.caption}</Text> : null}
                  <Text style={styles.small}>
                    {post.privacy.hideCalories ? "Calories hidden" : `${formatMetric(post.meal.calories)} cal`} |{" "}
                    {formatMetric(post.meal.protein, "g")} protein
                  </Text>
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.button} onPress={() => likeSharedMeal(post)}>
                      <Text style={styles.buttonText}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => copySharedMeal(post)}>
                      <Text style={styles.buttonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>No shared meals loaded</Text>
              <Text style={styles.small}>Load the feed or share your latest meal to create a demo post.</Text>
            </View>
          )}
        </View>
      </>
    );
  }

  function renderWorkouts() {
    return (
      <>
      {renderScreenHeader("Workout", "Move with yayla air and steady progress", "🌿")}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.section}>Today's Training Garden</Text>
          <TouchableOpacity style={styles.smallButton} onPress={() => setTab("coach")}>
            <Text style={styles.smallButtonText}>Coach plan</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coachReasonBox}>
          <Text style={styles.itemTitle}>{buildAdaptiveWorkout().title}</Text>
          <Text style={styles.small}>{buildAdaptiveWorkout().body}</Text>
        </View>
        <Text style={styles.fieldLabel}>Choose movement</Text>
        <View style={styles.exerciseGrid}>
          {WORKOUT_EXERCISES.map((exercise) => {
            const selected = workoutName === exercise.name;
            return (
              <TouchableOpacity
                key={exercise.name}
                style={[styles.exerciseCard, selected ? styles.exerciseCardActive : null]}
                onPress={() => selectWorkoutExercise(exercise)}
              >
                <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
                <Text style={[styles.exerciseTitle, selected ? styles.exerciseTitleActive : null]}>
                  {exercise.name}
                </Text>
                <Text style={[styles.small, selected ? styles.quickMealMetaActive : null]}>
                  {exercise.type} | {exercise.cue}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Custom movement"
        />
        <View style={styles.row}>
          {renderDigitPicker("Load", workoutKg, setWorkoutKg, 0, 300, 3, " kg")}
          {renderDigitPicker("Reps / time", workoutReps, setWorkoutReps, 0, 999, 3)}
        </View>
        {renderDigitPicker("Tries", workoutTries, setWorkoutTries, 1, 20, 2)}
        <Text style={styles.fieldLabel}>Duration</Text>
        {renderQuickValueRow(QUICK_WORKOUT_DURATIONS, workoutDuration, setWorkoutDuration, " min")}
        {renderDigitPicker("Duration", workoutDuration, setWorkoutDuration, 1, 240, 3, " min")}
        <Text style={styles.fieldLabel}>Calories burned</Text>
        {renderQuickValueRow(QUICK_WORKOUT_CALORIES, workoutCalories, setWorkoutCalories, " kcal")}
        {renderDigitPicker("Calories burned", workoutCalories, setWorkoutCalories, 0, 2000, 4, " kcal")}
        <View style={styles.noticeBox}>
          <Text style={styles.itemTitle}>Log preview</Text>
          <Text style={styles.small}>{buildWorkoutLogName()}</Text>
        </View>
        <TouchableOpacity style={styles.fullButton} onPress={addWorkoutAndRefresh}>
          <Text style={styles.buttonText}>Save Workout</Text>
        </TouchableOpacity>
        <Text style={styles.subsection}>Workout History ({workouts.length})</Text>
        {workouts.length === 0 ? (
          <View style={styles.noticeBox}>
            <Text style={styles.itemTitle}>No workout logged for {activeDate}</Text>
            <Text style={styles.small}>Save a session here or add the coach plan from Smart Coach.</Text>
          </View>
        ) : (
          workouts.map((item) => (
            <View style={styles.mealCard} key={item.id}>
              <View style={styles.headerRow}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.caloriesBurned} kcal</Text>
                </View>
              </View>
              <Text style={styles.small}>{item.durationMinutes} min | Workout logged</Text>
            </View>
          ))
        )}
      </View>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <View style={styles.profileHero}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowOnboarding((current) => !current)}>
            <Text style={styles.headerIconText}>S</Text>
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.profileName}>{profileName || name || "MVP User"}</Text>
          <Text style={styles.authSubtitle}>Fitness enthusiast</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Account Overview</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewIcon}>
              <Text style={styles.badgeText}>C</Text>
            </View>
            <View>
              <Text style={styles.small}>Daily Calorie Goal</Text>
              <Text style={styles.itemTitle}>{goalCalories || profile?.goalCalories || 0} kcal</Text>
            </View>
          </View>
          <View style={styles.overviewRow}>
            <View style={styles.overviewIcon}>
              <Text style={styles.badgeText}>W</Text>
            </View>
            <View>
              <Text style={styles.small}>Weekly Workout Goal</Text>
              <Text style={styles.itemTitle}>{goalWorkouts || profile?.goalWorkoutsPerWeek || 0} workouts</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Onboarding</Text>
            <TouchableOpacity style={styles.smallButton} onPress={() => setShowOnboarding((current) => !current)}>
              <Text style={styles.smallButtonText}>{showOnboarding ? "Hide" : "Edit"}</Text>
            </TouchableOpacity>
          </View>
          {isOnboardingComplete(onboarding) ? (
            <Text style={styles.small}>
              {onboarding.goalType} | {onboarding.activityLevel} activity | {onboarding.dietPreference} |{" "}
              {onboarding.privacyPreference}
            </Text>
          ) : (
            <Text style={styles.small}>Complete onboarding to unlock better targets and coach suggestions.</Text>
          )}
          {showOnboarding ? renderOnboardingForm() : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Profile</Text>
          <TextInput
            style={styles.input}
            value={profileName}
            onChangeText={setProfileName}
            placeholder="Display name"
          />
          <Text style={styles.fieldLabel}>Goal calories</Text>
          {renderQuickValueRow(QUICK_CALORIE_TARGETS, goalCalories, setGoalCalories, " kcal")}
          {renderDigitPicker("Daily calorie target", goalCalories, setGoalCalories, 1200, 5000, 4, " kcal")}
          {renderDigitPicker("Weekly workout goal", goalWorkouts, setGoalWorkouts, 0, 14, 2, "x")}
          <TouchableOpacity style={styles.fullButton} onPress={saveProfile}>
            <Text style={styles.buttonText}>Save Profile</Text>
          </TouchableOpacity>
          {profile ? (
            <Text style={styles.small}>
              Last update: {new Date(profile.updatedAt).toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.small}>No profile loaded yet.</Text>
          )}
        </View>
      </>
    );
  }

  function renderOnboardingForm() {
    const isLastStep = onboardingStep === ONBOARDING_STEPS.length - 1;
    return (
      <View style={styles.formBlock}>
        <View style={styles.onboardingSteps}>
          {ONBOARDING_STEPS.map((step, index) => {
            const isActive = onboardingStep === index;
            return (
              <TouchableOpacity
                key={step}
                style={[styles.onboardingStep, isActive ? styles.onboardingStepActive : null]}
                onPress={() => setOnboardingStep(index)}
              >
                <Text style={[styles.onboardingStepText, isActive ? styles.onboardingStepTextActive : null]}>
                  {index + 1}. {step}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {onboardingStep === 0 ? (
          <>
            {renderDigitPicker("Age", onboarding.age, (value) => updateOnboardingField("age", value), 13, 100, 2)}
            <Text style={styles.fieldLabel}>Height</Text>
            {renderQuickValueRow(QUICK_HEIGHTS, onboarding.heightCm, (value) => updateOnboardingField("heightCm", value), " cm")}
            {renderDigitPicker("Height", onboarding.heightCm, (value) => updateOnboardingField("heightCm", value), 120, 230, 3, " cm")}
            <Text style={styles.fieldLabel}>Weight</Text>
            {renderQuickValueRow(QUICK_WEIGHTS, onboarding.weightKg, (value) => updateOnboardingField("weightKg", value), " kg")}
            {renderDigitPicker("Weight", onboarding.weightKg, (value) => updateOnboardingField("weightKg", value), 35, 220, 3, " kg")}
            <Text style={styles.fieldLabel}>Sex / gender</Text>
            {renderChoiceRow(GENDERS, onboarding.gender, (value) => updateOnboardingField("gender", value))}
          </>
        ) : null}
        {onboardingStep === 1 ? (
          <>
            <Text style={styles.fieldLabel}>Activity level</Text>
            {renderChoiceRow(ACTIVITY_LEVELS, onboarding.activityLevel, (value) =>
              updateOnboardingField("activityLevel", value)
            )}
            <Text style={styles.fieldLabel}>Goal</Text>
            {renderChoiceRow(GOAL_TYPES, onboarding.goalType, (value) => updateOnboardingField("goalType", value))}
            <Text style={styles.fieldLabel}>Diet preference</Text>
            {renderChoiceRow(DIET_PREFERENCES, onboarding.dietPreference, (value) =>
              updateOnboardingField("dietPreference", value)
            )}
          </>
        ) : null}
        {onboardingStep === 2 ? (
          <>
            <Text style={styles.fieldLabel}>Privacy</Text>
            {renderChoiceRow(PRIVACY_PREFERENCES, onboarding.privacyPreference, (value) =>
              updateOnboardingField("privacyPreference", value)
            )}
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={onboarding.restrictions}
              onChangeText={(value) => updateOnboardingField("restrictions", value)}
              placeholder="Restrictions, allergies, injuries"
              multiline
            />
          </>
        ) : null}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.navStepButton]}
            onPress={() => setOnboardingStep((current) => Math.max(0, current - 1))}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fullButton, styles.navStepButton]}
            onPress={isLastStep ? saveOnboarding : () => setOnboardingStep((current) => Math.min(ONBOARDING_STEPS.length - 1, current + 1))}
          >
            <Text style={styles.buttonText}>{isLastStep ? "Complete Onboarding" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderReminderFrequencyButton(value: ReminderFrequency) {
    const isActive = reminderFrequency === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.segmentButton, isActive ? styles.segmentButtonActive : null]}
        onPress={() => setReminderFrequency(value)}
      >
        <Text style={[styles.segmentText, isActive ? styles.segmentTextActive : null]}>
          {formatReminderFrequency(value)}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderCoach() {
    const recommendationSource = formatSourceLabel(recommendations?.source);
    return (
      <>
        {renderScreenHeader("Smart Coach", "Recommendations with reason and source", "C", generateCoachSuggestions)}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Plan Builder</Text>
            <Text style={styles.sourcePill}>Daily: {recommendationSource}</Text>
          </View>
          <Text style={styles.small}>Tell the coach what you have and how much time you have. Suggestions can be added directly to today's log.</Text>
          <Text style={styles.fieldLabel}>Time available</Text>
          {renderQuickValueRow(QUICK_COACH_TIMES, coachTimeAvailable, setCoachTimeAvailable, " min")}
          {renderDigitPicker("Minutes", coachTimeAvailable, setCoachTimeAvailable, 1, 120, 3, " min")}
          <Text style={styles.fieldLabel}>Hunger</Text>
          {renderChoiceRow(HUNGER_LEVELS, coachHunger, setCoachHunger)}
          <Text style={styles.fieldLabel}>Budget</Text>
          {renderChoiceRow(COACH_BUDGETS, coachBudget, setCoachBudget)}
          <Text style={styles.fieldLabel}>Ingredients</Text>
          <View style={styles.segmentWrap}>
            {INGREDIENT_CHIPS.map((ingredient) => {
              const selected = coachIngredients
                .split(",")
                .map((item) => item.trim().toLowerCase())
                .includes(ingredient.toLowerCase());
              return (
                <TouchableOpacity
                  key={ingredient}
                  style={[styles.pillButton, selected ? styles.pillButtonActive : null]}
                  onPress={() => toggleCoachIngredient(ingredient)}
                >
                  <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{ingredient}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={coachIngredients}
            onChangeText={setCoachIngredients}
            placeholder="Ingredients on hand"
            multiline
          />
          <TouchableOpacity style={styles.fullButton} onPress={generateCoachSuggestions}>
            <Text style={styles.buttonText}>Build My Plan</Text>
          </TouchableOpacity>
          {coachSuggestions.length === 0 ? (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>Ready to build a plan</Text>
              <Text style={styles.small}>
                The app will show each suggestion's reason and whether it came from AI coach, rules, fallback, or on-device logic.
              </Text>
            </View>
          ) : (
            <View style={styles.resultsBlock}>
              {coachSuggestions.map((suggestion) => (
                <View style={styles.coachCard} key={`${suggestion.action}-${suggestion.title}`}>
                  <View style={styles.headerRow}>
                    <Text style={styles.itemTitle}>{suggestion.title}</Text>
                    <Text style={styles.sourcePill}>{formatSourceLabel(suggestion.source)}</Text>
                  </View>
                  <Text style={styles.small}>{suggestion.body}</Text>
                  <View style={styles.coachReasonBox}>
                    <Text style={styles.fieldLabel}>Why this recommendation</Text>
                    <Text style={styles.small}>{suggestion.reason}</Text>
                  </View>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => applyCoachSuggestion(suggestion)}>
                    <Text style={styles.secondaryButtonText}>
                      {suggestion.action === "meal"
                        ? "Add Meal to Today"
                        : suggestion.action === "workout"
                          ? "Add Workout to Today"
                          : "Save Note"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {savedCoachPlan ? <Text style={styles.small}>Saved note: {savedCoachPlan}</Text> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Daily Recommendations</Text>
            <Text style={styles.sourcePill}>{recommendationSource}</Text>
          </View>
          {recommendations ? (
            <>
              <Text style={styles.small}>{recommendations.disclaimer}</Text>
              {recommendations.tips.map((tip, index) => (
                <View style={styles.listItem} key={`${tip.area}-${index}`}>
                  <View style={styles.headerRow}>
                    <Text style={styles.itemTitle}>{tip.title}</Text>
                    <Text style={styles.sourcePill}>{tip.area}</Text>
                  </View>
                  <Text style={styles.small}>{tip.message}</Text>
                  <Text style={styles.small}>Why: based on {recommendations.date} meals, workouts, profile goals, and check-in signals.</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noticeBox}>
              <Text style={styles.itemTitle}>No daily recommendations loaded</Text>
              <Text style={styles.small}>Refresh app data from Home to load rules or AI-powered daily tips.</Text>
            </View>
          )}

          <Text style={styles.subsection}>Reminder Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.itemTitle}>Meal reminders</Text>
              <Text style={styles.small}>
                {reminderEnabled ? "On" : "Off"} at {reminderTime || "HH:MM"} on{" "}
                {formatReminderFrequency(reminderFrequency).toLowerCase()}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
              thumbColor={reminderEnabled ? "#1d4ed8" : "#f8fafc"}
            />
          </View>
          <Text style={styles.fieldLabel}>Reminder time</Text>
          <TextInput
            style={styles.input}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="HH:MM"
            maxLength={5}
          />
          <Text style={styles.fieldLabel}>Frequency</Text>
          <View style={styles.segmentRow}>{REMINDER_FREQUENCIES.map(renderReminderFrequencyButton)}</View>
          <TouchableOpacity style={styles.fullButton} onPress={saveReminders}>
            <Text style={styles.buttonText}>Save Reminder Settings</Text>
          </TouchableOpacity>
          {reminderSettings ? (
            <Text style={styles.small}>
              Saved: {reminderSettings.enabled ? "On" : "Off"} at {reminderSettings.reminderTime} (
              {formatReminderFrequency(reminderSettings.frequency)}). Last update:{" "}
              {new Date(reminderSettings.updatedAt).toLocaleString()}
            </Text>
          ) : null}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {!token ? (
          renderAuthView()
        ) : (
          <>
            {renderMoreScreens()}

            {tab === "dashboard" ? renderDashboard() : null}
            {tab === "meals" ? renderMeals() : null}
            {tab === "library" ? renderFoodLibrary() : null}
            {tab === "templates" ? renderTemplates() : null}
            {tab === "workouts" ? renderWorkouts() : null}
            {tab === "profile" ? renderProfile() : null}
            {tab === "coach" ? renderCoach() : null}
            {tab === "social" ? renderSocial() : null}
            {tab === "weekly" ? renderWeekly() : null}
            <View style={styles.sessionFooter}>
              <Text style={styles.small}>User: {userEmail || email} | API: {API_URL}</Text>
              <TouchableOpacity style={styles.linkButton} onPress={runLogout}>
                <Text style={styles.smallButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>
      {token ? renderBottomNav() : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7faf7"
  },
  container: {
    padding: 22,
    paddingTop: 48,
    paddingBottom: 112,
    gap: 14
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    color: "#334155"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#edf2f7",
    padding: 18,
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dbeedd",
    padding: 18,
    gap: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  heroEyebrow: {
    color: "#2f7d32",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroMetric: {
    color: "#0f172a",
    fontSize: 44,
    fontWeight: "900"
  },
  heroLabel: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700"
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 8
  },
  quickAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    padding: 12,
    minHeight: 74,
    justifyContent: "space-between"
  },
  quickActionTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900"
  },
  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  subsection: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#f8fbfd",
    fontSize: 15
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  half: {
    flex: 1
  },
  searchInput: {
    flex: 1
  },
  button: {
    flex: 1,
    backgroundColor: "#49b84f",
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center"
  },
  compactButton: {
    backgroundColor: "#49b84f",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonDanger: {
    flex: 1,
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  fullButton: {
    backgroundColor: "#49b84f",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    marginTop: 6
  },
  secondaryButtonText: {
    color: "#0f766e",
    fontWeight: "700"
  },
  smallButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ffffff"
  },
  smallButtonText: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700"
  },
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tabButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#ffffff"
  },
  tabButtonActive: {
    backgroundColor: "#49b84f",
    borderColor: "#49b84f"
  },
  tabText: {
    color: "#1e293b",
    fontWeight: "600"
  },
  tabTextActive: {
    color: "#ffffff"
  },
  listItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#f8fafc"
  },
  coachCard: {
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#ffffff",
    gap: 10
  },
  coachReasonBox: {
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#f3fbf4",
    gap: 4
  },
  sourcePill: {
    alignSelf: "flex-start",
    color: "#2f7d32",
    fontSize: 11,
    fontWeight: "900",
    borderWidth: 1,
    borderColor: "#bfe7c4",
    borderRadius: 999,
    backgroundColor: "#e8f7ea",
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden"
  },
  resultsBlock: {
    gap: 8
  },
  settingRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  settingCopy: {
    flex: 1,
    gap: 2
  },
  fieldLabel: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600"
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  segmentButtonActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8"
  },
  segmentText: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "600"
  },
  segmentTextActive: {
    color: "#ffffff"
  },
  segmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  quickValueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  quickValueButton: {
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f8fafc"
  },
  quickValueButtonActive: {
    backgroundColor: "#e8f7ea",
    borderColor: "#49b84f"
  },
  quickValueText: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "800"
  },
  quickValueTextActive: {
    color: "#2f7d32"
  },
  pillButton: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff"
  },
  pillButtonActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e"
  },
  pillText: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700"
  },
  pillTextActive: {
    color: "#ffffff"
  },
  itemTitle: {
    fontWeight: "600",
    color: "#0f172a"
  },
  formBlock: {
    gap: 8
  },
  stepper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#f8fbfd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  stepperCopy: {
    flex: 1,
    gap: 2
  },
  stepperValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900"
  },
  stepperControls: {
    flexDirection: "row",
    gap: 8
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e8f7ea",
    borderWidth: 1,
    borderColor: "#bfe7c4",
    alignItems: "center",
    justifyContent: "center"
  },
  stepperButtonText: {
    color: "#2f7d32",
    fontSize: 22,
    fontWeight: "900"
  },
  digitPicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#f8fbfd",
    gap: 10
  },
  digitPickerValue: {
    color: "#2f7d32",
    fontSize: 16,
    fontWeight: "900"
  },
  digitRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  digitColumn: {
    alignItems: "center",
    gap: 4
  },
  digitButton: {
    width: 34,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e8f7ea",
    borderWidth: 1,
    borderColor: "#bfe7c4",
    alignItems: "center",
    justifyContent: "center"
  },
  digitButtonText: {
    color: "#2f7d32",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18
  },
  digitInput: {
    width: 34,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeedd",
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  exerciseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  exerciseCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 4,
    alignItems: "flex-start"
  },
  exerciseCardActive: {
    backgroundColor: "#2f7d32",
    borderColor: "#2f7d32"
  },
  exerciseEmoji: {
    fontSize: 22
  },
  exerciseTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900"
  },
  exerciseTitleActive: {
    color: "#ffffff"
  },
  onboardingSteps: {
    flexDirection: "row",
    gap: 8
  },
  onboardingStep: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  onboardingStepActive: {
    backgroundColor: "#49b84f",
    borderColor: "#49b84f"
  },
  onboardingStepText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "900"
  },
  onboardingStepTextActive: {
    color: "#ffffff"
  },
  navStepButton: {
    flex: 1
  },
  quickMealGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  quickMealChip: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#dbeedd",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    gap: 3
  },
  quickMealChipActive: {
    backgroundColor: "#2f7d32",
    borderColor: "#2f7d32"
  },
  quickMealTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900"
  },
  quickMealTitleActive: {
    color: "#ffffff"
  },
  quickMealMetaActive: {
    color: "#dcfce7"
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: "top"
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metricTile: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8fafc"
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800"
  },
  metricLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700"
  },
  progressStack: {
    gap: 8
  },
  progressCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    gap: 6
  },
  progressValue: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700"
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#1d4ed8"
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  summaryTile: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8fafc"
  },
  noticeBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    gap: 4
  },
  statsBlock: {
    gap: 4
  },
  statsLine: {
    color: "#1f2937"
  },
  status: {
    color: "#475569",
    textAlign: "center"
  },
  small: {
    color: "#475569",
    fontSize: 12
  },
  authScreen: {
    minHeight: 700,
    justifyContent: "center",
    gap: 18
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#49b84f",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18
  },
  logoText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900"
  },
  authTitle: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center"
  },
  authSubtitle: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center"
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8
  },
  linkButtonText: {
    color: "#49b84f",
    fontSize: 16,
    fontWeight: "800"
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 4
  },
  screenTitleBlock: {
    flex: 1
  },
  screenTitle: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900"
  },
  screenSubtitle: {
    color: "#6b7280",
    fontSize: 16,
    marginTop: 2
  },
  headerIconButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#49b84f",
    alignItems: "center",
    justifyContent: "center"
  },
  headerIconText: {
    color: "#49b84f",
    fontSize: 18,
    fontWeight: "900"
  },
  headerIconButtonText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900"
  },
  bottomNav: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 18,
    minHeight: 76,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#edf2f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#0f172a",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    paddingHorizontal: 8
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: 4
  },
  bottomNavIcon: {
    color: "#6b7280",
    fontSize: 18,
    fontWeight: "900"
  },
  bottomNavIconActive: {
    color: "#49b84f"
  },
  bottomNavLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700"
  },
  bottomNavLabelActive: {
    color: "#49b84f"
  },
  moreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4
  },
  compactDateInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f8fbfd",
    color: "#475569"
  },
  mealCard: {
    borderWidth: 1,
    borderColor: "#edf2f7",
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#ffffff",
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#e8f7ea",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  badgeText: {
    color: "#2f7d32",
    fontWeight: "900"
  },
  macroRow: {
    flexDirection: "row",
    gap: 10
  },
  macroBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#f6f9fb",
    padding: 12
  },
  floatingAddButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2f7d32",
    alignItems: "center",
    justifyContent: "center"
  },
  floatingAddText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "300"
  },
  profileHero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
    gap: 10
  },
  settingsButton: {
    alignSelf: "flex-end",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#49b84f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: "#edf9ef"
  },
  profileName: {
    color: "#0f172a",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center"
  },
  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e8f7ea",
    alignItems: "center",
    justifyContent: "center"
  },
  sessionFooter: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8
  }
});
