function notFound(req, res, next) {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "The requested API resource was not found." });
  }

  return next();
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    message: error.message || "Unexpected server error."
  });
}

module.exports = { notFound, errorHandler };

