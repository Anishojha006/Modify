const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"token is needed for blacklisting ."],
        unique:true
    }
},{
    timestamps:true
})


const blaclistModel = mongoose.model("tokenblacklisting",blacklistSchema);

module.exports = blaclistModel;