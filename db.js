// db.js
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("Missing MONGODB_URI or DATABASE_URL.");
}

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Connected to MongoDB.");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

export default mongoose.connection;
