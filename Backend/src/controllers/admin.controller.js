const bcrypt = require("bcryptjs");
const adminModel = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");
const redis = require("../config/cache.js");

function getAdminCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60 * 1000,
    };
}

async function adminLogin(req, res) {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string"
            ||
            typeof password !== "string"
            ||
            !username.trim() ||
            !password
        ) {
            return res.status(401).json({
                message: "invalid credentials"
            });
        }

        const admin = await adminModel.findOne(({
            username: username.trim()
        }))

        if (!admin) {
            return res.status(401).json({
                message: "invalid credentials"
            })
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            admin.passwordHash
        )
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "invalid credentials"
            })
        }

        const token = jwt.sign({
            id: admin._id,
            username: admin.username,
            role: "admin"

        }, process.env.SECRET_KEY, { expiresIn: "3d" })

        res.cookie("admin_token", token, getAdminCookieOptions());


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

        return res.status(500).json({
            message: "An internal server error occurred.",
        });

    }
}

async function getme(req, res) {
    try {
        const token = req.cookies.admin_token;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const isBlacklist = await redis.get(token);
        if (isBlacklist) {
            return res.status(404).json({
                message: "invalid token"
            })
        }

        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY,
        );
        if (decoded.role !== "admin" || !decoded.id) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const admin = await adminModel.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({
                message: "Unauthorized access"
            });
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
        console.error("Admin authentication error", err);
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}

async function adminlogout(req, res) {
    const token = req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({
            message: "No token found."
        });
    }

    const decoded = jwt.decode(token);

    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);

    res.clearCookie("admin_token");

    if (remainingTime > 0) {
        await redis.set(
            token,
            "blacklisted",
            "EX",
            remainingTime
        );
    }

    return res.status(200).json({
        message: "Successfully logged out."
    });
}

module.exports = { adminLogin, getme, adminlogout };