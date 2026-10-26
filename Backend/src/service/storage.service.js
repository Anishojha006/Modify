
const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const DEFAULT_POSTER = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF" +
    "c0Q8AAAAAXNSR0IArs4c6QAAAABJRU5ErkJggg==",
    "base64"
);

function getImageBuffer(buffer) {
    if (!buffer) return null;

    if (Buffer.isBuffer(buffer)) {
        return buffer;
    }

    if (
        buffer.imageBuffer &&
        Buffer.isBuffer(buffer.imageBuffer)
    ) {
        return buffer.imageBuffer;
    }

    if (
        buffer.data &&
        Buffer.isBuffer(buffer.data)
    ) {
        return buffer.data;
    }

    return null;
}

async function uploadFile({ buffer, filename, folder = "" }) {
    try {

        if (!filename) {
            throw new Error("Filename is required.");
        }

        // Get a valid Node.js Buffer
        const uploadBuffer = Buffer.isBuffer(buffer)
            ? buffer
            : getImageBuffer(buffer);

        if (!uploadBuffer || uploadBuffer.length === 0) {
            throw new Error("No file buffer provided for upload.");
        }

        // Validate ImageKit configuration
        if (!process.env.IMAGEKIT_PRIVATE_KEY) {
            throw new Error(
                "IMAGEKIT_PRIVATE_KEY is missing from environment variables."
            );
        }

        // Initialize ImageKit client
        const client = new ImageKit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        });

        // Upload file to ImageKit
        const uploadedFile = await client.files.upload({
            file: await toFile(uploadBuffer, filename),
            fileName: filename,
            folder,
            useUniqueFileName: true,
        });

        return uploadedFile;
    } catch (error) {
        console.error("File upload failed:", error.message);
        throw error;
    }
}

async function deleteFile(fileId) {
    if (!fileId) return;

    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error(
            "IMAGEKIT_PRIVATE_KEY is missing from environment variables."
        );
    }

    const client = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    });

    await client.files.delete(fileId);
}

module.exports = {
    uploadFile,
    deleteFile,
    DEFAULT_POSTER,
};
