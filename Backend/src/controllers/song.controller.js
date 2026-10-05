const songModel = require("../models/song.model");
const id3 = require("node-id3");
const storageServices = require("../service/storage.service.js");

async function uploadSong(req, res) {
    try {
        const songBuffer = req.file.buffer;

        const tags = id3.read(songBuffer);

        const { mood } = req.body;

        // Upload song and poster simultaneously
        const [storageFile, posterFile] = await Promise.all([
            storageServices.uploadFile({
                buffer: songBuffer,
                filename: tags.title + ".mp3",
                folder: "/cohort-2/moodify",
            }),

            storageServices.uploadFile({
                buffer: tags.image,
                filename: tags.title + ".jpeg",
                folder: "/cohort-2/moodify/posters",
            }),
        ]);

        // Create database record after both uploads are completed
        const song = await songModel.create({
            title: tags.title,
            url: storageFile.url,
            posterUrl: posterFile.url,
            mood: mood,
        });

        res.status(201).json({
            message: "Song created successfully",
            song,
        });
    } catch (error) {
        console.error("Error uploading song:", error);

        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = {
    uploadSong,
};