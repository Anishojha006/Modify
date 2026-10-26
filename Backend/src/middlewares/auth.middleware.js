const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const redis = require("../config/cache.js");
const Session = require("../models/session.model.js");
const { sendApiError } = require("../utils/apiError.js");

async function authUser(req, res, next) {
    const token = req.cookies?.token;
    const deviceSecret = req.cookies?.device_secret;

    if (!token || !deviceSecret) {
        return sendApiError(res, 401, "Authentication failed");
    }

    try {
        
        const isBlacklist = await redis.get(token);

        if (isBlacklist) {
            return sendApiError(res, 401, "Authentication failed");
        }

        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY
        );

        if (!decoded.id || !decoded.sid) {
            return sendApiError(res, 401, "Authentication failed");
        }

      
        const session = await Session.findOne({
            sessionId: decoded.sid,
            userId: decoded.id,
            expiresAt: { $gt: new Date() },
        });

        if (!session) {
            return sendApiError(res, 401, "Authentication failed");
        }

     
        const suppliedHash = crypto
            .createHash("sha256")
            .update(deviceSecret)
            .digest();

        const storedHash = Buffer.from(
            session.deviceSecretHash,
            "hex"
        );

        if (
            storedHash.length !== suppliedHash.length ||
            !crypto.timingSafeEqual(suppliedHash, storedHash)
        ) {
            return sendApiError(res, 403, "Authentication failed");
        }

     
        req.user = decoded;
        req.sessionId = decoded.sid;

        return next();
    } catch (err) {
        if (
            ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)
        ) {
            return sendApiError(res, 401, "Authentication failed");
        }

        console.error("Authentication error:", err);

        return sendApiError(res, 500, "Authentication failed");
    }
}

module.exports = { authUser };
