const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware.js");
const songController = require("../controllers/song.controller.js");
/**
 * @api  api/songs
 * @description  this api is used to upload an song 
 */
router.post("/",upload.single("song"),songController.uploadSong);

/**
 * @api api/songs/mood
 * @description this api is used ti return an song with repect to corresponding mood
 */
router.get("/",songController.getSong);

module.exports = router;