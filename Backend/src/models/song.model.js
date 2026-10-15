const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    posterUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    mood: {
        type: String,
        lowercase: true,
        enum: {
            values: ["sad", "happy", "surprised", "angry", "neutral"],
            message: "Mood must be one of sad, happy, surprised, angry, neutral",
        },
    },
});

const songModel = mongoose.model("songs", songSchema);

module.exports = songModel;