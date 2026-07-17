/**
 * Async handler wrapper to avoid try/catch boilerplate in controllers
 * Catches any async errors and forwards them to the error handler
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
/**
 * Async handler wrapper to avoid try/catch boilerplate in controllers
 * Forwards errors to Express' centralized error handler by calling next(err).
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
