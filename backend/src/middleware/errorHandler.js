const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res
        .status(400)
        .json({ message: "File too large. Max size is 5MB." });
    }
    return res.status(400).json({ message: err.message });
  }

  // Validation errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors.map((e) => ({ [e.path]: e.message })),
    });
  }

  // Unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      message: "Duplicate entry",
      errors: err.errors.map((e) => ({
        [e.path]: "This value already exists",
      })),
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
