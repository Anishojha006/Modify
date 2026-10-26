const songModel = require("../models/song.model");
const mongoose = require("mongoose");
const id3 = require("node-id3");
const storageServices = require("../service/storage.service.js");
const { sendApiError } = require("../utils/apiError.js");

const VALID_MOODS = new Set(["sad", "happy", "surprised", "angry", "neutral"]);

function normalizeMood(mood) {
    if (typeof mood !== "string") return "";
    return mood.trim().toLowerCase();
}

function hasAudioSignature(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;

    return (
        buffer.subarray(0, 3).toString("ascii") === "ID3"
        || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
        || (
            buffer.subarray(0, 4).toString("ascii") === "RIFF"
            && buffer.subarray(8, 12).toString("ascii") === "WAVE"
        )
        || buffer.subarray(0, 4).toString("ascii") === "fLaC"
        || buffer.subarray(0, 4).toString("ascii") === "OggS"
        || buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
        || buffer.subarray(4, 8).toString("ascii") === "ftyp"
    );
}

function getAudioFileExtension(file) {
    const extensionsByMimeType = {
        "audio/aac": ".aac",
        "audio/flac": ".flac",
        "audio/mp4": ".m4a",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "audio/webm": ".webm",
        "audio/x-flac": ".flac",
        "audio/x-m4a": ".m4a",
        "audio/x-wav": ".wav",
    };

    return extensionsByMimeType[file.mimetype];
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
    const data = req.user;
    if (data.role !== "admin") {
       return sendApiError(res, 401, "Unauthorized access");
    }
    const uploadedFiles = [];

    try {
        const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);

        if (!uploadedFile) {
            return sendApiError(res, 400, "No song file uploaded.");
        }

        const songBuffer = uploadedFile.buffer;
        if (!hasAudioSignature(songBuffer)) {
            return sendApiError(res, 415, "Uploaded file content is not a supported audio format.");
        }

        const tags = id3.read(songBuffer) || {};
        const explicitMood = normalizeMood(req.body.mood);
        const fieldMood = normalizeMood(uploadedFile.fieldname);
        const mood = explicitMood || fieldMood;

        if (!VALID_MOODS.has(mood)) {
            return sendApiError(
                res,
                400,
                "Mood is required and must be one of sad, happy, surprised, angry, neutral."
            );
        }

        const existingSong = await songModel.findOne({ mood }).select("_id title");
        if (existingSong) {
            return sendApiError(
                res,
                409,
                `A song already exists for the ${mood} mood. Delete it before uploading another.`,
                undefined,
                { song: existingSong }
            );
        }

        const title = getSafeTitle(uploadedFile, tags);
        const posterBuffer = getPosterBuffer(tags);

        const uploadResults = await Promise.allSettled([
            storageServices.uploadFile({
                buffer: songBuffer,
                filename: `${title}${getAudioFileExtension(uploadedFile)}`,
                folder: "/cohort-2/moodify",
            }),
            storageServices.uploadFile({
                buffer: posterBuffer,
                filename: `${title}.jpeg`,
                folder: "/cohort-2/moodify/posters",
            }),
        ]);
        uploadResults.forEach((result) => {
            if (result.status === "fulfilled") {
                uploadedFiles.push(result.value);
            }
        });

        const failedUpload = uploadResults.find((result) => result.status === "rejected");
        if (failedUpload) {
            throw failedUpload.reason;
        }

        const [storageFile, posterFile] = uploadResults.map((result) => result.value);

        const song = await songModel.create({
            title,
            url: storageFile.url,
            posterUrl: posterFile.url,
            fileId: storageFile.fileId,
            posterFileId: posterFile.fileId,
            mood,
        });

        return res.status(201).json({
            message: "Song created successfully",
            song,
        });
    } catch (error) {
        const cleanupResults = await Promise.allSettled(
            uploadedFiles
                .map((file) => file.fileId)
                .filter(Boolean)
                .map((fileId) => storageServices.deleteFile(fileId))
        );
        cleanupResults.forEach((result) => {
            if (result.status === "rejected") {
                console.error("Unable to clean up an uploaded song asset:", result.reason);
            }
        });

        if (error.code === 11000 && error.keyPattern?.mood) {
            return sendApiError(
                res,
                409,
                "A song already exists for this mood. Delete it before uploading another."
            );
        }

        console.error("Error uploading song:", error);

        return sendApiError(res, 500, "Unable to upload song.");
    }
}

async function deleteSong(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return sendApiError(res, 400, "Invalid song ID.");
        }

        const song = await songModel.findById(req.params.id);
        if (!song) {
            return sendApiError(res, 404, "Song not found.");
        }

        const fileIds = [song.fileId, song.posterFileId].filter(Boolean);
        await Promise.all(fileIds.map((fileId) => storageServices.deleteFile(fileId)));
        await song.deleteOne();

        return res.status(200).json({
            message: "Song deleted successfully.",
            ...(fileIds.length < 2 && {
                warning: "One or more stored files did not have a saved ImageKit file ID and may remain in storage.",
            }),
        });
    } catch (error) {
        console.error("Error deleting song:", error);
        return sendApiError(res, 500, "Unable to delete song.");
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
        return sendApiError(res, 500, "Unable to fetch song.");
    }
}

module.exports = {
    uploadSong,
    deleteSong,
    getSong,
};