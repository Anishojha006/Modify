const redis = require("../config/cache.js");
const adminModel = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");

async function adminVerification(req, res, next) {
    try {
        const token = req.cookies?.admin_token;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const isBlacklist = await redis.get(token);
        if (isBlacklist) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        if (decoded.role !== "admin" || !decoded.id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const admin = await adminModel.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({
                message: "Unauthorized access",
            });
        }

        req.user = {
            id: admin._id,
            username: admin.username,
            role: "admin",
        };
        return next();
    } catch (error) {
        console.error("Admin authentication error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

module.exports = adminVerification;