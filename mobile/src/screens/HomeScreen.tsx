import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { AppCard } from "../components/AppCard";
import { StatCard } from "../components/StatCard";
import { ProgressBar } from "../components/ProgressBar";

type Props = {
  summary?: any;
};

export function HomeScreen({ summary }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>Healthy Life, Happy Life</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="white" />
        </View>
      </View>

      <AppCard>
        <View style={styles.caloriesHeader}>
          <View>
            <Text style={styles.cardLabel}>Daily Calories</Text>
            <Text style={styles.caloriesValue}>{summary?.totalCaloriesIn ?? 0} kcal</Text>
          </View>

          <View style={styles.iconCircle}>
            <Ionicons
              name="flame"
              size={28}
              color={colors.calories}
            />
          </View>
        </View>

        <ProgressBar
          progress={0.78}
          color={colors.calories}
        />

        <Text style={styles.goalText}>
          78% of daily goal completed
        </Text>
      </AppCard>

      <View style={styles.statsRow}>
        <StatCard
          label="Protein"
          value={`${summary?.macros?.protein ?? 0}g`}
          color={colors.protein}
        />

        <StatCard
          label="Carbs"
          value={`${summary?.macros?.carbs ?? 0}g`}
          color={colors.carbs}
        />

        <StatCard
          label="Fats"
          value={`${summary?.macros?.fats ?? 0}g`}
          color={colors.fats}
        />
      </View>

      <AppCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Today's Workout
          </Text>

          <Ionicons
            name="barbell"
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
              name="fitness"
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
            AI Coach Insight
          </Text>

          <Ionicons
            name="sparkles"
            size={22}
            color={colors.primary}
          />
        </View>

        <Text style={styles.coachText}>
          Your protein intake has improved this week.
          Consider increasing hydration after workouts
          to improve recovery and energy levels.
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

  caloriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  cardLabel: {
    color: colors.textLight,
    fontSize: 14,
  },

  caloriesValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginTop: 4,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
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

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
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