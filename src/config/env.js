// config/env.js
import dotenv from "dotenv";

dotenv.config();

const clean = (value) => (typeof value === "string" ? value.trim() : value);

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "undefined") return defaultValue;
  return String(value).toLowerCase() === "true";
};

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) return {};

  try {
    const url = new URL(databaseUrl);
    return {
      dbHost: url.hostname,
      dbPort: Number(url.port || 3306),
      dbUser: decodeURIComponent(url.username || ""),
      dbPassword: decodeURIComponent(url.password || ""),
      dbName: decodeURIComponent((url.pathname || "").replace(/^\//, "")),
    };
  } catch {
    throw new Error("Invalid DATABASE_URL format");
  }
};

const nodeEnv = clean(process.env.NODE_ENV) || "development";
const candidateDatabaseUrl =
  clean(process.env.DATABASE_URL) ||
  clean(process.env.MYSQL_PUBLIC_URL) ||
  clean(process.env.MYSQL_URL) ||
  "";

const dbFromUrl = parseDatabaseUrl(candidateDatabaseUrl);

const dbHost =
  clean(process.env.DB_HOST) ||
  clean(process.env.MYSQLHOST) ||
  clean(dbFromUrl.dbHost);
const dbPort = Number(
  clean(process.env.DB_PORT) ||
    clean(process.env.MYSQLPORT) ||
    dbFromUrl.dbPort ||
    3306,
);
const dbUser =
  clean(process.env.DB_USER) ||
  clean(process.env.MYSQLUSER) ||
  clean(dbFromUrl.dbUser);
const dbPassword =
  clean(process.env.DB_PASSWORD) ||
  clean(process.env.MYSQLPASSWORD) ||
  clean(dbFromUrl.dbPassword) ||
  "";
const dbName =
  clean(process.env.DB_NAME) ||
  clean(process.env.MYSQLDATABASE) ||
  clean(dbFromUrl.dbName);
const isLocalDbHost = ["localhost", "127.0.0.1"].includes(String(dbHost));

if (!dbHost) throw new Error("Missing DB host (set DB_HOST or DATABASE_URL)");
if (!dbPort) throw new Error("Missing DB port (set DB_PORT or DATABASE_URL)");
if (!dbUser) throw new Error("Missing DB user (set DB_USER or DATABASE_URL)");
if (!dbName) throw new Error("Missing DB name (set DB_NAME or DATABASE_URL)");
if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}
if (nodeEnv === "production" && isLocalDbHost) {
  throw new Error(
    "Invalid production DB host: localhost. Set DATABASE_URL (or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME) to your Railway database.",
  );
}

// Export environment variables in a clean object
export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  clientOrigin:
    process.env.CLIENT_ORIGIN ||
    "https://arunkumar-git-main-arunkumar3624s-projects.vercel.app",
  databaseUrl: candidateDatabaseUrl,

  // Database
  dbHost,
  dbPort,
  dbUser,
  dbPassword,
  dbName,
  dbSync: parseBoolean(process.env.DB_SYNC, false),
  dbSsl: parseBoolean(
    process.env.DB_SSL,
    nodeEnv === "production" || !isLocalDbHost,
  ),
  dbConnectRetryMs: Number(process.env.DB_CONNECT_RETRY_MS || 10000),
  exitOnDbFailure: parseBoolean(process.env.EXIT_ON_DB_FAILURE, false),

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  cookieName: process.env.COOKIE_NAME || "ems_token",
};

// Flag to quickly check if in production
export const isProd = env.nodeEnv === "production";
