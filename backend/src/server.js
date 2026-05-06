const http = require("node:http");
const { port, jwtSecret, tokenTtlSeconds } = require("./config");
const { verifyToken } = require("./auth");
const { loadDb, saveDb } = require("./db");
const { sendJson, sendNotFound, sendMethodNotAllowed, parseUrl, readJsonBody } = require("./http");
const {
  signup,
  login,
  getProfile,
  updateProfile,
  addMeal,
  listMeals,
  addWorkout,
  listWorkouts,
  getDashboardSummary,
  getReminderSettings,
  updateReminderSettings,
  getDailyRecommendations,
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers
} = require("./services");

const authConfig = { jwtSecret, tokenTtlSeconds };

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS,DELETE");
}

function authUser(req, db) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.replace("Bearer ", "").trim();
  const result = verifyToken(token, jwtSecret);
  if (!result.valid) {
    return null;
  }
  return db.users.find((u) => u.id === result.payload.userId) || null;
}

function sendServiceError(res, error) {
  const status = error && Number.isInteger(error.status) ? error.status : 500;
  const message = error && error.message ? error.message : "Internal server error";
  return sendJson(res, status, { error: message });
}

function sanitizeUser(user) {
  return {
    id: user.userId,
    email: user.email,
    createdAt: user.createdAt
  };
}

function sanitizeDbUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

async function handleSignup(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  try {
    const created = signup(db, body, authConfig);
    saveDb(db);
    return sendJson(res, 201, {
      token: created.token,
      user: sanitizeUser(created)
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  try {
    const signedIn = login(db, body, authConfig);
    return sendJson(res, 200, {
      token: signedIn.token,
      user: sanitizeUser(signedIn)
    });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleLogout(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  return sendJson(res, 200, {
    message: "Logout successful on client side. Remove stored token."
  });
}

function handleAuthMe(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  return sendJson(res, 200, { user: sanitizeDbUser(user) });
}

function handleGetProfile(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const profile = getProfile(db, user.id);
    return sendJson(res, 200, { profile });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpdateProfile(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const profile = updateProfile(db, user.id, body);
    saveDb(db);
    return sendJson(res, 200, { profile });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateMeal(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const meal = addMeal(db, user.id, body);
    saveDb(db);
    return sendJson(res, 201, { meal });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleGetMeals(req, res, url) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const date = url.searchParams.get("date");
    const meals = listMeals(db, user.id, date);
    return sendJson(res, 200, { meals });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleCreateWorkout(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const workout = addWorkout(db, user.id, body);
    saveDb(db);
    return sendJson(res, 201, { workout });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleGetWorkouts(req, res, url) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const date = url.searchParams.get("date");
    const workouts = listWorkouts(db, user.id, date);
    return sendJson(res, 200, { workouts });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleDashboardSummary(req, res, url) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const selectedDate = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const summary = getDashboardSummary(db, user.id, selectedDate);
    return sendJson(res, 200, { summary });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleGetRecommendations(req, res, url) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const selectedDate = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const recommendations = getDailyRecommendations(db, user.id, selectedDate);
    return sendJson(res, 200, { recommendations });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleGetReminderSettings(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const settings = getReminderSettings(db, user.id);
    saveDb(db);
    return sendJson(res, 200, { settings });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUpdateReminderSettings(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const settings = updateReminderSettings(db, user.id, body);
    saveDb(db);
    return sendJson(res, 200, { settings });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleFollow(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const result = followUser(db, user.id, body.targetUserId);
    saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

async function handleUnfollow(req, res) {
  const body = await readJsonBody(req);
  if (!body) {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const result = unfollowUser(db, user.id, body.targetUserId);
    saveDb(db);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleListFollowing(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const users = listFollowing(db, user.id);
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

function handleListFollowers(req, res) {
  const db = loadDb();
  const user = authUser(req, db);
  if (!user) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  try {
    const users = listFollowers(db, user.id);
    return sendJson(res, 200, { users });
  } catch (error) {
    return sendServiceError(res, error);
  }
}

const server = http.createServer(async (req, res) => {
  withCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = parseUrl(req);
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") {
    return sendJson(res, 200, { status: "ok", service: "ens492-month1-backend" });
  }

  if (path === "/auth/signup") {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res);
    }
    return handleSignup(req, res);
  }
  if (path === "/auth/login") {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res);
    }
    return handleLogin(req, res);
  }
  if (path === "/auth/logout") {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res);
    }
    return handleLogout(req, res);
  }
  if (path === "/auth/me") {
    if (req.method !== "GET") {
      return sendMethodNotAllowed(res);
    }
    return handleAuthMe(req, res);
  }
  if (path === "/profile") {
    if (req.method === "GET") {
      return handleGetProfile(req, res);
    }
    if (req.method === "PUT") {
      return handleUpdateProfile(req, res);
    }
    return sendMethodNotAllowed(res);
  }
  if (path === "/meals") {
    if (req.method === "POST") {
      return handleCreateMeal(req, res);
    }
    if (req.method === "GET") {
      return handleGetMeals(req, res, url);
    }
    return sendMethodNotAllowed(res);
  }
  if (path === "/workouts") {
    if (req.method === "POST") {
      return handleCreateWorkout(req, res);
    }
    if (req.method === "GET") {
      return handleGetWorkouts(req, res, url);
    }
    return sendMethodNotAllowed(res);
  }
  if (path === "/dashboard/summary") {
    if (req.method !== "GET") {
      return sendMethodNotAllowed(res);
    }
    return handleDashboardSummary(req, res, url);
  }
  if (path === "/recommendations/daily") {
    if (req.method !== "GET") {
      return sendMethodNotAllowed(res);
    }
    return handleGetRecommendations(req, res, url);
  }
  if (path === "/reminders/settings") {
    if (req.method === "GET") {
      return handleGetReminderSettings(req, res);
    }
    if (req.method === "PUT") {
      return handleUpdateReminderSettings(req, res);
    }
    return sendMethodNotAllowed(res);
  }
  if (path === "/social/follow") {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res);
    }
    return handleFollow(req, res);
  }
  if (path === "/social/unfollow") {
    if (req.method !== "POST") {
      return sendMethodNotAllowed(res);
    }
    return handleUnfollow(req, res);
  }
  if (path === "/social/following") {
    if (req.method !== "GET") {
      return sendMethodNotAllowed(res);
    }
    return handleListFollowing(req, res);
  }
  if (path === "/social/followers") {
    if (req.method !== "GET") {
      return sendMethodNotAllowed(res);
    }
    return handleListFollowers(req, res);
  }

  return sendNotFound(res);
});

server.listen(port, () => {
  console.log(`ENS492 Month1 backend running on http://localhost:${port}`);
});
