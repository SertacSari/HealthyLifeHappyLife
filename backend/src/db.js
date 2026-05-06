const fs = require("node:fs");
const path = require("node:path");
const { dbFilePath } = require("./config");

const initialData = {
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

function ensureDbFile() {
  const dirPath = path.dirname(dbFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function loadDb() {
  ensureDbFile();
  const content = fs.readFileSync(dbFilePath, "utf8");
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed.reminders)) {
    parsed.reminders = [];
  }
  if (!Array.isArray(parsed.follows)) {
    parsed.follows = [];
  }
  return parsed;
}

function saveDb(data) {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
}

function nextId(data, key) {
  const id = data.counters[key];
  data.counters[key] += 1;
  return id;
}

module.exports = {
  loadDb,
  saveDb,
  nextId
};
