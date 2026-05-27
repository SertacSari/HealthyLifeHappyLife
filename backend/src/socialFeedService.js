const { nextId } = require("./db");
const { isNonEmptyString, isNonNegativeNumber, isPositiveNumber, normalizeDateOrNow } = require("./validation");

const VISIBILITIES = new Set(["public", "friends", "private"]);
const MEASUREMENT_KEYS = new Set([
  "weight",
  "height",
  "bmi",
  "bodyFat",
  "bodyFatPercentage",
  "waist",
  "hips",
  "chest",
  "measurements",
  "bodyMeasurements",
  "bodyData"
]);

function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function ensureSocialShape(db) {
  if (!Array.isArray(db.socialPosts)) {
    db.socialPosts = [];
  }
  if (!Array.isArray(db.postLikes)) {
    db.postLikes = [];
  }
  if (!Array.isArray(db.postComments)) {
    db.postComments = [];
  }
  if (!db.counters || typeof db.counters !== "object") {
    db.counters = {};
  }
  if (!Number.isInteger(db.counters.socialPost) || db.counters.socialPost <= 0) {
    db.counters.socialPost = 1;
  }
  if (!Number.isInteger(db.counters.postComment) || db.counters.postComment <= 0) {
    db.counters.postComment = 1;
  }
  if (!Number.isInteger(db.counters.meal) || db.counters.meal <= 0) {
    db.counters.meal = 1;
  }
}

function assertUserExists(db, userId) {
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    throw createAppError("User not found", 404);
  }
  return user;
}

function getAuthor(db, userId) {
  const profile = db.profiles.find((item) => item.userId === userId);
  return {
    userId,
    name: profile ? profile.name : "User"
  };
}

function normalizePrivacy(input = {}) {
  return {
    hideCalories: input.hideCalories === true,
    hideMeasurements: input.hideMeasurements !== false
  };
}

function normalizeVisibility(value) {
  const visibility = value || "friends";
  if (!VISIBILITIES.has(visibility)) {
    throw createAppError("Invalid visibility", 400);
  }
  return visibility;
}

function sanitizeMealForStorage(input) {
  const { name, calories, protein = 0, carbs = 0, fats = 0, loggedAt } = input || {};
  if (!isNonEmptyString(name, 140)) {
    throw createAppError("Invalid meal name", 400);
  }
  if (!isPositiveNumber(calories)) {
    throw createAppError("Invalid calories", 400);
  }
  if (![protein, carbs, fats].every(isNonNegativeNumber)) {
    throw createAppError("Macros must be non-negative numbers", 400);
  }
  const normalizedLoggedAt = normalizeDateOrNow(loggedAt);
  if (!normalizedLoggedAt) {
    throw createAppError("Invalid loggedAt value", 400);
  }
  return {
    name: name.trim(),
    calories,
    protein,
    carbs,
    fats,
    loggedAt: normalizedLoggedAt
  };
}

function getMealPayload(db, userId, payload) {
  if (Number.isInteger(payload.mealId)) {
    const meal = db.meals.find((item) => item.id === payload.mealId && item.userId === userId);
    if (!meal) {
      throw createAppError("Meal not found", 404);
    }
    return {
      mealId: meal.id,
      meal: sanitizeMealForStorage(meal)
    };
  }
  return {
    mealId: null,
    meal: sanitizeMealForStorage(payload.meal)
  };
}

function extractPrivateBodyData(payload) {
  const privateBodyData = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (MEASUREMENT_KEYS.has(key)) {
      privateBodyData[key] = value;
    }
  }
  if (payload && payload.meal && typeof payload.meal === "object") {
    for (const [key, value] of Object.entries(payload.meal)) {
      if (MEASUREMENT_KEYS.has(key)) {
        privateBodyData[key] = value;
      }
    }
  }
  return privateBodyData;
}

function areFriends(db, firstUserId, secondUserId) {
  if (firstUserId === secondUserId) {
    return true;
  }
  const firstFollowsSecond = db.follows.some(
    (item) => item.followerUserId === firstUserId && item.followingUserId === secondUserId
  );
  const secondFollowsFirst = db.follows.some(
    (item) => item.followerUserId === secondUserId && item.followingUserId === firstUserId
  );
  return firstFollowsSecond && secondFollowsFirst;
}

function canViewPost(db, viewerUserId, post) {
  if (post.userId === viewerUserId) {
    return true;
  }
  if (post.visibility === "public") {
    return true;
  }
  if (post.visibility === "friends") {
    return areFriends(db, viewerUserId, post.userId);
  }
  return false;
}

function sanitizeMealForViewer(post) {
  const meal = { ...post.meal };
  const hiddenFields = [];
  if (post.privacy.hideCalories) {
    for (const key of ["calories", "protein", "carbs", "fats"]) {
      delete meal[key];
    }
    hiddenFields.push("calories", "macros");
  }
  if (post.privacy.hideMeasurements) {
    hiddenFields.push("measurements");
  }
  return { meal, hiddenFields };
}

function renderPost(db, viewerUserId, post) {
  const { meal, hiddenFields } = sanitizeMealForViewer(post);
  const comments = db.postComments
    .filter((item) => item.postId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      author: getAuthor(db, comment.userId),
      text: comment.text,
      createdAt: comment.createdAt
    }));
  const likes = db.postLikes.filter((item) => item.postId === post.id);

  return {
    id: post.id,
    userId: post.userId,
    author: getAuthor(db, post.userId),
    caption: post.caption,
    visibility: post.visibility,
    privacy: { ...post.privacy },
    hiddenFields,
    meal,
    likeCount: likes.length,
    likedByViewer: likes.some((item) => item.userId === viewerUserId),
    commentCount: comments.length,
    comments,
    createdAt: post.createdAt
  };
}

function findVisiblePost(db, viewerUserId, postId) {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw createAppError("Invalid postId", 400);
  }
  const post = db.socialPosts.find((item) => item.id === postId);
  if (!post || !canViewPost(db, viewerUserId, post)) {
    throw createAppError("Post not found", 404);
  }
  return post;
}

function createMealPost(db, userId, payload) {
  ensureSocialShape(db);
  assertUserExists(db, userId);
  const { mealId, meal } = getMealPayload(db, userId, payload || {});
  const caption = payload && payload.caption !== undefined ? payload.caption : "";
  if (caption !== "" && !isNonEmptyString(caption, 500)) {
    throw createAppError("Invalid caption", 400);
  }
  const post = {
    id: nextId(db, "socialPost"),
    userId,
    mealId,
    caption: caption.trim(),
    visibility: normalizeVisibility(payload && payload.visibility),
    privacy: normalizePrivacy(payload && payload.privacy),
    meal,
    privateBodyData: extractPrivateBodyData(payload),
    createdAt: new Date().toISOString()
  };
  db.socialPosts.push(post);
  return renderPost(db, userId, post);
}

function listVisibleFeed(db, viewerUserId) {
  ensureSocialShape(db);
  assertUserExists(db, viewerUserId);
  return db.socialPosts
    .filter((post) => canViewPost(db, viewerUserId, post))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((post) => renderPost(db, viewerUserId, post));
}

function likePost(db, userId, postId) {
  ensureSocialShape(db);
  assertUserExists(db, userId);
  const post = findVisiblePost(db, userId, postId);
  const existing = db.postLikes.find((item) => item.postId === postId && item.userId === userId);
  if (!existing) {
    db.postLikes.push({
      postId,
      userId,
      createdAt: new Date().toISOString()
    });
  }
  return {
    liked: true,
    post: renderPost(db, userId, post)
  };
}

function commentOnPost(db, userId, postId, text) {
  ensureSocialShape(db);
  assertUserExists(db, userId);
  const post = findVisiblePost(db, userId, postId);
  if (!isNonEmptyString(text, 500)) {
    throw createAppError("Invalid comment text", 400);
  }
  const comment = {
    id: nextId(db, "postComment"),
    postId,
    userId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  db.postComments.push(comment);
  return {
    comment: {
      ...comment,
      author: getAuthor(db, userId)
    },
    post: renderPost(db, userId, post)
  };
}

function copyMealPostToLog(db, userId, postId) {
  ensureSocialShape(db);
  assertUserExists(db, userId);
  const post = findVisiblePost(db, userId, postId);
  const meal = {
    id: nextId(db, "meal"),
    userId,
    name: post.meal.name,
    calories: post.meal.calories,
    protein: post.meal.protein,
    carbs: post.meal.carbs,
    fats: post.meal.fats,
    loggedAt: new Date().toISOString(),
    copiedFromPostId: post.id,
    copiedFromUserId: post.userId
  };
  db.meals.push(meal);
  return meal;
}

module.exports = {
  createMealPost,
  listVisibleFeed,
  likePost,
  commentOnPost,
  copyMealPostToLog
};
