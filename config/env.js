import fs from "fs";
import Path from "path";

function loadDotEnv() {
  const envPath = Path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI is missing. Add it to .env or your deployment environment.");
}

export const env = {
  mongoUri,
  dbName: process.env.MONGO_DB_NAME || process.env.DB_NAME || "balajiStore",
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  cookieMaxAgeDays: Number(process.env.COOKIE_MAX_AGE_DAYS || 30),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "balaji_session",
  userCookieName: process.env.USER_COOKIE_NAME || "balaji_uid",
};

export const isProduction = env.nodeEnv === "production";
