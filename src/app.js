import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { StatusCodes } from "http-status-codes";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  const dbConnected = Boolean(req.app.locals.dbConnected);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "EMS API is healthy.",
    dbConnected,
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/departments", departmentRoutes);

app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found.",
  });
});

app.use(errorMiddleware);

export default app;
