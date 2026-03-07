import app from "./app.js";
import { env } from "./config/env.js";
import { sequelize } from "./models/index.js";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    // Try connecting to database
    try {
      await sequelize.authenticate();
      console.log("Database connected successfully");

      await sequelize.sync();
      console.log("Database synced");
    } catch (dbError) {
      console.error("Database connection failed:", dbError.message);
    }

    // Start server
    const PORT = env.port || process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Change the PORT or stop the running process.`,
        );
        process.exit(1);
      }

      console.error("Server error:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

start();
