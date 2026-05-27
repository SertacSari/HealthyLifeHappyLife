const test = require("node:test");
const assert = require("node:assert/strict");
const { signup, listFoodItems } = require("../src/services");
const { getSeedFoodItems } = require("../src/demoSeeds");

const authConfig = {
  jwtSecret: "unit-test-secret",
  tokenTtlSeconds: 3600
};

function createDb() {
  const foodItems = getSeedFoodItems();
  return {
    users: [],
    profiles: [],
    meals: [],
    workouts: [],
    reminders: [],
    follows: [],
    foodItems,
    mealTemplates: [],
    dailyCheckIns: [],
    counters: {
      user: 1,
      meal: 1,
      workout: 1,
      foodItem: foodItems.length + 1,
      mealTemplate: 1,
      dailyCheckIn: 1
    }
  };
}

test("Turkish demo foods are seeded with complete non-negative macros", () => {
  const foods = getSeedFoodItems();
  const byName = new Map(foods.map((item) => [item.name, item]));
  const requiredNames = [
    "Tavuk döner dürüm",
    "Et döner porsiyon",
    "Adana kebap",
    "Urfa kebap",
    "İskender kebap",
    "Lahmacun",
    "Menemen",
    "Mercimek çorbası",
    "Ezogelin çorbası",
    "Bulgur pilavı",
    "Ayran",
    "Simit",
    "Kıymalı pide",
    "Tavuk şiş",
    "Köfte"
  ];

  for (const name of requiredNames) {
    assert.ok(byName.has(name), `${name} should exist in demo seed foods`);
    const food = byName.get(name);
    assert.equal(typeof food.servingSize, "string");
    assert.ok(food.servingSize.length > 0);
    assert.equal(typeof food.category, "string");
    assert.ok(food.category.length > 0);
    assert.ok(Array.isArray(food.dietTags));
    assert.ok(Array.isArray(food.allergens));

    for (const macro of ["calories", "protein", "carbs", "fats"]) {
      assert.equal(typeof food[macro], "number", `${name} ${macro} should be numeric`);
      assert.ok(food[macro] >= 0, `${name} ${macro} should be non-negative`);
    }
  }
});

test("food library search finds Turkish foods with Turkish and ASCII terms", () => {
  const db = createDb();
  const user = signup(db, { email: "turkish-foods@example.com", password: "StrongPass123", name: "Foods" }, authConfig);

  assert.ok(listFoodItems(db, user.userId, { query: "döner" }).some((item) => item.name === "Tavuk döner dürüm"));
  assert.ok(listFoodItems(db, user.userId, { query: "doner" }).some((item) => item.name === "Et döner porsiyon"));
  assert.ok(listFoodItems(db, user.userId, { query: "kebap" }).some((item) => item.name === "Adana kebap"));
  assert.ok(listFoodItems(db, user.userId, { query: "lahmacun" }).some((item) => item.name === "Lahmacun"));
});
