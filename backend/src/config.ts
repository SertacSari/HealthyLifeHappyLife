import dotenv from "dotenv";
dotenv.config();

export const port = parseInt(process.env.PORT || "4000", 10);
export const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/healthylife";
export const jwtSecret = process.env.JWT_SECRET || "ens492-dev-secret-change-in-production";
export const tokenTtlSeconds = parseInt(process.env.TOKEN_TTL_SECONDS || "86400", 10);
