const bcrypt = require("bcryptjs");
const adminModel = require("../models/admin.model.js");
const jwt = require("jsonwebtoken");
const redis = require("../config/cache.js");

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
            role:"admin"

        }, process.env.SECRET_KEY, { expiresIn: "3d" })

        res.cookie("token", token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                maxAge: 3 * 24 * 60 * 60 * 1000
            }
        )


        res.status(200).json({
            message: "Credentials verified successfully.",
            admin: {
                id: adim._id,
                username: admin.username,
                role: admin.role
            }
        });
    }
    catch (error) {
        console.error("Admin login error", error);

        return res.status(500).json({
            message: "An internal server error occured.",
        });

    }
}

module.exports = {adminLogin}