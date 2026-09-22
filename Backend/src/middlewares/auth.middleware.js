const userModel = require("../models/user.model.js");
const blaclistModel = require("../models/blacklist.model.js");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "token not provided"
        })
    }
    const isBlacklist = await  blaclistModel.findOne({
        token
    })
    if (isBlacklist) {
        return res.status(404).json({
            message: "invalid token"
        })
    }
    try {

        const decoded = jwt.verify(
            token,
            process.env.SECRET_KEY,
        )
        req.user = decoded;
        next()
    }
    catch (err) {
        return res.status(401).json({
            message: "invalid token"
        })
    }
}

module.exports = { authUser };