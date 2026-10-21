const express = require("express");
const cors = require("cors");
const path = require("path");
const Authrouter = require("./routes/auth.routes.js");
const cookieParser = require("cookie-parser");
const Songrouter = require("./routes/song.routes.js");
const adminrouter = require("./routes/admin.routes.js");

const app = express();
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

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/api/auth",Authrouter);
app.use("/api/songs",Songrouter);
app.use("/api/v1/admin", adminrouter);

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

module.exports = app;