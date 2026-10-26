const rateLimit = require("express-rate-limit");

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200,               // 200 requests per IP
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,                  // 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};