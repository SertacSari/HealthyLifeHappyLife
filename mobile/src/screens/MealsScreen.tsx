import { useState } from "react";
import { RecipeScreen } from "./RecipeScreen";
import { createMeal } from "../api";
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
import type { Meal } from "../types";

type Props = {
  meals: Meal[];
  token: string;
  refreshMeals: () => Promise<void>;
};

export function MealsScreen({
  meals,
  token,
  refreshMeals,
}: Props) {
      const [modalVisible, setModalVisible] = useState(false);

  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [showRecipes, setShowRecipes] =
  useState(false);
  if (showRecipes) {
  return (
    <RecipeScreen
      onBack={() => setShowRecipes(false)}
    />
  );
}

  async function handleSaveMeal() {
  try {
    await createMeal(token, {
      name: mealName,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
    });

    await refreshMeals();

    setMealName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");

    setModalVisible(false);
  } catch (error) {
    console.log(error);
  }
}

  return (
    
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Nutrition
          </Text>

          <Text style={styles.subtitle}>
            Track your meals & macros
          </Text>
        </View>

        <View style={styles.iconCircle}>
          <Ionicons
            name="restaurant"
            size={24}
            color="white"
          />
        </View>
      </View>
      <TouchableOpacity
  style={styles.recipeButton}
  onPress={() => setShowRecipes(true)}
>
  <Ionicons
    name="book"
    size={20}
    color="white"
  />

  <Text style={styles.recipeButtonText}>
    Recipe Finder
  </Text>
</TouchableOpacity>


      {meals.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyTitle}>
            No meals logged yet
          </Text>

          <Text style={styles.emptyText}>
            Start tracking your nutrition
            to see meals and macros here.
          </Text>
        </AppCard>
      ) : (
        meals.map((meal) => (
          <AppCard key={meal.id}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>
                {meal.name}
              </Text>

              <View style={styles.calorieBadge}>
                <Ionicons
                  name="flame"
                  size={14}
                  color={colors.calories}
                />

                <Text style={styles.calorieText}>
                  {meal.calories} kcal
                </Text>
              </View>
            </View>

            <View style={styles.macrosRow}>
              <View style={styles.macroChip}>
                <Text style={styles.macroLabel}>
                  Protein
                </Text>

                <Text style={styles.macroValue}>
                  {meal.protein}g
                </Text>
              </View>

              <View style={styles.macroChip}>
                <Text style={styles.macroLabel}>
                  Carbs
                </Text>

                <Text style={styles.macroValue}>
                  {meal.carbs}g
                </Text>
              </View>

              <View style={styles.macroChip}>
                <Text style={styles.macroLabel}>
                  Fats
                </Text>

                <Text style={styles.macroValue}>
                  {meal.fats}g
                </Text>
              </View>
            </View>
            
          </AppCard>
        ))
      )}
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
        Add Meal
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Meal Name"
        value={mealName}
        onChangeText={setMealName}
      />

      <TextInput
        style={styles.input}
        placeholder="Calories"
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      <TextInput
        style={styles.input}
        placeholder="Protein"
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
      />

      <TextInput
        style={styles.input}
        placeholder="Carbs"
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
      />

      <TextInput
        style={styles.input}
        placeholder="Fats"
        keyboardType="numeric"
        value={fats}
        onChangeText={setFats}
      />

      <TouchableOpacity
  style={styles.saveButton}
  onPress={handleSaveMeal}

      >
        <Text style={styles.saveButtonText}>
          Save Meal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.cancelText}>
          Cancel
        </Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
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

  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  mealName: {
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

  macrosRow: {
    flexDirection: "row",
    gap: 10,
  },

  macroChip: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
  },

  macroLabel: {
    color: colors.textLight,
    fontSize: 12,
    marginBottom: 4,
  },

  macroValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
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
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 14,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },

  saveButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },

  cancelText: {
    color: colors.textLight,
    textAlign: "center",
    fontWeight: "700",
    paddingVertical: 8,
  },
  recipeButton: {
  backgroundColor: colors.primary,
  borderRadius: 18,
  paddingVertical: 14,
  paddingHorizontal: 18,

  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",

  gap: 8,
  marginBottom: 22,
},

recipeButtonText: {
  color: "white",
  fontWeight: "700",
  fontSize: 16,
},
});


