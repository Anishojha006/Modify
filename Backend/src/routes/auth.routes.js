const { Router } = require("express");
const Authrouter = Router();
const authController = require("../controllers/auth.controller.js");
const AuthMiddleware = require("../middlewares/auth.middleware.js");

Authrouter.post("/register",authController.registerUser);

Authrouter.post("/login", authController.loginUser);

Authrouter.get("/get-me", AuthMiddleware.authUser, authController.getme);

Authrouter.get("/logout",authController.logout);


module.exports = Authrouter;