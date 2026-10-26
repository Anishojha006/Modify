const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const Authrouter = require("./routes/auth.routes.js");
const cookieParser = require("cookie-parser");
const Songrouter = require("./routes/song.routes.js");
const adminrouter = require("./routes/admin.routes.js");
const { apiLimiter } = require("./middlewares/rateLimit.middleware.js");
const { requireCsrfToken, setCsrfTokenCookie } = require("./middlewares/csrf.middleware.js");
const { sendApiError, errorHandler } = require("./utils/apiError.js");

const app = express();
const configuredTrustProxy = process.env.TRUST_PROXY?.trim();
if (configuredTrustProxy) {
	app.set(
		"trust proxy",
		/^\d+$/.test(configuredTrustProxy)
			? Number(configuredTrustProxy)
			: configuredTrustProxy
	);
}

app.disable("x-powered-by");
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		callback(null, !origin || allowedOrigins.includes(origin));
	},
	credentials: true,
}));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use("/api", apiLimiter);
app.use(requireCsrfToken);

app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

app.get("/ready", (req, res) => {
	const mongoose = require("mongoose");
	const redis = require("./config/cache.js");
	const ready = mongoose.connection.readyState === 1 && redis.status === "ready";

	return res.status(ready ? 200 : 503).json({
		status: ready ? "ready" : "not_ready",
	});
});

app.get("/api/csrf-token", (req, res) => {
	setCsrfTokenCookie(res);
	return res.status(200).json({ message: "CSRF token refreshed." });
});

app.use("/api/auth", Authrouter);
app.use("/api/songs", Songrouter);
app.use("/api/v1/admin", adminrouter);
app.use("/api", (req, res) => sendApiError(res, 404, "API endpoint not found."));

const publicDirectory = path.join(__dirname, "public");
app.use(express.static(publicDirectory));
app.use((req, res, next) => {
	if (
		req.method !== "GET"
		|| req.path === "/api"
		|| req.path.startsWith("/api/")
	) {
		return next();
	}

	res.sendFile(path.join(publicDirectory, "index.html"), (error) => {
		if (error) next(error);
	});
});
app.use(errorHandler);
module.exports = app;