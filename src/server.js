import app from "./app.js";
import { env } from "./config/env.js";
import { sequelize } from "./models/index.js";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        console.error(
          `Port ${env.port} is already in use. Stop the existing process or change PORT in server/.env.`,
        );
        process.exit(1);
      }

      console.error("Server error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
