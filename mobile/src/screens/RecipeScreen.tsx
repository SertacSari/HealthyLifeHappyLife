import { useMemo, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { AppCard } from "../components/AppCard";
import { colors } from "../theme/colors";
import { recipes } from "../data/recipes";

type Props = {
  onBack: () => void;
};

export function RecipeScreen({
  onBack,
}: Props) {
  const [search, setSearch] = useState("");
  const [ingredients, setIngredients] = useState("");

  const filteredRecipes = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    const ingredientList = ingredients
      .toLowerCase()
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return recipes.filter((recipe) => {
      const matchesKeyword =
        !keyword ||
        recipe.title.toLowerCase().includes(keyword) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(keyword)
        );

      const matchesIngredients =
  ingredientList.length === 0 ||
  recipe.ingredients.every((recipeIngredient) =>
    ingredientList.some((userIngredient) =>
      userIngredient.includes(recipeIngredient.toLowerCase())
    )
  );

      return matchesKeyword && matchesIngredients;
    });
  }, [search, ingredients]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
  style={styles.backButton}
  onPress={onBack}
>
  <Ionicons
    name="arrow-back"
    size={22}
    color={colors.primary}
  />

  <Text style={styles.backText}>
    Back to Meals
  </Text>
</TouchableOpacity>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recipe Finder</Text>
          <Text style={styles.subtitle}>
            Search recipes by name or ingredients
          </Text>
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name="book" size={24} color="white" />
        </View>
      </View>

      <AppCard>
        <Text style={styles.inputLabel}>Search Keyword</Text>
        <TextInput
          style={styles.input}
          placeholder="chicken, oats, wrap..."
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.inputLabel}>Ingredients You Have</Text>
        <TextInput
          style={styles.input}
          placeholder="chicken, rice, avocado"
          value={ingredients}
          onChangeText={setIngredients}
        />

        <Text style={styles.helperText}>
          Separate ingredients with commas.
        </Text>
      </AppCard>

      <Text style={styles.resultTitle}>
        {filteredRecipes.length} recipe result
        {filteredRecipes.length === 1 ? "" : "s"}
      </Text>

      {filteredRecipes.map((recipe) => (
        <AppCard key={recipe.id}>
          <View style={styles.recipeHeader}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>

            <View style={styles.timeBadge}>
              <Ionicons name="time" size={14} color={colors.primary} />
              <Text style={styles.timeText}>{recipe.time}</Text>
            </View>
          </View>

          <Text style={styles.ingredients}>
            {recipe.ingredients.join(" • ")}
          </Text>

          <View style={styles.macrosRow}>
            <View style={styles.macroChip}>
              <Text style={styles.macroLabel}>kcal</Text>
              <Text style={styles.macroValue}>{recipe.calories}</Text>
            </View>

            <View style={styles.macroChip}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{recipe.protein}g</Text>
            </View>

            <View style={styles.macroChip}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{recipe.carbs}g</Text>
            </View>

            <View style={styles.macroChip}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{recipe.fats}g</Text>
            </View>
          </View>
        </AppCard>
      ))}
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

  inputLabel: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },

  helperText: {
    color: colors.textLight,
    fontSize: 13,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 14,
  },

  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  recipeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
  },

  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  timeText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },

  ingredients: {
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 16,
  },

  macrosRow: {
    flexDirection: "row",
    gap: 8,
  },

  macroChip: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 10,
  },

  macroLabel: {
    color: colors.textLight,
    fontSize: 11,
    marginBottom: 4,
  },

  macroValue: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
  },
  backButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginBottom: 18,
},

backText: {
  color: colors.primary,
  fontWeight: "700",
  fontSize: 15,
},
});