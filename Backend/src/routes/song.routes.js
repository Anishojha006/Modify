const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware.js");
const songController = require("../controllers/song.controller.js");
const  adminVerification = require("../middlewares/requireAmin.js");

/**
 * @api  api/songs
 * @description  this api is used to upload an song 
 */
router.post("/",adminVerification, upload.any(), songController.uploadSong);
router.delete("/:id", adminVerification, songController.deleteSong);

/**
 * @api api/songs/
 * @description this api is used to return an song with repect to corresponding mood
 */
router.get("/",songController.getSong);

module.exports = router;
