import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login & register).
 *
 * Limits each IP to 10 requests per 15-minute window.
 * Any request past the threshold receives a 429 Too Many Requests response
 * with a JSON body describing the error and when to retry.
 *
 * Per security requirements: protects against brute-force login attacks
 * and automated credential-stuffing on the registration endpoint.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window per IP
  standardHeaders: true,     // Return `RateLimit-*` headers (RFC 6585)
  legacyHeaders: false,      // Disable `X-RateLimit-*` legacy headers
  message: {
    error: 'Too many requests',
    message:
      'You have exceeded the maximum number of authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes',
  },
  handler: (req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  // Skip in test environment so integration tests are not affected
  skip: () => process.env.NODE_ENV === 'test',
});
