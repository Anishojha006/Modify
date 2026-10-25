const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware.js");
const songController = require("../controllers/song.controller.js");
const adminVerification = require("../middlewares/requireAdmin.js");

/**
 * @api  api/songs
 * @description Upload a song.
 */
router.post("/",adminVerification, upload.any(), songController.uploadSong);
router.delete("/:id", adminVerification, songController.deleteSong);

/**
 * @api api/songs/
 * @description Return a song matching the requested mood.
 */
router.get("/",songController.getSong);

module.exports = router;
