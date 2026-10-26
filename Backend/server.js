require("dotenv").config();
const mongoose = require("mongoose");
const connectToDB = require("./src/config/database.js");
let redis;
let server;

const requiredEnvironmentVariables = [
    "MONGO_URI",
    "SECRET_KEY",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "IMAGEKIT_PRIVATE_KEY",
];

async function startServer() {
    const missingVariables = requiredEnvironmentVariables.filter(
        (name) => !process.env[name]
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }

    if (process.env.NODE_ENV === "production" && process.env.SECRET_KEY.length < 32) {
        throw new Error("SECRET_KEY must contain at least 32 characters in production.");
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
    await redis.ping();
    await connectToDB();

    const app = require("./src/app.js");
    server = app.listen(port, () => {
        console.log(`Server is live on port ${port}`);
    });

    return server;
}

async function shutdown(signal) {
    console.log(`${signal} received; shutting down.`);

    const forceShutdown = setTimeout(() => {
        console.error("Graceful shutdown timed out.");
        process.exit(1);
    }, 10_000);
    forceShutdown.unref();

    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }

        await Promise.all([
            mongoose.disconnect(),
            redis?.quit(),
        ]);
    } catch (error) {
        console.error("Error during graceful shutdown:", error);
        process.exitCode = 1;
    } finally {
        clearTimeout(forceShutdown);
    }
}

startServer()
    .then(() => {
        process.once("SIGINT", () => shutdown("SIGINT"));
        process.once("SIGTERM", () => shutdown("SIGTERM"));
    })
    .catch(async (error) => {
        console.error("Unable to start server:", error);
        if (redis) {
            redis.disconnect();
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exitCode = 1;
    });