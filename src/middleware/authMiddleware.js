import { StatusCodes } from "http-status-codes";
import { User } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

export const protect = async (req, res, next) => {
  const token = req.cookies?.[env.cookieName];

  if (!token) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Not authenticated."));
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("email role");
    if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid token."));
    }
    req.user = user;
    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, "Session expired."));
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.[env.cookieName];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("email role");
    req.user = user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, "Insufficient permission."));
  }
  next();
};
