const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const redis = require("../config/cache.js");
const Session = require("../models/session.model.js");

async function authUser(req, res, next) {
    const token = req.cookies?.token;
    const deviceSecret = req.cookies?.device_secret;

    if (!token || !deviceSecret) {
        return res.status(401).json({
            message: "Authentication failed",
        });
    }

    try {
        
        const isBlacklist = await redis.get(token);

        if (isBlacklist) {
            return res.status(401).json({
                message: "Authentication failed",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY
        );

        if (!decoded.id || !decoded.sid) {
            return res.status(401).json({
                message: "Authentication failed",
            });
        }

      
        const session = await Session.findOne({
            sessionId: decoded.sid,
            userId: decoded.id,
            expiresAt: { $gt: new Date() },
        });

        if (!session) {
            return res.status(401).json({
                message: "Authentication failed",
            });
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
            return res.status(403).json({
                message: "Authentication failed",
            });
        }

     
        req.user = decoded;
        req.sessionId = decoded.sid;

        return next();
    } catch (err) {
        if (
            err.name === "JsonWebTokenError" ||
            err.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Authentication failed",
            });
        }

        console.error("Authentication error:", err);

        return res.status(500).json({
            message: "Authentication failed",
        });
    }
}

module.exports = { authUser };
