const express = require("express");
const Authrouter = require("./routes/auth.routes.js");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",Authrouter);
module.exports = app;