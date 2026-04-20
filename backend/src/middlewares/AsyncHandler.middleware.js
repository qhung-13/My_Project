/**
 * Async handler wrapper to avoid try/catch boilerplate in controllers
 * Catches any async errors and forwards them to the error handler
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    res.status(res.statusCode !== 200 ? res.statusCode : 500).json({
      message: error.message,
    });
  });
};

export default asyncHandler;
