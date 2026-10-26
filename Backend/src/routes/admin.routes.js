const {Router} = require("express");
const Adminroutes = require("../controllers/admin.controller");
const { adminAuthLimiter } = require("../middlewares/rateLimit.middleware.js");
const adminrouter = Router();

adminrouter.post("/login", adminAuthLimiter, Adminroutes.adminLogin);
adminrouter.get("/getme", Adminroutes.getme);
adminrouter.post("/logout", Adminroutes.adminlogout);

module.exports = adminrouter;