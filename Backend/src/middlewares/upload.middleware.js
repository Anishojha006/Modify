const multer = require("multer");

const storage = multer.memoryStorage();
const allowedAudioTypes = new Set([
    "audio/aac",
    "audio/flac",
    "audio/mp4",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "audio/x-flac",
    "audio/x-m4a",
    "audio/x-wav",
]);

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 1,
        fields: 1,
        parts: 2,
    },
    fileFilter(req, file, callback) {
        if (!allowedAudioTypes.has(file.mimetype)) {
            const error = new Error("Upload must be a supported audio file.");
            error.status = 415;
            error.code = "UNSUPPORTED_MEDIA_TYPE";
            return callback(error);
        }

        return callback(null, true);
    },
});

module.exports = upload;