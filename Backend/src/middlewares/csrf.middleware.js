const crypto = require("crypto");

const CSRF_COOKIE_NAME = "csrf_token";

function getCookieOptions() {
    return {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };
}

function createCsrfToken() {
    return crypto.randomBytes(32).toString("hex");
}

function setCsrfTokenCookie(res, token = createCsrfToken()) {
    res.cookie(CSRF_COOKIE_NAME, token, getCookieOptions());
    return token;
}

function requireCsrfToken(req, res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    const excludedPaths = new Set([
        "/api/auth/login",
        "/api/auth/register",
        "/api/v1/admin/login",
    ]);

    if (excludedPaths.has(req.path)) {
        return next();
    }

    const cookieToken = req.cookies?.csrf_token;
    const headerToken = req.headers["x-csrf-token"];

    if (!cookieToken || !headerToken) {
        return res.status(403).json({ message: "Invalid CSRF token." });
    }

    try {
        const cookieBuffer = Buffer.from(cookieToken, "utf8");
        const headerBuffer = Buffer.from(headerToken, "utf8");

        if (
            cookieBuffer.length !== headerBuffer.length ||
            !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
        ) {
            return res.status(403).json({ message: "Invalid CSRF token." });
        }
    } catch (error) {
        return res.status(403).json({ message: "Invalid CSRF token." });
    }

    return next();
}

module.exports = {
    CSRF_COOKIE_NAME,
    createCsrfToken,
    setCsrfTokenCookie,
    requireCsrfToken,
};
