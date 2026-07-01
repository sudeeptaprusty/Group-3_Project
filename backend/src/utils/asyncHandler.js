// Express middleware utility that catches rejected promises and passes them to the next error handler middleware
function asyncHandler(fn) {
  return (req, res, next) => {
    // Resolve the promise and forward any thrown errors to the error middleware via next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Global utility helper to format service error responses
function handleServiceError(res, err, fallbackMessage) {
  // Extract error status code, defaulting to 500
  const status = err.statusCode || 500;
  // Send formatted JSON error payload
  res.status(status).json({ error: err.message || fallbackMessage, message: err.details });
}

// Export the utility helpers
module.exports = { asyncHandler, handleServiceError };
