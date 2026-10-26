const rateLimit = require("express-rate-limit");
const { MemoryStore } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { sendApiError } = require("../utils/apiError.js");

const memoryStores = process.env.NODE_ENV === "production"
  ? []
  : [new MemoryStore(), new MemoryStore(), new MemoryStore()];

function createStore(prefix, index) {
  if (process.env.NODE_ENV === "production") {
    const redis = require("../config/cache.js");
    return new RedisStore({
      prefix,
      sendCommand: (command, ...args) => redis.call(command, ...args),
    });
  }

  return memoryStores[index];
}

function createLimiter({ prefix, storeIndex, limit, message }) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(prefix, storeIndex),
    handler: (req, res) => sendApiError(res, 429, message),
  });
}

// General API limiter
const apiLimiter = createLimiter({
  prefix: "rate-limit:api:",
  storeIndex: 0,
  limit: 200,
  message: "Too many requests. Please try again after 15 minutes.",
});

// Strict limiter for authentication endpoints
const authLimiter = createLimiter({
  prefix: "rate-limit:auth:",
  storeIndex: 1,
  limit: 5,
  message: "Too many authentication attempts. Try again after 15 minutes.",
});

const adminAuthLimiter = createLimiter({
  prefix: "rate-limit:admin-auth:",
  storeIndex: 2,
  limit: 5,
  message: "Too many admin authentication attempts. Try again after 15 minutes.",
});

async function resetRateLimitStores() {
  if (process.env.NODE_ENV !== "production") {
    await Promise.all(memoryStores.map((store) => store.resetAll()));
  }
}

module.exports = {
  apiLimiter,
  authLimiter,
  adminAuthLimiter,
  resetRateLimitStores,
};