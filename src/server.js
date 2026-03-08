import app from "./app.js";
import { sequelize } from "./models/index.js";
import { env } from "./config/env.js";

let dbConnected = false;

const connectDatabase = async () => {
  await sequelize.authenticate();
  dbConnected = true;
  app.locals.dbConnected = true;
  console.log("Database connected successfully");

  if (env.dbSync) {
    await sequelize.sync({ alter: true });
    console.log("Database synced (alter=true)");
  } else {
    console.log("Database sync skipped (set DB_SYNC=true to enable)");
  }
};

const scheduleDbReconnect = () => {
  if (dbConnected) return;

  setTimeout(async () => {
    if (dbConnected) return;

    try {
      console.log("Retrying database connection...");
      await connectDatabase();
    } catch (error) {
      console.error("Database reconnect failed:", error.message);
      scheduleDbReconnect();
    }
  }, env.dbConnectRetryMs);
};

const startServer = async () => {
  const port = env.port || 5000;

  try {
    await connectDatabase();
  } catch (error) {
    dbConnected = false;
    app.locals.dbConnected = false;

    console.error("Initial DB connection failed:", error.message);
    console.error(
      `Current DB target: ${env.dbHost}:${env.dbPort}/${env.dbName} (ssl=${env.dbSsl})`,
    );
    console.error(
      "DB reconnect will continue in background. Update .env credentials and restart.",
    );

    if (env.exitOnDbFailure) {
      if (error?.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  const server = app.listen(port, () =>
    console.log(`Server running on port ${port} in ${env.nodeEnv} mode`),
  );

  server.on("error", (err) => {
    if (err?.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use.`);
      process.exit(1);
    }
    console.error("Server error:", err.message);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    server.close(() => process.exit(1));
  });

  if (!dbConnected && !env.exitOnDbFailure) {
    scheduleDbReconnect();
  }

  process.on("SIGTERM", async () => {
    try {
      await sequelize.close();
    } finally {
      process.exit(1);
    }
  });
};

startServer();
