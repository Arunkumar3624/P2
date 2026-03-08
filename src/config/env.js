import dotenv from "dotenv";

dotenv.config();

const clean = (value) => (typeof value === "string" ? value.trim() : value);
const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");
const parseOrigins = (value = "") =>
  String(value)
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "undefined") return defaultValue;
  return String(value).toLowerCase() === "true";
};

const nodeEnv = clean(process.env.NODE_ENV) || "development";
const clientOrigins = parseOrigins(
  process.env.CLIENT_ORIGIN ||
    "https://arunkumar-pied.vercel.app,http://localhost:5173",
);
const mongodbUri =
  clean(process.env.MONGODB_URI) || clean(process.env.DATABASE_URL) || "";

if (!mongodbUri) {
  throw new Error(
    "Missing MongoDB connection string (set MONGODB_URI or DATABASE_URL).",
  );
}
if (!/^mongodb(\+srv)?:\/\//.test(mongodbUri)) {
  throw new Error("Invalid MongoDB URI format.");
}
if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  clientOrigins,
  mongodbUri,
  dbConnectRetryMs: Number(process.env.DB_CONNECT_RETRY_MS || 10000),
  exitOnDbFailure: parseBoolean(process.env.EXIT_ON_DB_FAILURE, false),

  // Auth
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  cookieName: process.env.COOKIE_NAME || "ems_token",
};

export const isProd = env.nodeEnv === "production";
