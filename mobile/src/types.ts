export type User = {
  id: number;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type HealthResponse = {
  status: string;
  service: string;
  dbProvider?: string;
};

export type Profile = {
  userId: number;
  name: string;
  goalCalories: number;
  goalWorkoutsPerWeek: number;
  age?: number;
  sex?: "female" | "male" | "other";
  gender?: "female" | "male" | "other";
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goalType?: GoalType;
  dietPreference?: string;
  privacyPreference?: PrivacyPreference;
  restrictions?: string[];
  allergies?: string[];
  bmr?: number;
  tdee?: number;
  dailyCalorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  updatedAt: string;
};

export type ProfileUpdatePayload = Partial<Pick<Profile, "name" | "goalCalories" | "goalWorkoutsPerWeek">>;

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "light"
  | "moderately_active"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType =
  | "lose_weight"
  | "fat_loss"
  | "lose_fat"
  | "maintain"
  | "maintenance"
  | "gain_muscle"
  | "muscle_gain"
  | "gain_weight";

export type PrivacyPreference = "private" | "friends" | "public";

export type OnboardingProfilePayload = ProfileUpdatePayload & {
  age?: number;
  sex?: Profile["sex"];
  gender?: Profile["gender"];
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goalType?: GoalType;
  dietPreference?: string;
  privacyPreference?: PrivacyPreference;
  restrictions?: string[];
  allergies?: string[];
};

export type NutritionTargets = {
  bmr: number | null;
  tdee: number | null;
  dailyCalorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  activityLevel: ActivityLevel | null;
  goalType: GoalType | null;
};

export type Meal = {
  id: number;
  userId: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType?: string;
  foodItemId?: number;
  servingMultiplier?: number;
  copiedFromPostId?: number;
  copiedFromUserId?: number;
  loggedAt: string;
};

export type CreateMealPayload = {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  mealType?: string;
  loggedAt?: string;
};

export type FoodItem = {
  id: number;
  name: string;
  brand: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  dietTags: string[];
  allergens: string[];
  source: "seed" | "user" | string;
  createdByUserId?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateFoodItemPayload = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  brand?: string;
  category?: string;
  dietTags?: string[];
  allergens?: string[];
};

export type FoodItemListOptions = {
  query?: string;
  filter?: string;
};

export type CreateMealFromFoodItemPayload = {
  foodItemId: number;
  servingMultiplier?: number;
  name?: string;
  mealType?: string;
  loggedAt?: string;
};

export type MealTemplateItemInput = {
  foodItemId: number;
  servingMultiplier?: number;
};

export type MealTemplateItem = {
  foodItemId: number;
  name: string;
  servingMultiplier: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type MacroNutrients = {
  protein: number;
  carbs: number;
  fats: number;
};

export type MealTemplate = {
  id: number;
  userId: number;
  name: string;
  mealType?: string;
  items: MealTemplateItem[];
  totals: MacroTotals;
  createdAt: string;
  updatedAt: string;
};

export type CreateMealTemplatePayload = {
  name: string;
  mealType?: string;
  items: MealTemplateItemInput[];
};

export type AddMealTemplateToLogPayload = {
  templateId: number;
  name?: string;
  mealType?: string;
  loggedAt?: string;
};

export type Workout = {
  id: number;
  userId: number;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  loggedAt: string;
};

export type CreateWorkoutPayload = {
  name: string;
  durationMinutes: number;
  caloriesBurned?: number;
  loggedAt?: string;
};

export type DailyCheckIn = {
  id: number;
  userId: number;
  date: string;
  energyLevel?: number;
  mood?: number;
  soreness?: number;
  sleepHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertDailyCheckInPayload = {
  date?: string;
  energyLevel?: number;
  mood?: number;
  soreness?: number;
  sleepHours?: number;
  notes?: string;
};

export type WorkoutRecommendation = {
  date: string;
  title: string;
  workoutType: "recovery" | "mobility" | "strength" | "cardio" | string;
  durationMinutes: number;
  intensity: "low" | "moderate" | "high" | string;
  reason: string;
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

export type ReminderSettingsUpdatePayload = Partial<Pick<ReminderSettings, "enabled" | "reminderTime" | "frequency">>;

export type RecommendationTip = {
  area: "nutrition" | "workout" | "recovery" | "consistency";
  title: string;
  message: string;
};

export type DailyRecommendations = {
  date: string;
  disclaimer: string;
  tips: RecommendationTip[];
  source?: "rules" | "llm";
};

export type CoachMealSuggestionRequest = {
  availableIngredients?: string[];
  timeAvailableMinutes?: number;
  hungerLevel?: string;
  budgetPreference?: string;
};

export type CoachMealSuggestion = {
  title: string;
  mealType: string;
  description: string;
  calories: number;
  macros: MacroNutrients;
  ingredients: string[];
  rationale: string;
};

export type CoachMealSuggestions = {
  disclaimer: string;
  suggestions: CoachMealSuggestion[];
  source: "llm" | "fallback" | string;
};

export type CoachWeeklyReview = {
  disclaimer: string;
  summary: string;
  highlights: string[];
  risks: string[];
  nextWeekFocus: string[];
  metrics: {
    avgCalories: number | null;
    workoutMinutes: number | null;
    workouts: number | null;
    proteinAvg: number | null;
  };
  source: "llm" | "fallback" | string;
};

export type SocialPostAuthor = {
  userId: number;
  name: string;
};

export type SocialPostMeal = {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  loggedAt: string;
};

export type SocialPostComment = {
  id: number;
  postId: number;
  userId: number;
  author: SocialPostAuthor;
  text: string;
  createdAt: string;
};

export type SocialPost = {
  id: number;
  userId: number;
  author: SocialPostAuthor;
  caption: string;
  visibility: "public" | "friends" | "private";
  privacy: {
    hideCalories: boolean;
    hideMeasurements: boolean;
  };
  hiddenFields: string[];
  meal: SocialPostMeal;
  likeCount: number;
  likedByViewer: boolean;
  commentCount: number;
  comments: SocialPostComment[];
  createdAt: string;
};

export type CreateSocialPostPayload = {
  mealId?: number;
  templateId?: number;
  mealTemplateId?: number;
  meal?: CreateMealPayload;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  loggedAt?: string;
  mealType?: string;
  caption?: string;
  visibility?: SocialPost["visibility"];
  privacy?: Partial<SocialPost["privacy"]>;
};

export type SocialPostLikeResponse = {
  liked: true;
  post: SocialPost;
};

export type SocialPostCommentResponse = {
  comment: SocialPostComment;
  post: SocialPost;
};

export type NutritionFood = {
  foodId: string;
  name: string;
  brandName: string;
  type: string;
  url: string;
  description: string;
  servingDescription: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
};

export type NutritionFoodSearchResponse = {
  query: string;
  pageNumber: number;
  maxResults: number;
  totalResults: number;
  foods: NutritionFood[];
};

export type NutritionFoodSearchOptions = {
  page?: number;
  limit?: number;
};

export type SocialUser = {
  userId: number;
  email: string;
  name: string;
};

export type FollowResponse = {
  followed: boolean;
};
