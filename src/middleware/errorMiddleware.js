import { StatusCodes } from "http-status-codes";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message =
    err.message || "Something went wrong while processing the request.";

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

export default errorMiddleware;
