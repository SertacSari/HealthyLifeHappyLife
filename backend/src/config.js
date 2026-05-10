require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/healthylife",
  jwtSecret: process.env.JWT_SECRET || "ens492-dev-secret-change-in-production",
  tokenTtlSeconds: parseInt(process.env.TOKEN_TTL_SECONDS, 10) || 86400
};

module.exports = config;
