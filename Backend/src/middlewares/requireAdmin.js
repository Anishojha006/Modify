const redis = require("../config/cache.js");
const adminModel = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");
const { sendApiError } = require("../utils/apiError.js");

async function adminVerification(req, res, next) {
    try {
        const token = req.cookies?.admin_token;

        if (!token) {
            return sendApiError(res, 401, "Unauthorized");
        }

        const isBlacklist = await redis.get(token);
        if (isBlacklist) {
            return sendApiError(res, 401, "Invalid token");
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (error) {
            if (
                ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)
            ) {
                return sendApiError(res, 401, "Invalid token");
            }

            throw error;
        }

        if (decoded.role !== "admin" || !decoded.id) {
            return sendApiError(res, 401, "Unauthorized");
        }

        const admin = await adminModel.findById(decoded.id);
        if (!admin) {
            return sendApiError(res, 401, "Unauthorized access");
        }

        req.user = {
            id: admin._id,
            username: admin.username,
            role: "admin",
        };
        return next();
    } catch (error) {
        console.error("Admin authentication error:", error);
        return sendApiError(res, 500, "Admin authentication failed.");
    }
}

module.exports = adminVerification;