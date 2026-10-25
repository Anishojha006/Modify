const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50
    },
    passwordHash: {
        type: String,
        immutable: true
    },
},
{
    timestamps:true,
});

const adminModel = mongoose.model("Admin",adminSchema);

module.exports = adminModel;
