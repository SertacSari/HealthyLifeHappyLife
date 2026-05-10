import { useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { AppCard } from "../components/AppCard";

import type { Workout } from "../types";

type Props = {
  workouts: Workout[];
  token: string;
  refreshWorkouts: () => Promise<void>;
  createWorkout: (
    token: string,
    payload: {
      name: string;
      durationMinutes: number;
      caloriesBurned: number;
    }
  ) => Promise<any>;
};

export function WorkoutsScreen({
  workouts,
  token,
  refreshWorkouts,
  createWorkout,
}: Props) {
  const [modalVisible, setModalVisible] =
    useState(false);

  const [workoutName, setWorkoutName] =
    useState("");

  const [duration, setDuration] =
    useState("");

  const [calories, setCalories] =
    useState("");

  async function handleSaveWorkout() {
    try {
      await createWorkout(token, {
        name: workoutName,
        durationMinutes: Number(duration),
        caloriesBurned: Number(calories),
      });

      await refreshWorkouts();

      setWorkoutName("");
      setDuration("");
      setCalories("");

      setModalVisible(false);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Workouts
            </Text>

            <Text style={styles.subtitle}>
              Track your training sessions
            </Text>
          </View>

          <View style={styles.iconCircle}>
            <Ionicons
              name="barbell"
              size={24}
              color="white"
            />
          </View>
        </View>

        {workouts.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyTitle}>
              No workouts logged yet
            </Text>

            <Text style={styles.emptyText}>
              Start tracking workouts to
              monitor progress and calories.
            </Text>
          </AppCard>
        ) : (
          workouts.map((workout) => (
            <AppCard key={workout.id}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>
                  {workout.name}
                </Text>

                <View style={styles.calorieBadge}>
                  <Ionicons
                    name="flame"
                    size={14}
                    color={colors.orange}
                  />

                  <Text style={styles.calorieText}>
                    {workout.caloriesBurned} kcal
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Ionicons
                    name="time"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.statText}>
                    {workout.durationMinutes} min
                  </Text>
                </View>

                <View style={styles.statChip}>
                  <Ionicons
                    name="fitness"
                    size={16}
                    color={colors.primary}
                  />

                  <Text style={styles.statText}>
                    Workout Logged
                  </Text>
                </View>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons
          name="add"
          size={30}
          color="white"
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>
              Add Workout
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Workout Name"
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />

            <TextInput
              style={styles.input}
              placeholder="Calories Burned"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveWorkout}
            >
              <Text style={styles.saveButtonText}>
                Save Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setModalVisible(false)
              }
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 140,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },

  subtitle: {
    marginTop: 4,
    color: colors.textLight,
    fontSize: 14,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  emptyText: {
    color: colors.textLight,
    lineHeight: 22,
  },

  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  workoutName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },

  calorieBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  calorieText: {
    color: colors.text,
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  statText: {
    color: colors.text,
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    bottom: 110,
    right: 24,

    width: 64,
    height: 64,

    borderRadius: 999,
    backgroundColor: colors.primary,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,

    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 16,
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelText: {
    marginTop: 18,
    textAlign: "center",
    color: colors.textLight,
    fontSize: 15,
  },
});