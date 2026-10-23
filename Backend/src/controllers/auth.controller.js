
const userModel = require("../models/user.model.js");
const Session = require("../models/session.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const redis = require("../config/cache.js");

const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000;

function getCookieOptions(expiresAt) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
        expires: expiresAt,
    };
}

function getEmailFilter(email) {
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return {
        email: {
            $regex: `^${escapedEmail}$`,
            $options: "i",
        },
    };
}

async function createDeviceSession(req, res, user, statusCode = 200) {
    const sessionId = crypto.randomUUID();
    const deviceSecret = crypto.randomBytes(32).toString("hex");

    const deviceSecretHash = crypto
        .createHash("sha256")
        .update(deviceSecret)
        .digest("hex");

    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    await Session.create({
        userId: user._id,
        sessionId,
        deviceSecretHash,
        expiresAt,
    });

    const token = jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: "user",
            sid: sessionId,
        },
        process.env.SECRET_KEY,
        { expiresIn: "3d" }
    );

    const cookieOptions = getCookieOptions(expiresAt);

    res.cookie("token", token, cookieOptions);
    res.cookie("device_secret", deviceSecret, cookieOptions);

    return res.status(statusCode).json({
        message:
            statusCode === 201
                ? "User registered successfully"
                : "User logged in successfully",
        user: {
            username: user.username,
            email: user.email,
        },
    });
}


async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body || {};

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Username, email and password must be provided as text",
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (
            normalizedUsername.length < 3 ||
            normalizedUsername.length > 50 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
            password.length < 8
        ) {
            return res.status(400).json({
                message:
                    "Use a username of 3-50 characters, a valid email, and a password of at least 8 characters.",
            });
        }

        const existingUser = await userModel.findOne({
            $or: [
                getEmailFilter(normalizedEmail),
                { username: normalizedUsername },
            ],
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
        });

        return await createDeviceSession(req, res, user, 201);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Username or email is already registered",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Unable to register user",
        });
    }
}


async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body || {};
        const normalizedUsername =
            typeof username === "string" ? username.trim() : "";
        const normalizedEmail =
            typeof email === "string" ? email.trim().toLowerCase() : "";

        if (
            (!normalizedUsername && !normalizedEmail) ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Provide username or email and password",
            });
        }

        const identifiers = [];

        if (normalizedEmail) {
            identifiers.push(getEmailFilter(normalizedEmail));
        }
        if (normalizedUsername) {
            identifiers.push({ username: normalizedUsername });
        }

        const user = await userModel
            .findOne(
                identifiers.length > 1
                    ? { $or: identifiers }
                    : identifiers[0]
            )
            .select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        return await createDeviceSession(req, res, user);
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Unable to log in",
        });
    }
}


async function getme(req, res) {
    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user,
        });
    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            message: "Unable to fetch user",
        });
    }
}

// LOGOUT
async function logout(req, res) {
    try {
        const token = req.cookies?.token;

        if (token) {
            const decoded = jwt.decode(token);

            if (decoded?.sid && decoded?.id) {
                await Session.deleteOne({
                    sessionId: decoded.sid,
                    userId: decoded.id,
                });
            }

            if (decoded?.exp) {
                const remainingTime =
                    decoded.exp - Math.floor(Date.now() / 1000);

                if (remainingTime > 0) {
                    await redis.set(
                        token,
                        "blacklisted",
                        "EX",
                        remainingTime
                    );
                }
            }
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "strict",
            path: "/",
        };

        res.clearCookie("token", cookieOptions);
        res.clearCookie("device_secret", cookieOptions);

        return res.status(200).json({
            message: "Successfully logged out",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Unable to log out",
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getme,
    logout,
};
