const assert = require("node:assert/strict");
const test = require("node:test");

const { hydrateDbShape, nextId } = require("../src/db");

test("hydrateDbShape fills missing MVP collections and counters", () => {
  const db = hydrateDbShape({
    users: [{ id: 7, email: "demo@example.com" }],
    foodItems: [{ id: 42, name: "Demo food" }],
    counters: {}
  });

  for (const key of [
    "users",
    "profiles",
    "meals",
    "workouts",
    "reminders",
    "follows",
    "socialPosts",
    "postLikes",
    "postComments",
    "foodItems",
    "mealTemplates",
    "dailyCheckIns"
  ]) {
    assert.equal(Array.isArray(db[key]), true, `${key} should be an array`);
  }

  assert.equal(db.counters.user, 1);
  assert.equal(db.counters.meal, 1);
  assert.equal(db.counters.workout, 1);
  assert.equal(db.counters.socialPost, 1);
  assert.equal(db.counters.postComment, 1);
  assert.equal(db.counters.mealTemplate, 1);
  assert.equal(db.counters.dailyCheckIn, 1);
  assert.equal(db.counters.foodItem, 43);
});

test("nextId increments hydrated counters without changing storage mode", () => {
  const db = hydrateDbShape({ counters: { meal: 3 } });

  assert.equal(nextId(db, "meal"), 3);
  assert.equal(nextId(db, "meal"), 4);
  assert.equal(db.counters.meal, 5);
});
