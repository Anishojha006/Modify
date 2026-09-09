const mongoose = require("mongoose");

const connectToDB= async ()=>{
    console.log(process.env.MONGO_URI);
   await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected to  database"); 
}
module.exports = connectToDB;
