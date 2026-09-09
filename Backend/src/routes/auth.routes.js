const {Router} = require("express");
const Authrouter =  Router(); 
const authController = require("../controllers/auth.controller.js");
Authrouter.post("/register",authController.registerUser);
Authrouter.post("/login",authController.loginUser);


module.exports = Authrouter;