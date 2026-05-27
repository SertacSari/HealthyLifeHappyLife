const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const index = line.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 12),
  dbProvider: (process.env.DB_PROVIDER || (process.env.DATABASE_URL ? "postgres" : "json")).toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || "",
  pgSslEnabled: String(process.env.PG_SSL_ENABLED || "false").toLowerCase() === "true",
  pgSslRejectUnauthorized: String(process.env.PG_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() === "true",
  dbFilePath: path.join(__dirname, "..", "data", "db.json"),
  recommendationEngineMode: process.env.RECOMMENDATION_ENGINE_MODE || "rules",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "chat-latest",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  openaiTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 8000),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 8000),
  fatsecretClientId: process.env.FATSECRET_CLIENT_ID || "",
  fatsecretClientSecret: process.env.FATSECRET_CLIENT_SECRET || "",
  fatsecretScope: process.env.FATSECRET_SCOPE || "basic",
  fatsecretOauthUrl: process.env.FATSECRET_OAUTH_URL || "https://oauth.fatsecret.com/connect/token",
  fatsecretApiBaseUrl: process.env.FATSECRET_API_BASE_URL || "https://platform.fatsecret.com/rest",
  fatsecretRegion: process.env.FATSECRET_REGION || "",
  fatsecretLanguage: process.env.FATSECRET_LANGUAGE || "",
  fatsecretTimeoutMs: Number(process.env.FATSECRET_TIMEOUT_MS || 8000)
};
