function errorHandler(err, req, res, _next) {
  // Log error internally (with stack trace for debugging)
  console.error('Unhandled error:', err);

  // Determine environment
  const isDev = process.env.NODE_ENV !== 'production';

  // Get error code and message safely
  const errorCode = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const errorMessage = isDev ? err.message : 'An unexpected error occurred';

  // For ValidationError, provide more details in dev only
  const details = isDev && err.errors ? { errors: err.errors } : undefined;

  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      ...(details && { details }),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
