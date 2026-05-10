import { useEffect, useState } from "react";
import {
  checkBackend as pingBackend,
  createMeal,
  createWorkout,
  getDailyRecommendations,
  getMe,
  getProfile,
  getReminderSettings,
  getSummary,
  listMeals,
  listWorkouts,
  login,
  logout,
  signup,
  updateProfile,
  updateReminderSettings,
} from "../api";

import type {
  DailyRecommendations,
  DashboardSummary,
  Meal,
  Profile,
  ReminderSettings,
  Workout,
} from "../types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useAppData() {
  const [email, setEmail] = useState("mvp@example.com");
  const [password, setPassword] = useState("StrongPass123");
  const [name, setName] = useState("MVP User");

  const [token, setToken] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState("Ready");
  const [activeDate, setActiveDate] = useState(todayKey());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recommendations, setRecommendations] =
    useState<DailyRecommendations | null>(null);
  const [reminderSettings, setReminderSettings] =
    useState<ReminderSettings | null>(null);

  const [mealName, setMealName] = useState("Chicken Bowl");
  const [mealCalories, setMealCalories] = useState("650");
  const [mealProtein, setMealProtein] = useState("45");
  const [mealCarbs, setMealCarbs] = useState("50");
  const [mealFats, setMealFats] = useState("20");

  const [workoutName, setWorkoutName] = useState("Push Day");
  const [workoutDuration, setWorkoutDuration] = useState("60");
  const [workoutCalories, setWorkoutCalories] = useState("350");

  const [profileName, setProfileName] = useState("");
  const [goalCalories, setGoalCalories] = useState("2200");
  const [goalWorkouts, setGoalWorkouts] = useState("4");

  const [reminderEnabled, setReminderEnabled] = useState("false");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [reminderFrequency, setReminderFrequency] = useState("daily");

  async function checkBackend() {
    try {
      setStatus("Checking backend...");
      const health = await pingBackend();
      setStatus(`Backend reachable: ${health.service}`);
    } catch (error) {
      setStatus(String(error));
    }
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
    ] = await Promise.all([
      getMe(nextToken),
      getProfile(nextToken),
      getSummary(nextToken, nextDate),
      listMeals(nextToken, nextDate),
      listWorkouts(nextToken, nextDate),
      getDailyRecommendations(nextToken, nextDate),
      getReminderSettings(nextToken),
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
    setReminderEnabled(String(nextReminderSettings.enabled));
    setReminderTime(nextReminderSettings.reminderTime);
    setReminderFrequency(nextReminderSettings.frequency);
    setStatus("Data loaded");
  }

  async function runSignup() {
    try {
      setStatus("Signing up...");
      const data = await signup(email, password, name);
      setToken(data.token);
      setUserEmail(data.user.email);
      await hydrateApp(data.token);
      setStatus("Signup successful");
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
    if (!token) return;

    try {
      await logout(token);
    } catch {
      // Still clear client state even if backend logout fails.
    }

    setToken("");
    setUserEmail("");
    setProfile(null);
    setSummary(null);
    setMeals([]);
    setWorkouts([]);
    setRecommendations(null);
    setReminderSettings(null);
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
      });
      await hydrateApp(token);
      setStatus("Meal saved");
    } catch (error) {
      setStatus(String(error));
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
        name: workoutName,
        durationMinutes: toNumber(workoutDuration),
        caloriesBurned: toNumber(workoutCalories),
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
        goalWorkoutsPerWeek: toNumber(goalWorkouts, 4),
      });
      setProfile(updated);
      setStatus("Profile updated");
    } catch (error) {
      setStatus(String(error));
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
        enabled: reminderEnabled === "true",
        reminderTime,
        frequency: reminderFrequency as "daily" | "weekdays" | "custom",
      });
      setReminderSettings(updated);
      setStatus("Reminder settings updated");
    } catch (error) {
      setStatus(String(error));
    }
  }

  useEffect(() => {
    if (!token) return;

    hydrateApp(token, activeDate).catch((error) =>
      setStatus(String(error))
    );
  }, [activeDate]);

  return {
    auth: {
      email,
      setEmail,
      password,
      setPassword,
      name,
      setName,
      token,
      userEmail,
      runSignup,
      runLogin,
      runLogout,
      checkBackend,
    },

    app: {
      status,
      activeDate,
      setActiveDate,
      refreshAll,
    },

    dashboard: {
      profile,
      summary,
      recommendations,
    },

    meals: {
  meals,
  refreshMeals: async () => {
    const refreshedMeals = await listMeals(
      token,
      activeDate
    );

    setMeals(refreshedMeals);
  },

  mealName,
  setMealName,
      mealCalories,
      setMealCalories,
      mealProtein,
      setMealProtein,
      mealCarbs,
      setMealCarbs,
      mealFats,
      setMealFats,
      addMealAndRefresh,
    },

    workouts: {
      workouts,
      workoutName,
      setWorkoutName,
      workoutDuration,
      setWorkoutDuration,
      workoutCalories,
      setWorkoutCalories,
      refreshWorkouts: async () => {
  const refreshedWorkouts =
    await listWorkouts(
      token,
      todayKey()
    );

  setWorkouts(refreshedWorkouts);
},
      addWorkoutAndRefresh,
    },

    profileSettings: {
      profileName,
      setProfileName,
      goalCalories,
      setGoalCalories,
      goalWorkouts,
      setGoalWorkouts,
      saveProfile,
    },

    reminders: {
      reminderSettings,
      reminderEnabled,
      setReminderEnabled,
      reminderTime,
      setReminderTime,
      reminderFrequency,
      setReminderFrequency,
      saveReminders,
    },
  };
}