const bcrypt = require("bcryptjs");
const adminModel = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");
const redis = require("../config/cache.js");

const { setCsrfTokenCookie } = require("../middlewares/csrf.middleware.js");
const { sendApiError } = require("../utils/apiError.js");

function getAdminCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
    };
}

async function adminLogin(req, res) {
    try {
        const { username, password } = req.body || {};

        if (
            typeof username !== "string"
            ||
            typeof password !== "string"
            ||
            !username.trim() ||
            !password
        ) {
            return sendApiError(res, 401, "Invalid credentials");
        }

        const admin = await adminModel.findOne(({
            username: username.trim()
        }))

        if (!admin) {
            return sendApiError(res, 401, "Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.passwordHash
        )
        if (!isPasswordValid) {
            return sendApiError(res, 401, "Invalid credentials");
        }

        const token = jwt.sign({
            id: admin._id,
            username: admin.username,
            role: "admin"

        }, process.env.SECRET_KEY, { expiresIn: "3d" })

        res.cookie("admin_token", token, getAdminCookieOptions());
        setCsrfTokenCookie(res);

        res.status(200).json({
            message: "Credentials verified successfully.",
            admin: {
                id: admin._id,
                username: admin.username,
                role: "admin"
            }
        });
    }
    catch (error) {
        console.error("Admin login error", error);

        return sendApiError(res, 500, "An internal server error occurred.");

    }
}

async function getme(req, res) {
    try {
        const token = req.cookies.admin_token;

        if (!token) {
            return sendApiError(res, 401, "Unauthorized");
        }
        const isBlacklist = await redis.get(token);
        if (isBlacklist) {
            return sendApiError(res, 401, "Invalid token");
        }

        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY,
        );
        if (decoded.role !== "admin" || !decoded.id) {
            return sendApiError(res, 401, "Unauthorized");
        }
        const admin = await adminModel.findById(decoded.id);

        if (!admin) {
            return sendApiError(res, 401, "Unauthorized access");
        }

        return res.status(200).json({
            message: "Admin logged in successfully.",
            admin: {
                id: admin._id,
                username: admin.username,
                role: "admin"
            }
        });
    }
    catch (err) {
        if (
            ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)
        ) {
            return sendApiError(res, 401, "Unauthorized");
        }

        console.error("Admin authentication error", err);
        return sendApiError(res, 500, "Unable to verify admin session.");
    }
}

async function adminlogout(req, res) {
    try {
        const token = req.cookies?.admin_token;
        const decoded = token ? jwt.decode(token) : null;
        const remainingTime = decoded?.exp
            ? decoded.exp - Math.floor(Date.now() / 1000)
            : 0;

        if (token && remainingTime > 0) {
            await redis.set(token, "blacklisted", "EX", remainingTime);
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        };
        res.clearCookie("admin_token", cookieOptions);
        res.clearCookie("csrf_token", { ...cookieOptions, httpOnly: false });

        return res.status(200).json({
            message: "Successfully logged out."
        });
    } catch (error) {
        console.error("Admin logout error:", error);
        return sendApiError(res, 500, "Unable to log out admin.");
    }
}

module.exports = { adminLogin, getme, adminlogout };