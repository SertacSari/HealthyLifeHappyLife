function getSeedFoodItems() {
  return [
    {
      id: 1,
      name: "Grilled Chicken Breast",
      brand: "HealthyLife Demo",
      category: "protein",
      servingSize: "100 g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 3.6,
      dietTags: ["high_protein", "gluten_free"],
      allergens: [],
      source: "demo"
    },
    {
      id: 2,
      name: "Brown Rice",
      brand: "HealthyLife Demo",
      category: "grain",
      servingSize: "1 cup cooked",
      calories: 216,
      protein: 5,
      carbs: 45,
      fats: 1.8,
      dietTags: ["vegan", "vegetarian"],
      allergens: []
    },
    {
      id: 3,
      name: "Greek Yogurt",
      brand: "HealthyLife Demo",
      category: "dairy",
      servingSize: "170 g",
      calories: 100,
      protein: 17,
      carbs: 6,
      fats: 0,
      dietTags: ["vegetarian", "high_protein"],
      allergens: ["milk"]
    },
    {
      id: 4,
      name: "Lentil Soup",
      brand: "HealthyLife Demo",
      category: "prepared",
      servingSize: "1 bowl",
      calories: 230,
      protein: 14,
      carbs: 36,
      fats: 4,
      dietTags: ["vegan", "vegetarian", "high_fiber"],
      allergens: []
    },
    {
      id: 5,
      name: "Almond Butter Toast",
      brand: "HealthyLife Demo",
      category: "snack",
      servingSize: "1 slice",
      calories: 260,
      protein: 9,
      carbs: 24,
      fats: 15,
      dietTags: ["vegetarian"],
      allergens: ["tree_nuts", "gluten"]
    }
  ].map((item) => ({
    source: "demo",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...item
  }));
}

module.exports = {
  getSeedFoodItems
};
