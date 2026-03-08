import mongoose from "mongoose";
import { env } from "./env.js";

const maskUri = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");

export const connectDatabase = async () => {
  await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected: ${maskUri(env.mongodbUri)}`);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
};
