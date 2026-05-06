import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  API_URL,
  checkBackend as pingBackend,
  createMeal,
  getDailyRecommendations,
  createWorkout,
  getProfile,
  getReminderSettings,
  getMe,
  getSummary,
  listMeals,
  listWorkouts,
  login,
  logout,
  signup,
  updateReminderSettings,
  updateProfile
} from "./src/api";
import type { DailyRecommendations, DashboardSummary, Meal, Profile, ReminderSettings, Workout } from "./src/types";

type Tab = "dashboard" | "meals" | "workouts" | "profile" | "coach";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function App() {
  const [email, setEmail] = useState("mvp@example.com");
  const [password, setPassword] = useState("StrongPass123");
  const [name, setName] = useState("MVP User");

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
      const message = String(error);
      setStatus(message);
      Alert.alert("Backend Connection Problem", message);
    }
  }

  async function hydrateApp(nextToken: string, nextDate = activeDate) {
    setStatus("Loading app data...");
    const [nextUser, nextProfile, nextSummary, nextMeals, nextWorkouts, nextRecommendations, nextReminderSettings] =
      await Promise.all([
      getMe(nextToken),
      getProfile(nextToken),
      getSummary(nextToken, nextDate),
      listMeals(nextToken, nextDate),
      listWorkouts(nextToken, nextDate),
      getDailyRecommendations(nextToken, nextDate),
      getReminderSettings(nextToken)
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
        fats: toNumber(mealFats)
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
        caloriesBurned: toNumber(workoutCalories)
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
        frequency: reminderFrequency as "daily" | "weekdays" | "custom"
      });
      setReminderSettings(updated);
      setStatus("Reminder settings updated");
    } catch (error) {
      setStatus(String(error));
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }
    hydrateApp(token, activeDate).catch((error) => setStatus(String(error)));
  }, [activeDate]);

  function renderAuthView() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Authentication</Text>
        <TouchableOpacity style={styles.fullButton} onPress={checkBackend}>
          <Text style={styles.buttonText}>Check Backend</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 8 chars)"
          secureTextEntry
        />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={runSignup}>
            <Text style={styles.buttonText}>Signup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={runLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
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

  function renderDashboard() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Dashboard</Text>
        <TextInput
          style={styles.input}
          value={activeDate}
          onChangeText={setActiveDate}
          placeholder="YYYY-MM-DD"
        />
        <TouchableOpacity style={styles.fullButton} onPress={refreshAll}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        {summary ? (
          <View style={styles.statsBlock}>
            <Text style={styles.statsLine}>Date: {summary.date}</Text>
            <Text style={styles.statsLine}>Calories In: {summary.totalCaloriesIn}</Text>
            <Text style={styles.statsLine}>Calories Out: {summary.totalCaloriesOut}</Text>
            <Text style={styles.statsLine}>Net Calories: {summary.netCalories}</Text>
            <Text style={styles.statsLine}>Workout Minutes: {summary.workoutMinutes}</Text>
            <Text style={styles.statsLine}>Meals: {summary.mealsCount}</Text>
            <Text style={styles.statsLine}>Workouts: {summary.workoutsCount}</Text>
            <Text style={styles.statsLine}>
              Macros (P/C/F): {summary.macros.protein}/{summary.macros.carbs}/{summary.macros.fats}
            </Text>
          </View>
        ) : (
          <Text style={styles.small}>No summary loaded yet.</Text>
        )}
      </View>
    );
  }

  function renderMeals() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Meals</Text>
        <TextInput style={styles.input} value={mealName} onChangeText={setMealName} placeholder="Meal name" />
        <TextInput
          style={styles.input}
          value={mealCalories}
          onChangeText={setMealCalories}
          placeholder="Calories"
          keyboardType="numeric"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            value={mealProtein}
            onChangeText={setMealProtein}
            placeholder="Protein"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.half]}
            value={mealCarbs}
            onChangeText={setMealCarbs}
            placeholder="Carbs"
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          value={mealFats}
          onChangeText={setMealFats}
          placeholder="Fats"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.fullButton} onPress={addMealAndRefresh}>
          <Text style={styles.buttonText}>Add Meal</Text>
        </TouchableOpacity>
        <Text style={styles.subsection}>Meal History ({meals.length})</Text>
        {meals.length === 0 ? (
          <Text style={styles.small}>No meals for selected date.</Text>
        ) : (
          meals.map((item) => (
            <View style={styles.listItem} key={item.id}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.small}>
                kcal {item.calories} | P/C/F {item.protein}/{item.carbs}/{item.fats}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  }

  function renderWorkouts() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Workouts</Text>
        <TextInput
          style={styles.input}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
        />
        <TextInput
          style={styles.input}
          value={workoutDuration}
          onChangeText={setWorkoutDuration}
          placeholder="Duration minutes"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={workoutCalories}
          onChangeText={setWorkoutCalories}
          placeholder="Calories burned"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.fullButton} onPress={addWorkoutAndRefresh}>
          <Text style={styles.buttonText}>Add Workout</Text>
        </TouchableOpacity>
        <Text style={styles.subsection}>Workout History ({workouts.length})</Text>
        {workouts.length === 0 ? (
          <Text style={styles.small}>No workouts for selected date.</Text>
        ) : (
          workouts.map((item) => (
            <View style={styles.listItem} key={item.id}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.small}>
                {item.durationMinutes} min | burned {item.caloriesBurned} kcal
              </Text>
            </View>
          ))
        )}
      </View>
    );
  }

  function renderProfile() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Profile</Text>
        <TextInput
          style={styles.input}
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Display name"
        />
        <TextInput
          style={styles.input}
          value={goalCalories}
          onChangeText={setGoalCalories}
          placeholder="Goal calories"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={goalWorkouts}
          onChangeText={setGoalWorkouts}
          placeholder="Goal workouts per week"
          keyboardType="numeric"
        />
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
    );
  }

  function renderCoach() {
    return (
      <View style={styles.card}>
        <Text style={styles.section}>Coach</Text>
        <Text style={styles.subsection}>Daily Recommendations</Text>
        {recommendations ? (
          <>
            <Text style={styles.small}>Date: {recommendations.date}</Text>
            <Text style={styles.small}>{recommendations.disclaimer}</Text>
            {recommendations.tips.map((tip, index) => (
              <View style={styles.listItem} key={`${tip.area}-${index}`}>
                <Text style={styles.itemTitle}>
                  {tip.area.toUpperCase()}: {tip.title}
                </Text>
                <Text style={styles.small}>{tip.message}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.small}>No recommendations loaded yet.</Text>
        )}

        <Text style={styles.subsection}>Reminder Settings</Text>
        <TextInput
          style={styles.input}
          value={reminderEnabled}
          onChangeText={setReminderEnabled}
          placeholder="enabled: true/false"
        />
        <TextInput
          style={styles.input}
          value={reminderTime}
          onChangeText={setReminderTime}
          placeholder="HH:MM"
        />
        <TextInput
          style={styles.input}
          value={reminderFrequency}
          onChangeText={setReminderFrequency}
          placeholder="daily | weekdays | custom"
        />
        <TouchableOpacity style={styles.fullButton} onPress={saveReminders}>
          <Text style={styles.buttonText}>Save Reminder Settings</Text>
        </TouchableOpacity>
        {reminderSettings ? (
          <Text style={styles.small}>Last reminder update: {new Date(reminderSettings.updatedAt).toLocaleString()}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ENS492 Mobile MVP</Text>
        <Text style={styles.subtitle}>Month 1 core application</Text>
        <Text style={styles.small}>API: {API_URL}</Text>

        {!token ? (
          renderAuthView()
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.section}>Session</Text>
              <Text style={styles.small}>User: {userEmail || email}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={refreshAll}>
                  <Text style={styles.buttonText}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDanger} onPress={runLogout}>
                  <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tabsRow}>
              {renderTabButton("dashboard", "Dashboard")}
              {renderTabButton("meals", "Meals")}
              {renderTabButton("workouts", "Workouts")}
              {renderTabButton("profile", "Profile")}
              {renderTabButton("coach", "Coach")}
            </View>

            {tab === "dashboard" ? renderDashboard() : null}
            {tab === "meals" ? renderMeals() : null}
            {tab === "workouts" ? renderWorkouts() : null}
            {tab === "profile" ? renderProfile() : null}
            {tab === "coach" ? renderCoach() : null}
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.section}>Status</Text>
          <Text style={styles.status}>{status}</Text>
          <Text style={styles.small}>Token: {token ? "set" : "not set"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  container: {
    padding: 16,
    gap: 12
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 12,
    gap: 8
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
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
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  half: {
    flex: 1
  },
  button: {
    flex: 1,
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonDanger: {
    flex: 1,
    backgroundColor: "#b91c1c",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  fullButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600"
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
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8"
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
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#f8fafc"
  },
  itemTitle: {
    fontWeight: "600",
    color: "#0f172a"
  },
  statsBlock: {
    gap: 4
  },
  statsLine: {
    color: "#1f2937"
  },
  status: {
    color: "#111827"
  },
  small: {
    color: "#475569",
    fontSize: 12
  }
});
