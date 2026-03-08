import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

let dbConnected = false;

const tryConnectDatabase = async () => {
  try {
    await connectDatabase();
    dbConnected = true;
    app.locals.dbConnected = true;
  } catch (err) {
    dbConnected = false;
    app.locals.dbConnected = false;
    console.error("Database connection failed:", err.message);
    throw err;
  }
};

const scheduleDbReconnect = () => {
  if (dbConnected) return;

  setTimeout(async () => {
    if (dbConnected) return;

    try {
      console.log("Retrying database connection...");
      await tryConnectDatabase();
    } catch (err) {
      console.error("Database reconnect failed:", err.message);
      scheduleDbReconnect();
    }
  }, env.dbConnectRetryMs);
};

const startServer = async () => {
  try {
    await tryConnectDatabase();
  } catch {
    console.error("Initial DB connection failed, retrying in background...");
    scheduleDbReconnect();
  }

  const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });

  const gracefulShutdown = async () => {
    server.close(async () => {
      try {
        await disconnectDatabase();
      } catch (err) {
        console.error("Error disconnecting MongoDB:", err.message);
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
};

startServer();