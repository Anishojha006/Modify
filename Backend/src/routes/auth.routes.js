const { Router } = require("express");
const Authrouter = Router();
const authController = require("../controllers/auth.controller.js");
const AuthMiddleware = require("../middlewares/auth.middleware.js");
const { authLimiter } = require(
  "../middleware/rateLimit.middleware.js"
);

Authrouter.post("/register",authLimiter,authController.registerUser);

Authrouter.post("/login",authLimiter, authController.loginUser);

Authrouter.get("/get-me", AuthMiddleware.authUser, authController.getme);

Authrouter.post("/logout", authController.logout);






module.exports = Authrouter;

