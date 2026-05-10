import type {
  AuthResponse,
  DailyRecommendations,
  DashboardSummary,
  LogoutResponse,
  Meal,
  Profile,
  ReminderSettings,
  User,
  Workout
} from "./types";
import { NativeModules, Platform } from "react-native";

function detectApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  const scriptUrl = NativeModules?.SourceCode?.scriptURL;
  if (typeof scriptUrl === "string" && scriptUrl.length > 0) {
    const normalized = scriptUrl.replace("exp://", "http://").replace("exps://", "https://");
    const hostMatch = normalized.match(/^https?:\/\/([^/:]+)(?::\d+)?/);
    if (hostMatch?.[1]) {
      return `http://${hostMatch[1]}:4000`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }
  return "http://localhost:4000";
}

export const API_URL = detectApiUrl();

function formatError(error: unknown): Error {
  if (error instanceof Error && error.message.includes("Network request failed")) {
    return new Error(
      `Cannot reach backend at ${API_URL}. Start the backend first. If you are using a real phone, set EXPO_PUBLIC_API_URL to your computer's local IP.`
    );
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("Unexpected request failure");
}

async function request<T>(path: string, method: string, token?: string, body?: object): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed for ${path}`);
    }
    return data as T;
  } catch (error) {
    throw formatError(error);
  }
}

export async function checkBackend(): Promise<{ status: string; service: string }> {
  return request<{ status: string; service: string }>("/health", "GET");
}

export function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", "POST", undefined, { email, password, name });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", "POST", undefined, { email, password });
}

export function logout(token: string): Promise<LogoutResponse> {
  return request<LogoutResponse>("/auth/logout", "POST", token);
}

export async function getMe(token: string): Promise<User> {
  const data = await request<{ user: User }>("/auth/me", "GET", token);
  return data.user;
}

export async function getProfile(token: string): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/profile", "GET", token);
  return data.profile;
}

export async function updateProfile(
  token: string,
  payload: Pick<Profile, "name" | "goalCalories" | "goalWorkoutsPerWeek">
): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/profile", "PUT", token, payload);
  return data.profile;
}

export async function completeOnboarding(
  token: string,
  payload: { birthYear: number; gender: string; activityLevel: string; goal: string; weightKg: number; heightCm: number }
): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/profile/onboard", "POST", token, payload);
  return data.profile;
}

export async function createMeal(token: string, payload: Omit<Meal, "id" | "userId" | "loggedAt">): Promise<Meal> {
  const data = await request<{ meal: Meal }>("/meals", "POST", token, payload);
  return data.meal;
}

export async function createWorkout(
  token: string,
  payload: Omit<Workout, "id" | "userId" | "loggedAt">
): Promise<Workout> {
  const data = await request<{ workout: Workout }>("/workouts", "POST", token, payload);
  return data.workout;
}

export async function getSummary(token: string, date?: string): Promise<DashboardSummary> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ summary: DashboardSummary }>(`/dashboard/summary${suffix}`, "GET", token);
  return data.summary;
}

export async function listMeals(token: string, date?: string): Promise<Meal[]> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ meals: Meal[] }>(`/meals${suffix}`, "GET", token);
  return data.meals;
}

export async function listWorkouts(token: string, date?: string): Promise<Workout[]> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ workouts: Workout[] }>(`/workouts${suffix}`, "GET", token);
  return data.workouts;
}

export async function getDailyRecommendations(token: string, date?: string): Promise<DailyRecommendations> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ recommendations: DailyRecommendations }>(
    `/recommendations/daily${suffix}`,
    "GET",
    token
  );
  return data.recommendations;
}

export async function getReminderSettings(token: string): Promise<ReminderSettings> {
  const data = await request<{ settings: ReminderSettings }>("/reminders/settings", "GET", token);
  return data.settings;
}

export async function updateReminderSettings(
  token: string,
  payload: Pick<ReminderSettings, "enabled" | "reminderTime" | "frequency">
): Promise<ReminderSettings> {
  const data = await request<{ settings: ReminderSettings }>("/reminders/settings", "PUT", token, payload);
  return data.settings;
}

// ─── Food Catalog ───────────────────────────────────────
export async function searchFoods(token: string, query?: string, category?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const data = await request<{ foods: any[] }>(`/foods/search?${params}`, "GET", token);
  return data.foods;
}

export async function getFoodCategories(token: string): Promise<string[]> {
  const data = await request<{ categories: string[] }>("/foods/categories", "GET", token);
  return data.categories;
}

export async function addMealFromCatalog(token: string, foodId: number, servings: number): Promise<Meal> {
  const data = await request<{ meal: Meal }>("/meals/from-catalog", "POST", token, { foodId, servings });
  return data.meal;
}

export async function toggleFavorite(token: string, foodId: number): Promise<{ favorited: boolean }> {
  return request<{ favorited: boolean }>("/foods/favorite", "POST", token, { foodId });
}

export async function listFavorites(token: string): Promise<any[]> {
  const data = await request<{ foods: any[] }>("/foods/favorites", "GET", token);
  return data.foods;
}

// ─── Water ──────────────────────────────────────────────
export async function addWater(token: string, amountMl: number) {
  return request<{ log: any }>("/water", "POST", token, { amountMl });
}

export async function getWaterToday(token: string, date?: string) {
  const suffix = date ? `?date=${date}` : "";
  const data = await request<{ water: any }>(`/water${suffix}`, "GET", token);
  return data.water;
}

// ─── Body Measurements ──────────────────────────────────
export async function addMeasurement(token: string, payload: { weightKg?: number; heightCm?: number; note?: string }) {
  const data = await request<{ measurement: any }>("/measurements", "POST", token, payload);
  return data.measurement;
}

export async function listMeasurements(token: string) {
  const data = await request<{ measurements: any[] }>("/measurements", "GET", token);
  return data.measurements;
}

// ─── Workout Templates ──────────────────────────────────
export async function getWorkoutTemplates(token: string, category?: string) {
  const suffix = category ? `?category=${category}` : "";
  const data = await request<{ templates: any[] }>(`/workout-templates${suffix}`, "GET", token);
  return data.templates;
}

export async function logWorkoutFromTemplate(token: string, templateId: number) {
  const data = await request<{ workout: Workout }>("/workouts/from-template", "POST", token, { templateId });
  return data.workout;
}

// ─── Weekly & Streak ────────────────────────────────────
export async function getWeeklySummary(token: string) {
  const data = await request<{ weekly: any[] }>("/dashboard/weekly", "GET", token);
  return data.weekly;
}

export async function getStreak(token: string) {
  const data = await request<{ streak: number }>("/dashboard/streak", "GET", token);
  return data.streak;
}
