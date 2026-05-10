import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { AppCard } from "../components/AppCard";
import { ProgressBar } from "../components/ProgressBar";
import { StatCard } from "../components/StatCard";

type Props = {
  summary?: any;
};

export function HomeScreen({
  summary,
}: Props) {

  const caloriesIn =
    summary?.totalCaloriesIn ?? 0;

  const caloriesGoal =
    summary?.goals?.goalCalories ?? 2000;
      const proteinGoal = Math.round((caloriesGoal * 0.3) / 4);
  const carbsGoal = Math.round((caloriesGoal * 0.45) / 4);
  const fatsGoal = Math.round((caloriesGoal * 0.25) / 9);

  const caloriesProgress =
    Math.min(
      caloriesIn / caloriesGoal,
      1
    );

  const workoutsCount =
    summary?.workoutsCount ?? 0;

  const workoutGoal =
    summary?.goals?.goalWorkoutsPerWeek ?? 4;

  const workoutProgress =
    Math.min(
      workoutsCount / workoutGoal,
      1
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Welcome back
          </Text>

          <Text style={styles.name}>
            Healthy Life, Happy Life
          </Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={24}
            color="white"
          />
        </View>
      </View>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Nutrition Goal
          </Text>

          <Ionicons
            name="restaurant"
            size={24}
            color={colors.primary}
          />
        </View>

        <Text style={styles.bigValue}>
          {caloriesIn} / {caloriesGoal} kcal
        </Text>

        <ProgressBar
          progress={caloriesProgress}
          color={colors.calories}
        />

        <Text style={styles.goalText}>
          {Math.round(caloriesProgress * 100)}%
          of calorie goal completed
        </Text>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Workout Goal
          </Text>

          <Ionicons
            name="barbell"
            size={24}
            color={colors.primary}
          />
        </View>

        <Text style={styles.bigValue}>
          {workoutsCount} / {workoutGoal}
          workouts
        </Text>

        <ProgressBar
          progress={workoutProgress}
          color={colors.primary}
        />

        <Text style={styles.goalText}>
          {Math.round(workoutProgress * 100)}%
          of workout goal completed
        </Text>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard
  label="Protein"
  value={`${summary?.macros?.protein ?? 0}g / ${proteinGoal}g`}
  color={colors.protein}
/>

<StatCard
  label="Carbs"
  value={`${summary?.macros?.carbs ?? 0}g / ${carbsGoal}g`}
  color={colors.carbs}
/>

<StatCard
  label="Fats"
  value={`${summary?.macros?.fats ?? 0}g / ${fatsGoal}g`}
  color={colors.fats}
/>
      </View>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Daily Recommended Workout
          </Text>

          <Ionicons
            name="fitness"
            size={24}
            color={colors.primary}
          />
        </View>

        <Text style={styles.workoutTitle}>
          Full Body Strength
        </Text>

        <Text style={styles.workoutInfo}>
          45 min • Intermediate
        </Text>

        <View style={styles.workoutStats}>
          <View style={styles.workoutBadge}>
            <Ionicons
              name="flash"
              size={16}
              color={colors.orange}
            />

            <Text style={styles.badgeText}>
              420 kcal
            </Text>
          </View>

          <View style={styles.workoutBadge}>
            <Ionicons
              name="barbell"
              size={16}
              color={colors.primary}
            />

            <Text style={styles.badgeText}>
              12 Exercises
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Coach Insight
          </Text>

          <Ionicons
            name="sparkles"
            size={22}
            color={colors.primary}
          />
        </View>

        <Text style={styles.coachText}>
          Your consistency is improving.
          Keep balancing nutrition and
          workouts while prioritizing
          hydration and recovery.
        </Text>
      </AppCard>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  greeting: {
    color: colors.textLight,
    fontSize: 14,
  },

  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  bigValue: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 14,
  },

  goalText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  workoutTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },

  workoutInfo: {
    color: colors.textLight,
    marginTop: 4,
    marginBottom: 18,
  },

  workoutStats: {
    flexDirection: "row",
    gap: 10,
  },

  workoutBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  badgeText: {
    color: colors.text,
    fontWeight: "600",
  },

  coachText: {
    color: colors.textLight,
    lineHeight: 24,
    fontSize: 15,
  },
});