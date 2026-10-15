const ImageKit = require('@imagekit/nodejs');
const { toFile } = require('@imagekit/nodejs');

const DEFAULT_POSTER = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' +
    'c0Q8AAAAAXNSR0IArs4c6QAAAABJRU5ErkJggg==',
    'base64'
);

function getImageBuffer(buffer) {
    if (!buffer) return null;
    if (Buffer.isBuffer(buffer)) return buffer;
    if (buffer.imageBuffer && Buffer.isBuffer(buffer.imageBuffer)) return buffer.imageBuffer;
    if (buffer.data && Buffer.isBuffer(buffer.data)) return buffer.data;
    return null;
}

async function uploadFile({ buffer, filename, folder = "" }) {
    const uploadBuffer = buffer && Buffer.isBuffer(buffer)
        ? buffer
        : getImageBuffer(buffer);

    if (!uploadBuffer || uploadBuffer.length === 0) {
        throw new Error('No file buffer provided for upload.');
    }

    const client = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    return client.files.upload({
        file: await toFile(uploadBuffer, filename),
        fileName: filename,
        folder,
        useUniqueFileName: true,
    });
}

module.exports = { uploadFile, DEFAULT_POSTER };