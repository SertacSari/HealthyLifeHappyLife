const test = require("node:test");
const assert = require("node:assert/strict");
const {
  signup,
  addMeal,
  addWorkout,
  getDailyRecommendations,
  getReminderSettings,
  updateReminderSettings,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
} = require("../src/services");

const authConfig = {
  jwtSecret: "unit-test-secret",
  tokenTtlSeconds: 3600
};

function createDb() {
  return {
    users: [],
    profiles: [],
    meals: [],
    workouts: [],
    reminders: [],
    follows: [],
    counters: {
      user: 1,
      meal: 1,
      workout: 1
    }
  };
}

test("reminder settings can be created and updated", () => {
  const db = createDb();
  const user = signup(db, { email: "u1@example.com", password: "StrongPass123", name: "U1" }, authConfig);
  const defaults = getReminderSettings(db, user.userId);
  assert.equal(defaults.enabled, false);
  assert.equal(defaults.reminderTime, "20:00");

  const updated = updateReminderSettings(db, user.userId, {
    enabled: true,
    reminderTime: "08:30",
    frequency: "weekdays"
  });
  assert.equal(updated.enabled, true);
  assert.equal(updated.reminderTime, "08:30");
  assert.equal(updated.frequency, "weekdays");
});

test("daily recommendations return non-medical disclaimer and tips", () => {
  const db = createDb();
  const user = signup(db, { email: "u2@example.com", password: "StrongPass123", name: "U2" }, authConfig);
  addMeal(db, user.userId, {
    name: "Oatmeal",
    calories: 350,
    protein: 15,
    carbs: 45,
    fats: 8
  });
  addWorkout(db, user.userId, {
    name: "Walk",
    durationMinutes: 25,
    caloriesBurned: 120
  });

  const date = new Date().toISOString().slice(0, 10);
  const recommendations = getDailyRecommendations(db, user.userId, date);
  assert.ok(recommendations.disclaimer.includes("does not provide medical advice"));
  assert.ok(Array.isArray(recommendations.tips));
  assert.ok(recommendations.tips.length > 0);
});

test("follow and unfollow flow", () => {
  const db = createDb();
  const first = signup(db, { email: "u3@example.com", password: "StrongPass123", name: "U3" }, authConfig);
  const second = signup(db, { email: "u4@example.com", password: "StrongPass123", name: "U4" }, authConfig);

  followUser(db, first.userId, second.userId);
  const following = listFollowing(db, first.userId);
  const followers = listFollowers(db, second.userId);
  assert.equal(following.length, 1);
  assert.equal(followers.length, 1);

  unfollowUser(db, first.userId, second.userId);
  const followingAfter = listFollowing(db, first.userId);
  assert.equal(followingAfter.length, 0);
});
