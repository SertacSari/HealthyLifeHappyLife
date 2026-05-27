const fs = require("node:fs");
const path = require("node:path");
const {
  dbProvider,
  databaseUrl,
  pgSslEnabled,
  pgSslRejectUnauthorized,
  dbFilePath
} = require("./config");
const { getSeedFoodItems } = require("./demoSeeds");

const seedFoodItems = getSeedFoodItems();

const initialData = {
  users: [],
  profiles: [],
  meals: [],
  workouts: [],
  reminders: [],
  follows: [],
  socialPosts: [],
  postLikes: [],
  postComments: [],
  foodItems: seedFoodItems,
  mealTemplates: [],
  dailyCheckIns: [],
  counters: {
    user: 1,
    meal: 1,
    workout: 1,
    socialPost: 1,
    postComment: 1,
    foodItem: seedFoodItems.length + 1,
    mealTemplate: 1,
    dailyCheckIn: 1
  }
};

function ensureDbFile() {
  const dirPath = path.dirname(dbFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function hydrateDbShape(parsed) {
  const next = parsed && typeof parsed === "object" ? parsed : {};
  if (!Array.isArray(next.users)) {
    next.users = [];
  }
  if (!Array.isArray(next.profiles)) {
    next.profiles = [];
  }
  if (!Array.isArray(next.meals)) {
    next.meals = [];
  }
  if (!Array.isArray(next.workouts)) {
    next.workouts = [];
  }
  if (!Array.isArray(next.reminders)) {
    next.reminders = [];
  }
  if (!Array.isArray(next.follows)) {
    next.follows = [];
  }
  if (!Array.isArray(next.socialPosts)) {
    next.socialPosts = [];
  }
  if (!Array.isArray(next.postLikes)) {
    next.postLikes = [];
  }
  if (!Array.isArray(next.postComments)) {
    next.postComments = [];
  }
  if (!Array.isArray(next.foodItems)) {
    next.foodItems = seedFoodItems;
  }
  const existingFoodItemIds = new Set(next.foodItems.map((item) => item.id));
  for (const seedItem of seedFoodItems) {
    if (!existingFoodItemIds.has(seedItem.id)) {
      next.foodItems.push(seedItem);
    }
  }
  if (!Array.isArray(next.mealTemplates)) {
    next.mealTemplates = [];
  }
  if (!Array.isArray(next.dailyCheckIns)) {
    next.dailyCheckIns = [];
  }
  if (!next.counters || typeof next.counters !== "object") {
    next.counters = {};
  }
  if (!Number.isInteger(next.counters.user) || next.counters.user <= 0) {
    next.counters.user = 1;
  }
  if (!Number.isInteger(next.counters.meal) || next.counters.meal <= 0) {
    next.counters.meal = 1;
  }
  if (!Number.isInteger(next.counters.workout) || next.counters.workout <= 0) {
    next.counters.workout = 1;
  }
  if (!Number.isInteger(next.counters.socialPost) || next.counters.socialPost <= 0) {
    next.counters.socialPost = 1;
  }
  if (!Number.isInteger(next.counters.postComment) || next.counters.postComment <= 0) {
    next.counters.postComment = 1;
  }
  const maxFoodItemId = next.foodItems.reduce((max, item) => Math.max(max, Number.isInteger(item.id) ? item.id : 0), 0);
  if (!Number.isInteger(next.counters.foodItem) || next.counters.foodItem <= maxFoodItemId) {
    next.counters.foodItem = maxFoodItemId + 1;
  }
  if (!Number.isInteger(next.counters.mealTemplate) || next.counters.mealTemplate <= 0) {
    next.counters.mealTemplate = 1;
  }
  if (!Number.isInteger(next.counters.dailyCheckIn) || next.counters.dailyCheckIn <= 0) {
    next.counters.dailyCheckIn = 1;
  }
  return next;
}

function loadJsonDb() {
  ensureDbFile();
  const content = fs.readFileSync(dbFilePath, "utf8");
  const parsed = JSON.parse(content);
  return hydrateDbShape(parsed);
}

function saveJsonDb(data) {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
}

let pgPoolPromise = null;

function getPgPool() {
  if (pgPoolPromise) {
    return pgPoolPromise;
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when DB_PROVIDER=postgres");
  }
  pgPoolPromise = (async () => {
    // Lazy import keeps json mode dependency-free.
    const { Pool } = require("pg");
    const ssl = pgSslEnabled ? { rejectUnauthorized: pgSslRejectUnauthorized } : undefined;
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl
    });
    await pool.query("SELECT 1");
    return pool;
  })();
  return pgPoolPromise;
}

async function ensurePostgresState(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `
      INSERT INTO app_state (id, payload)
      VALUES (1, $1::jsonb)
      ON CONFLICT (id) DO NOTHING
    `,
    [JSON.stringify(initialData)]
  );
}

async function loadPostgresDb() {
  const pool = await getPgPool();
  await ensurePostgresState(pool);
  const result = await pool.query("SELECT payload FROM app_state WHERE id = 1");
  const payload = result.rows[0] ? result.rows[0].payload : initialData;
  const normalized = hydrateDbShape(payload);
  return normalized;
}

async function savePostgresDb(data) {
  const pool = await getPgPool();
  await ensurePostgresState(pool);
  const payload = JSON.stringify(hydrateDbShape(data));
  await pool.query(
    "UPDATE app_state SET payload = $1::jsonb, updated_at = NOW() WHERE id = 1",
    [payload]
  );
}

async function loadDb() {
  if (dbProvider === "postgres") {
    return loadPostgresDb();
  }
  return loadJsonDb();
}

async function saveDb(data) {
  if (dbProvider === "postgres") {
    await savePostgresDb(data);
    return;
  }
  saveJsonDb(data);
}

function nextId(data, key) {
  if (!data.counters || typeof data.counters !== "object") {
    data.counters = {};
  }
  if (!Number.isInteger(data.counters[key]) || data.counters[key] <= 0) {
    data.counters[key] = 1;
  }
  const id = data.counters[key];
  data.counters[key] += 1;
  return id;
}

module.exports = {
  loadDb,
  saveDb,
  nextId,
  hydrateDbShape
};
