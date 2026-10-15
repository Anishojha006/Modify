const songModel = require("../models/song.model");
const id3 = require("node-id3");
const storageServices = require("../service/storage.service.js");

const VALID_MOODS = new Set(["sad", "happy", "surprised", "angry", "neutral"]);

function normalizeMood(mood) {
    if (typeof mood !== "string") return "";
    return mood.trim().toLowerCase();
}

function getSafeTitle(file, tags) {
    const rawTitle = tags?.title || file?.originalname || "untitled-song";
    const title = rawTitle
        .replace(/\.[^/.]+$/, "")
        .replace(/[<>:"/\\|?*]+/g, "")
        .trim();

    return title || "untitled-song";
}

function getPosterBuffer(tags) {
    const image = tags?.image;
    if (Buffer.isBuffer(image)) return image;
    if (image && Buffer.isBuffer(image.imageBuffer)) return image.imageBuffer;
    if (image && Buffer.isBuffer(image.data)) return image.data;
    return storageServices.DEFAULT_POSTER;
}

async function uploadSong(req, res) {
    try {
        const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);

        if (!uploadedFile) {
            return res.status(400).json({ message: "No song file uploaded." });
        }

        const songBuffer = uploadedFile.buffer;
        const tags = id3.read(songBuffer) || {};
        const explicitMood = normalizeMood(req.body.mood);
        const fieldMood = normalizeMood(uploadedFile.fieldname);
        const mood = explicitMood || fieldMood;

        if (!VALID_MOODS.has(mood)) {
            return res.status(400).json({
                message: "Mood is required and must be one of sad, happy, surprised, angry, neutral.",
            });
        }

        const title = getSafeTitle(uploadedFile, tags);
        const posterBuffer = getPosterBuffer(tags);

        const [storageFile, posterFile] = await Promise.all([
            storageServices.uploadFile({
                buffer: songBuffer,
                filename: `${title}.mp3`,
                folder: "/cohort-2/moodify",
            }),
            storageServices.uploadFile({
                buffer: posterBuffer,
                filename: `${title}.jpeg`,
                folder: "/cohort-2/moodify/posters",
            }),
        ]);

        const song = await songModel.create({
            title,
            url: storageFile.url,
            posterUrl: posterFile.url,
            mood,
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

async function getSong(req, res) {
    try {
        const mood = normalizeMood(req.query.mood);

        const song = await songModel.aggregate([
            {
                $match: {
                    mood,
                },
            },
            {
                $sample: {
                    size: 1,
                },
            },
        ]);

        res.status(200).json({
            message: "song fetched successfully",
            song,
        });
    } catch (error) {
        console.error("Error fetching song:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

module.exports = {
    uploadSong,
    getSong,
};