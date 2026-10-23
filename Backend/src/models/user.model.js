const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        minlength: 3,
        maxlength: 50,
        unique: [true, "Username is required"],
        required: [true, "Username must be unique"]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: [true, "email must be unique"],
        required: [true, "email is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select:false
    }
})

const userModel = mongoose.model("modify-users", userSchema);

module.exports = userModel;

/**
 * Task to learn
userSchema.pre("save",function(next){});
userSchema.post("save",function(next){});
*/