import type {
  AddMealTemplateToLogPayload,
  AuthResponse,
  CoachMealSuggestionRequest,
  CoachMealSuggestions,
  CoachTodayPlan,
  CoachWeeklyReview,
  CreateFoodItemPayload,
  CreateMealPayload,
  CreateMealFromFoodItemPayload,
  CreateMealTemplatePayload,
  CreateSocialPostPayload,
  CreateWorkoutPayload,
  DailyCheckIn,
  DailyRecommendations,
  DashboardSummary,
  FoodItem,
  FoodItemListOptions,
  FollowResponse,
  HealthResponse,
  LogoutResponse,
  Meal,
  MealTemplate,
  NutritionFoodSearchOptions,
  NutritionFoodSearchResponse,
  NutritionTargets,
  OnboardingProfilePayload,
  Profile,
  ProfileUpdatePayload,
  ReminderSettings,
  ReminderSettingsUpdatePayload,
  SocialPost,
  SocialPostCommentResponse,
  SocialPostLikeResponse,
  SocialUser,
  UpsertDailyCheckInPayload,
  User,
  Workout,
  WorkoutRecommendation
} from "./types";
import { NativeModules, Platform } from "react-native";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

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

export async function checkBackend(): Promise<HealthResponse> {
  return request<HealthResponse>("/health", "GET");
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
  payload: ProfileUpdatePayload
): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/profile", "PUT", token, payload);
  return data.profile;
}

export async function updateOnboardingProfile(
  token: string,
  payload: OnboardingProfilePayload
): Promise<Profile> {
  const data = await request<{ profile: Profile }>("/profile/onboarding", "PUT", token, payload);
  return data.profile;
}

export async function getNutritionTargets(token: string): Promise<NutritionTargets> {
  const data = await request<{ targets: NutritionTargets }>("/nutrition/targets", "GET", token);
  return data.targets;
}

export async function createMeal(token: string, payload: CreateMealPayload): Promise<Meal> {
  const data = await request<{ meal: Meal }>("/meals", "POST", token, payload);
  return data.meal;
}

export async function listFoodItems(
  token: string,
  options: FoodItemListOptions = {}
): Promise<FoodItem[]> {
  const params = new URLSearchParams();
  if (options.query) {
    params.set("query", options.query);
  }
  if (options.filter) {
    params.set("filter", options.filter);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await request<{ foodItems: FoodItem[] }>(`/food-items${suffix}`, "GET", token);
  return data.foodItems;
}

export async function createFoodItem(
  token: string,
  payload: CreateFoodItemPayload
): Promise<FoodItem> {
  const data = await request<{ foodItem: FoodItem }>("/food-items", "POST", token, payload);
  return data.foodItem;
}

export async function createMealFromFoodItem(
  token: string,
  payload: CreateMealFromFoodItemPayload
): Promise<Meal> {
  const data = await request<{ meal: Meal }>("/meals/from-food-item", "POST", token, payload);
  return data.meal;
}

export async function listMealTemplates(token: string): Promise<MealTemplate[]> {
  const data = await request<{ mealTemplates: MealTemplate[] }>("/meal-templates", "GET", token);
  return data.mealTemplates;
}

export async function createMealTemplate(
  token: string,
  payload: CreateMealTemplatePayload
): Promise<MealTemplate> {
  const data = await request<{ mealTemplate: MealTemplate }>("/meal-templates", "POST", token, payload);
  return data.mealTemplate;
}

export async function addMealTemplateToLog(
  token: string,
  payload: AddMealTemplateToLogPayload
): Promise<Meal> {
  const data = await request<{ meal: Meal }>("/meal-templates/add-to-log", "POST", token, payload);
  return data.meal;
}

export async function createWorkout(
  token: string,
  payload: CreateWorkoutPayload
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

export async function searchNutritionFoods(
  token: string,
  query: string,
  options: NutritionFoodSearchOptions = {}
): Promise<NutritionFoodSearchResponse> {
  const params = new URLSearchParams({
    query,
    limit: String(options.limit ?? 8)
  });
  if (options.page !== undefined) {
    params.set("page", String(options.page));
  }
  const suffix = `?${params.toString()}`;
  return request<NutritionFoodSearchResponse>(`/nutrition/foods/search${suffix}`, "GET", token);
}

export async function listWorkouts(token: string, date?: string): Promise<Workout[]> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ workouts: Workout[] }>(`/workouts${suffix}`, "GET", token);
  return data.workouts;
}

export async function getDailyCheckIn(token: string, date?: string): Promise<DailyCheckIn | null> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ checkIn: DailyCheckIn | null }>(`/check-ins/daily${suffix}`, "GET", token);
  return data.checkIn;
}

export async function upsertDailyCheckIn(
  token: string,
  payload: UpsertDailyCheckInPayload
): Promise<DailyCheckIn> {
  const data = await request<{ checkIn: DailyCheckIn }>("/check-ins/daily", "POST", token, payload);
  return data.checkIn;
}

export async function getWorkoutRecommendation(
  token: string,
  date?: string
): Promise<WorkoutRecommendation> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  const data = await request<{ recommendation: WorkoutRecommendation }>(
    `/workouts/recommendation${suffix}`,
    "GET",
    token
  );
  return data.recommendation;
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

export async function getCoachMealSuggestions(
  token: string,
  payload: CoachMealSuggestionRequest = {}
): Promise<CoachMealSuggestions> {
  const data = await request<{ suggestions: CoachMealSuggestions }>("/coach/meal-suggestions", "POST", token, payload);
  return data.suggestions;
}

export async function getCoachTodayPlan(
  token: string,
  date?: string,
  mode?: string
): Promise<CoachTodayPlan> {
  const params = new URLSearchParams();
  if (date) {
    params.set("date", date);
  }
  if (mode) {
    params.set("mode", mode);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const data = await request<{ plan: CoachTodayPlan }>(`/coach/today-plan${suffix}`, "GET", token);
  return data.plan;
}

export async function getCoachWeeklyReview(
  token: string,
  weekStart?: string
): Promise<CoachWeeklyReview> {
  const suffix = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  const data = await request<{ review: CoachWeeklyReview }>(`/coach/weekly-review${suffix}`, "GET", token);
  return data.review;
}

export async function getReminderSettings(token: string): Promise<ReminderSettings> {
  const data = await request<{ settings: ReminderSettings }>("/reminders/settings", "GET", token);
  return data.settings;
}

export async function updateReminderSettings(
  token: string,
  payload: ReminderSettingsUpdatePayload
): Promise<ReminderSettings> {
  const data = await request<{ settings: ReminderSettings }>("/reminders/settings", "PUT", token, payload);
  return data.settings;
}

export async function searchUsers(token: string, query: string): Promise<SocialUser[]> {
  const suffix = `?query=${encodeURIComponent(query)}`;
  const data = await request<{ users: SocialUser[] }>(`/users${suffix}`, "GET", token);
  return data.users;
}

export async function followUser(token: string, targetUserId: number): Promise<FollowResponse> {
  return request<FollowResponse>("/social/follow", "POST", token, { targetUserId });
}

export async function unfollowUser(token: string, targetUserId: number): Promise<FollowResponse> {
  return request<FollowResponse>("/social/unfollow", "POST", token, { targetUserId });
}

export async function listFollowing(token: string): Promise<SocialUser[]> {
  const data = await request<{ users: SocialUser[] }>("/social/following", "GET", token);
  return data.users;
}

export async function listFollowers(token: string): Promise<SocialUser[]> {
  const data = await request<{ users: SocialUser[] }>("/social/followers", "GET", token);
  return data.users;
}

export async function createSocialPost(
  token: string,
  payload: CreateSocialPostPayload
): Promise<SocialPost> {
  const data = await request<{ post: SocialPost }>("/social/posts", "POST", token, payload);
  return data.post;
}

export async function getSocialFeed(token: string): Promise<SocialPost[]> {
  const data = await request<{ posts: SocialPost[] }>("/social/feed", "GET", token);
  return data.posts;
}

export async function likeSocialPost(token: string, postId: number): Promise<SocialPostLikeResponse> {
  return request<SocialPostLikeResponse>("/social/posts/like", "POST", token, { postId });
}

export async function commentOnSocialPost(
  token: string,
  postId: number,
  text: string
): Promise<SocialPostCommentResponse> {
  return request<SocialPostCommentResponse>("/social/posts/comment", "POST", token, { postId, text });
}

export async function copySocialPostToLog(
  token: string,
  postId: number,
  mealType?: string
): Promise<Meal> {
  const payload = mealType ? { postId, mealType } : { postId };
  const data = await request<{ meal: Meal }>("/social/posts/copy-to-log", "POST", token, payload);
  return data.meal;
}
