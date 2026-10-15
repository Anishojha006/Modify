require("dotenv").config();
const connectToDB = require("./src/config/database.js");
let redis;

const requiredEnvironmentVariables = [
    "MONGO_URI",
    "SECRET_KEY",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_URL_ENDPOINT",
];

async function startServer() {
    const missingVariables = requiredEnvironmentVariables.filter(
        (name) => !process.env[name]
    );

    const hasConfiguredCorsOrigin = (process.env.CORS_ORIGIN || "")
        .split(",")
        .some((origin) => origin.trim());

    if (process.env.NODE_ENV === "production" && !hasConfiguredCorsOrigin) {
        missingVariables.push("CORS_ORIGIN");
    }

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }

    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    const redisPort = Number(process.env.REDIS_PORT);
    if (!Number.isInteger(redisPort) || redisPort < 1 || redisPort > 65535) {
        throw new Error("REDIS_PORT must be an integer between 1 and 65535.");
    }

    redis = require("./src/config/cache.js");
    const app = require("./src/app.js");
    await connectToDB();

    app.listen(port, () => {
        console.log(`Server is live on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error("Unable to start server:", error);
    if (redis) {
        redis.disconnect();
    }
    process.exitCode = 1;
});