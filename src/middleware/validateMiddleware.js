import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result
      .array()
      .map((err) => err.msg)
      .join(", ");
    return next(new ApiError(StatusCodes.BAD_REQUEST, message));
  }
  next();
};

export default validate;
