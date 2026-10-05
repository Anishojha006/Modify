const ImageKit = require('@imagekit/nodejs');


async function uploadFile({ buffer, filename, folder = "" }) {
    const client = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    });

    const response = await client.files.upload({
        file: fs.createReadStream('path/to/file'),
        fileName: 'file-name.jpg',
    });

    const file = await client.files.upload({
        file: await toFile(Buffer.from(buffer)),
        fileName: filename,
        folder
    })
    return file;
}

module.exports = { uploadFile };