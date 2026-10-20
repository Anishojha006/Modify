const {Router} = require("express");
const {adminLogin} = require("../controllers/admin.controller");

const adminrouter = Router();

adminrouter.post("/login",adminLogin);

module.exports = adminrouter;