const {Router} = require("express");
const Adminroutes = require("../controllers/admin.controller");
const adminrouter = Router();

adminrouter.post("/login", Adminroutes.adminLogin);
adminrouter.get("/getme",Adminroutes.getme);

module.exports = adminrouter;