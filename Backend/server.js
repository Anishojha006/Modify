require("dotenv").config();
const app = require("./src/app.js");
const connectToDB = require("./src/config/database.js");
const dns = require("dns");
dns.setServers(["8.8.8.8","8.8.8.7"])

connectToDB();
app.listen(3000,()=>{
    console.log("Server is live on 3000 port");
})