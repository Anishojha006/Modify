const userModel = require("../models/user.model.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../config/cache");

async function registerUser(req, res) {
    const errors = {};
    let { username, email, password } = req.body;


    const isAlreadyregistered = await userModel.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    })


    if (isAlreadyregistered) {
        return res.status(409).json({
            message: "User already registered",
        })
    }
    const hasshedpassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username, email, password: hasshedpassword
    })

    const token = jwt.sign({
        id: user._id,
        email: user.email

    }, process.env.SECRET_KEY, { expiresIn: "3d" });

    res.cookie("token", token,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        }
    )

    res.status(201).json({
        mesage: "User is registered sucessfully "
        , user: {
            username: user.username,
            email: user.email
        }
    })


}

async function loginUser(req, res) {
    const { username, email, password } = req.body;


    const isAlreadyregistered = await userModel.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    }).select("+password");

    if (!isAlreadyregistered) {

        return res.status(400).json({
            message: "Invalid credentials 12"
        })
    }

    const isMatch = await bcrypt.compare(password, isAlreadyregistered.password);

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid credentials"
        })
    }

    const token = jwt.sign({
        id: isAlreadyregistered._id,
        email: isAlreadyregistered.email

    }, process.env.SECRET_KEY, { expiresIn: "3d" })

    res.cookie("token", token,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        }
    )
    res.status(200).json({
        message: "user loggedIn sucessfully",
        user: {
            username: isAlreadyregistered.username,
            email: isAlreadyregistered.email
        }
    })

}

async function getme(req, res) {

    const { id } = req.user;
    console.log(req.user.id);
    const user = await userModel.findById(id);

    res.status(200).json({
        message: "User fetched successfully",
        user
    })
}
async function logout(req, res) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "No token found."
        });
    }

    const decoded = jwt.decode(token);

    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);

    res.clearCookie("token");

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


module.exports = { registerUser, loginUser, getme, logout };