const Redis = require("ioredis");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    connectTimeout: 10_000,
    maxRetriesPerRequest: 3,
    retryStrategy(retries) {
        return Math.min(retries * 250, 2_000);
    },
});

redis.on("connect", () => {
    console.log("Server is connected to Redis");
});

redis.on("error", (error) => {
    console.error("Redis connection error:", error);
});

module.exports = redis;