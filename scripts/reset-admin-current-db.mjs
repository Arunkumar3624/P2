import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

dotenv.config();

const DB_URL = process.env.MONGODB_URI || process.env.DATABASE_URL;
const ADMIN_EMAIL = "admin@ems.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_ROLE = "Admin";

if (!DB_URL) {
  throw new Error("MONGODB_URI or DATABASE_URL is missing.");
}

await mongoose.connect(DB_URL);

try {
  const email = ADMIN_EMAIL.toLowerCase();
  let user = await User.findOne({ email });

  if (user) {
    user.password = ADMIN_PASSWORD;
    user.role = ADMIN_ROLE;
    await user.save();
  } else {
    user = await User.create({
      email,
      password: ADMIN_PASSWORD,
      role: ADMIN_ROLE,
    });
  }

  console.log(
    JSON.stringify(
      {
        database: DB_URL,
        email: user.email,
        roleUsed: user.role,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
