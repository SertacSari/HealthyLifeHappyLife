const test = require("node:test");
const assert = require("node:assert/strict");
const { signup, followUser } = require("../src/services");
const {
  createMealPost,
  listVisibleFeed,
  likePost,
  commentOnPost,
  copyMealPostToLog
} = require("../src/socialFeedService");

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
    socialPosts: [],
    postLikes: [],
    postComments: [],
    foodItems: [],
    mealTemplates: [],
    dailyCheckIns: [],
    counters: {
      user: 1,
      meal: 1,
      workout: 1,
      socialPost: 1,
      postComment: 1,
      foodItem: 1,
      mealTemplate: 1,
      dailyCheckIn: 1
    }
  };
}

function createUsers(db) {
  return {
    owner: signup(db, { email: "owner@example.com", password: "StrongPass123", name: "Owner" }, authConfig),
    friend: signup(db, { email: "friend@example.com", password: "StrongPass123", name: "Friend" }, authConfig),
    follower: signup(db, { email: "follower@example.com", password: "StrongPass123", name: "Follower" }, authConfig),
    stranger: signup(db, { email: "stranger@example.com", password: "StrongPass123", name: "Stranger" }, authConfig)
  };
}

function meal(overrides = {}) {
  return {
    name: "Protein bowl",
    calories: 640,
    protein: 42,
    carbs: 58,
    fats: 18,
    loggedAt: "2026-05-08T12:00:00.000Z",
    ...overrides
  };
}

test("feed visibility supports public, mutual-friends, and private posts", () => {
  const db = createDb();
  const users = createUsers(db);
  followUser(db, users.friend.userId, users.owner.userId);
  followUser(db, users.owner.userId, users.friend.userId);
  followUser(db, users.follower.userId, users.owner.userId);

  const publicPost = createMealPost(db, users.owner.userId, {
    meal: meal({ name: "Public bowl" }),
    visibility: "public"
  });
  const friendsPost = createMealPost(db, users.owner.userId, {
    meal: meal({ name: "Friends bowl" }),
    visibility: "friends"
  });
  const privatePost = createMealPost(db, users.owner.userId, {
    meal: meal({ name: "Private bowl" }),
    visibility: "private"
  });

  const ownerFeedIds = listVisibleFeed(db, users.owner.userId).map((post) => post.id);
  assert.deepEqual(new Set(ownerFeedIds), new Set([publicPost.id, friendsPost.id, privatePost.id]));

  const friendFeedIds = listVisibleFeed(db, users.friend.userId).map((post) => post.id);
  assert.deepEqual(new Set(friendFeedIds), new Set([publicPost.id, friendsPost.id]));

  const followerFeedIds = listVisibleFeed(db, users.follower.userId).map((post) => post.id);
  assert.deepEqual(followerFeedIds, [publicPost.id]);

  const strangerFeedIds = listVisibleFeed(db, users.stranger.userId).map((post) => post.id);
  assert.deepEqual(strangerFeedIds, [publicPost.id]);
});

test("likes toggle once per viewer and comments attach to visible posts", () => {
  const db = createDb();
  const users = createUsers(db);
  const post = createMealPost(db, users.owner.userId, {
    meal: meal(),
    visibility: "public"
  });

  const firstLike = likePost(db, users.friend.userId, post.id);
  const secondLike = likePost(db, users.friend.userId, post.id);
  assert.equal(firstLike.post.likeCount, 1);
  assert.equal(firstLike.liked, true);
  assert.equal(secondLike.post.likeCount, 0);
  assert.equal(secondLike.liked, false);
  assert.equal(db.postLikes.length, 0);

  const thirdLike = likePost(db, users.friend.userId, post.id);
  assert.equal(thirdLike.post.likeCount, 1);
  assert.equal(thirdLike.liked, true);

  const commentResult = commentOnPost(db, users.friend.userId, post.id, "Looks good.");
  assert.equal(commentResult.comment.text, "Looks good.");
  assert.equal(commentResult.post.commentCount, 1);

  const [rendered] = listVisibleFeed(db, users.friend.userId);
  assert.equal(rendered.likeCount, 1);
  assert.equal(rendered.likedByViewer, true);
  assert.equal(rendered.comments.length, 1);
  assert.equal(rendered.comments[0].author.name, "Friend");
});

test("copying a meal post creates a viewer meal without private body data", () => {
  const db = createDb();
  const users = createUsers(db);
  const post = createMealPost(db, users.owner.userId, {
    meal: meal({ bodyFatPercentage: 18 }),
    visibility: "public",
    bodyMeasurements: {
      weight: 82,
      waist: 90
    }
  });

  assert.deepEqual(db.socialPosts[0].privateBodyData, {
    bodyMeasurements: {
      weight: 82,
      waist: 90
    },
    bodyFatPercentage: 18
  });

  const copied = copyMealPostToLog(db, users.friend.userId, post.id);
  assert.equal(copied.userId, users.friend.userId);
  assert.equal(copied.name, "Protein bowl");
  assert.equal(copied.calories, 640);
  assert.equal(copied.copiedFromPostId, post.id);
  assert.equal("bodyMeasurements" in copied, false);
  assert.equal("bodyFatPercentage" in copied, false);
});

test("hideCalories removes calories and macros from visible feed meals", () => {
  const db = createDb();
  const users = createUsers(db);
  createMealPost(db, users.owner.userId, {
    meal: meal(),
    visibility: "public",
    privacy: {
      hideCalories: true
    }
  });

  const [rendered] = listVisibleFeed(db, users.stranger.userId);
  assert.equal("calories" in rendered.meal, false);
  assert.equal("protein" in rendered.meal, false);
  assert.equal("carbs" in rendered.meal, false);
  assert.equal("fats" in rendered.meal, false);
  assert.deepEqual(rendered.hiddenFields, ["calories", "macros", "measurements"]);
});
