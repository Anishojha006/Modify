const bcrypt = require("bcryptjs");
const adminModel = require("adminModel");

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