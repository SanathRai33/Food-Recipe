const multer = require("multer");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      const response = ApiResponse.error(
        "File too large. Max size is 5MB.",
        { field: err.field },
        400
      );
      return sendResponse(res, response);
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      const response = ApiResponse.error(
        "Too many files uploaded",
        { field: err.field },
        400
      );
      return sendResponse(res, response);
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      const response = ApiResponse.error(
        "Unexpected file field",
        { field: err.field },
        400
      );
      return sendResponse(res, response);
    }
    const response = ApiResponse.error(err.message, null, 400);
    return sendResponse(res, response);
  }

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message
    }));
    const response = ApiResponse.error("Validation error", errors, 400);
    return sendResponse(res, response);
  }

  // Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} already exists`
    }));
    const response = ApiResponse.error("Duplicate entry", errors, 400);
    return sendResponse(res, response);
  }

  // Sequelize foreign key errors
  if (err.name === "SequelizeForeignKeyConstraintError") {
    const response = ApiResponse.error(
      "Referenced record does not exist",
      { table: err.table },
      400
    );
    return sendResponse(res, response);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const response = ApiResponse.error("Invalid token", null, 401);
    return sendResponse(res, response);
  }

  if (err.name === "TokenExpiredError") {
    const response = ApiResponse.error("Token expired", null, 401);
    return sendResponse(res, response);
  }

  // Rate limiting errors
  if (err.name === "RateLimitError") {
    const response = ApiResponse.error("Too many requests", null, 429);
    return sendResponse(res, response);
  }

  // Default error
  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong!";
  const response = ApiResponse.error(
    message,
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null,
    statusCode
  );
  return sendResponse(res, response);
};

module.exports = errorHandler;