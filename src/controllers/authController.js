import { StatusCodes } from "http-status-codes";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/index.js";
import { signToken } from "../utils/jwt.js";
import { env, isProd } from "../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res, next) => {
  const { email, password, role = "employee" } = req.body;
  const normalizedRole = role === "Manager" ? "employee" : role;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return next(new ApiError(StatusCodes.CONFLICT, "Email is already in use."));
  }

  const user = await User.create({ email, password, role: normalizedRole });
  const token = signToken({ id: user.id, role: user.role });

  res.cookie(env.cookieName, token, cookieOptions);
  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials."));
  }

  const token = signToken({ id: user.id, role: user.role });
  res.cookie(env.cookieName, token, cookieOptions);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: { user: req.user || null },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookieName, cookieOptions);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logged out successfully.",
  });
});
